import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "@/prisma/prisma.service";
import {
  SignUpDto,
  SignInDto,
  RefreshTokenDto,
  SetDobDto,
} from "./dto/auth.dto";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  private normalizeDobInput(value: string, fieldName = "dob") {
    const parsed = new Date(String(value || "").trim());
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException(`${fieldName} must be a valid ISO date`);
    }
    return new Date(
      Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate()),
    );
  }

  private toIsoDateKey(value: Date | string | null | undefined) {
    if (!value) return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    const year = parsed.getUTCFullYear();
    const month = String(parsed.getUTCMonth() + 1).padStart(2, "0");
    const day = String(parsed.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  /**
   * Sign up - Create new tenant account (active immediately)
   */
  async signUp(signUpDto: SignUpDto) {
    const { phone, email, firstName, lastName, dob } = signUpDto;
    const normalizedDob = this.normalizeDobInput(dob, "dob");

    // Check if user already exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ phone }, ...(email ? [{ email }] : [])],
      },
    });

    if (existingUser) {
      throw new BadRequestException(
        "User with this phone or email already exists",
      );
    }

    // Create user as ACTIVE immediately with provided details
    const user = await this.prisma.user.create({
      data: {
        phone,
        email,
        // Legacy column kept for backward compatibility; auth no longer uses password.
        password: "DOB_AUTH_DISABLED",
        firstName,
        lastName,
        role: "TENANT",
        isApproved: true,
        accountStatus: "ACTIVE",
        tenantProfile: {
          create: {
            dateOfBirth: normalizedDob,
          },
        },
      },
      include: {
        tenantProfile: true,
      },
    });

    await this.prisma.$executeRaw`
      UPDATE users
      SET dob = ${normalizedDob}
      WHERE id = ${user.id}
    `;

    // Try to update tenant profile with identity details (if fields exist in DB)
    // This will be skipped if prisma client hasn't been regenerated
    const { fatherName, relation, aadhaarNumber, gender, tenantAddress, collegeName } = signUpDto as any;
    if (fatherName || relation || aadhaarNumber || gender || tenantAddress || collegeName) {
      try {
        await this.prisma.tenantProfile.update({
          where: { userId: user.id },
          data: {
            ...(fatherName && { fatherName }),
            ...(relation && { relation }),
            ...(aadhaarNumber && { aadhaarNumber }),
            ...(gender && { gender }),
            ...(tenantAddress && { tenantAddress }),
            ...(collegeName && { collegeName }),
          },
        });
      } catch (err) {
        // Ignore errors - fields may not exist yet in database
        this.logger.log("Tenant profile update skipped - fields may not exist yet");
      }
    }

    const tokens = await this.generateTokens(user.id, user.phone, user.role);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
      message: "Registration successful.",
    };
  }

  /**
   * Sign in - Login with phone and DOB
   */
  async signIn(signInDto: SignInDto) {
    const { phone, dob } = signInDto;
    const normalizedDob = this.normalizeDobInput(dob, "dob");

    const user = await this.prisma.user.findUnique({
      where: { phone },
    });

    if (!user) {
      throw new UnauthorizedException("Invalid phone or DOB");
    }

    // Check if account is suspended
    if (user.accountStatus === "SUSPENDED") {
      throw new UnauthorizedException("Account is suspended");
    }

    // Check if account is rejected
    if (user.accountStatus === "REJECTED") {
      throw new UnauthorizedException("Account has been rejected");
    }

    const dobRows = await this.prisma.$queryRaw<Array<{ dob: Date | null }>>`
      SELECT dob
      FROM users
      WHERE id = ${user.id}
      LIMIT 1
    `;
    const storedDob = dobRows[0]?.dob ?? null;

    if (!storedDob) {
      return {
        message: "Please set DOB to continue",
        code: "DOB_REQUIRED",
      };
    }

    const storedDobKey = this.toIsoDateKey(storedDob);
    const inputDobKey = this.toIsoDateKey(normalizedDob);
    if (!storedDobKey || !inputDobKey || storedDobKey !== inputDobKey) {
      throw new UnauthorizedException("Invalid DOB");
    }

    // Generate tokens for active users
    const tokens = await this.generateTokens(user.id, user.phone, user.role);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async setDob(setDobDto: SetDobDto) {
    const normalizedPhone = String(setDobDto.phone || "").trim();
    if (!normalizedPhone) {
      throw new BadRequestException("phone is required");
    }

    const normalizedDob = this.normalizeDobInput(setDobDto.dob, "dob");
    const user = await this.prisma.user.findUnique({
      where: { phone: normalizedPhone },
      select: { id: true },
    });

    if (!user) {
      throw new BadRequestException("User with this phone does not exist");
    }

    await this.prisma.$executeRaw`
      UPDATE users
      SET dob = ${normalizedDob}
      WHERE id = ${user.id}
    `;

    return {
      message: "DOB set successfully",
      code: "DOB_SET",
    };
  }

  /**
   * Refresh access tokens
   */
  async refreshTokens(refreshTokenDto: RefreshTokenDto) {
    const { refreshToken } = refreshTokenDto;

    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedException("Invalid or expired refresh token");
    }

    // Check if user is still active
    if (tokenRecord.user.accountStatus !== "ACTIVE") {
      throw new UnauthorizedException("Account is not active");
    }

    // Delete old refresh token
    await this.prisma.refreshToken.delete({
      where: { id: tokenRecord.id },
    });

    // Generate new tokens
    const tokens = await this.generateTokens(
      tokenRecord.user.id,
      tokenRecord.user.phone,
      tokenRecord.user.role,
    );

    return tokens;
  }

  /**
   * Validate user for JWT strategy
   */
  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        tenantProfile: true,
      },
    });

    if (!user || user.accountStatus === "SUSPENDED") {
      return null;
    }

    return this.sanitizeUser(user);
  }

  /**
   * Check if user can perform booking actions
   */
  canPerformBooking(user: any): boolean {
    return (
      user.accountStatus === "ACTIVE"
    );
  }

  /**
   * Generate JWT tokens
   */
  private async generateTokens(
    userId: string,
    phone: string,
    role: string,
  ) {
    const payload = { sub: userId, phone, role };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: "15m",
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: "7d",
    });

    // Store refresh token
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        expiresAt,
        userId,
      },
    });

    return { accessToken, refreshToken };
  }

  /**
   * Remove sensitive data from user object
   */
  private sanitizeUser(user: any) {
    const { password, ...sanitized } = user;
    return sanitized;
  }
}
