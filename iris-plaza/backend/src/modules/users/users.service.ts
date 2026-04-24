import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { UpdateProfileDto } from "./dto/user.dto";

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { tenantProfile: true },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const { password, ...sanitized } = user;
    return sanitized;
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const {
      firstName,
      lastName,
      phone,
      dob,
      dateOfBirth,
      emergencyName,
      emergencyPhone,
      emergencyRelation,
      ...profileData
    } = updateProfileDto;

    const updateData: any = {
      firstName,
      lastName,
      phone,
    };

    // Handle dob on the User model
    if (dob !== undefined) {
      updateData.dob = dob ? new Date(dob) : null;
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...updateData,
        tenantProfile: {
          update: {
            emergencyName,
            emergencyPhone,
            emergencyRelation,
            ...(dateOfBirth !== undefined
              ? { dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null }
              : {}),
            ...profileData,
          },
        },
      },
      include: { tenantProfile: true },
    });
  }

  async getTenantById(tenantId: string) {
    const tenant = await this.prisma.user.findUnique({
      where: { id: tenantId },
      include: {
        tenantProfile: true,
        bookings: { include: { room: true } },
      },
    });

    if (!tenant) {
      throw new NotFoundException("Tenant not found");
    }

    const { password, ...sanitized } = tenant;
    return sanitized;
  }
}
