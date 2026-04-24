import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '@prisma/client';

export interface CreateContactMessageDto {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

@Injectable()
export class ContactService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async createMessage(dto: CreateContactMessageDto) {
    // Find admin users and create notifications for them
    const adminUsers = await this.prisma.user.findMany({
      where: {
        role: 'ADMIN',
      },
    });

    // Create notifications for all admins
    const notificationPromises = adminUsers.map((admin) =>
      this.notificationsService.create(admin.id, {
        type: NotificationType.ANNOUNCEMENT,
        title: `New Contact Form: ${dto.subject}`,
        message: `Name: ${dto.name}\nEmail: ${dto.email}\nPhone: ${dto.phone || 'Not provided'}\n\nMessage:\n${dto.message}`,
      }),
    );

    await Promise.all(notificationPromises);

    return {
      success: true,
      message: 'Thank you for contacting us! We will get back to you soon.',
    };
  }
}
