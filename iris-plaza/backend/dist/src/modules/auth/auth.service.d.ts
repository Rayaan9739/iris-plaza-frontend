import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "@/prisma/prisma.service";
import { SignUpDto, SignInDto, RefreshTokenDto, SetDobDto } from "./dto/auth.dto";
export declare class AuthService {
    private prisma;
    private jwtService;
    private readonly logger;
    constructor(prisma: PrismaService, jwtService: JwtService);
    private normalizeDobInput;
    private toIsoDateKey;
    signUp(signUpDto: SignUpDto): Promise<{
        message: string;
        accessToken: string;
        refreshToken: string;
        user: any;
    }>;
    signIn(signInDto: SignInDto): Promise<{
        message: string;
        code: string;
    } | {
        accessToken: string;
        refreshToken: string;
        user: any;
        message?: undefined;
        code?: undefined;
    }>;
    setDob(setDobDto: SetDobDto): Promise<{
        message: string;
        code: string;
    }>;
    refreshTokens(refreshTokenDto: RefreshTokenDto): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    validateUser(userId: string): Promise<any>;
    canPerformBooking(user: any): boolean;
    private generateTokens;
    private sanitizeUser;
}
