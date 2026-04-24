import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { NotificationType, Prisma } from '@prisma/client';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async findMyNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUnreadCount(userId: string) {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  async markAsRead(notificationId: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async create(userId: string, data: {
    type: NotificationType;
    title: string;
    message: string;
    metadata?: Prisma.InputJsonValue;
  }) {
    return this.prisma.notification.create({
      data: {
        type: data.type,
        title: data.title,
        message: data.message,
        metadata: data.metadata,
        userId,
      },
    });
  }

  async sendNotification(userId: string, data: {
    type: NotificationType;
    title: string;
    message: string;
    metadata?: Prisma.InputJsonValue;
  }) {
    // Create and mark as sent
    return this.prisma.notification.create({
      data: {
        type: data.type,
        title: data.title,
        message: data.message,
        metadata: data.metadata,
        userId,
      },
    });
  }

  async sendBulkNotifications(userIds: string[], data: {
    type: NotificationType;
    title: string;
    message: string;
    metadata?: Prisma.InputJsonValue;
  }) {
    const notifications = userIds.map(userId => ({
      userId,
      type: data.type,
      title: data.title,
      message: data.message,
      metadata: data.metadata,
    }));
    return this.prisma.notification.createMany({ data: notifications });
  }

  // Helper methods for specific notification types
  async notifyRentReminder(userId: string, dueDate: Date, amount: number) {
    return this.sendNotification(userId, {
      type: 'RENT_REMINDER' as NotificationType,
      title: 'Rent Payment Reminder',
      message: `Reminder: Your rent for this month is due on ${dueDate.toLocaleDateString()}. Please complete the payment before the due date.`,
    });
  }

  async notifyRentOverdue(userId: string) {
    return this.sendNotification(userId, {
      type: 'RENT_OVERDUE' as NotificationType,
      title: 'Rent Payment Overdue',
      message: 'Your rent payment is overdue. Please complete your payment immediately.',
    });
  }

  async notifyPaymentApproved(userId: string, amount: number, month: string) {
    return this.sendNotification(userId, {
      type: 'PAYMENT_APPROVED' as NotificationType,
      title: 'Payment Approved',
      message: `Your rent payment of Rs ${amount} for ${month} has been approved.`,
    });
  }

  async notifyPaymentRejected(userId: string, month: string) {
    return this.sendNotification(userId, {
      type: 'PAYMENT_REJECTED' as NotificationType,
      title: 'Payment Rejected',
      message: `Your payment screenshot for ${month} was rejected. Please upload valid proof.`,
    });
  }

  async notifyDocumentApproved(userId: string, documentName: string) {
    return this.sendNotification(userId, {
      type: 'DOCUMENT_APPROVED' as NotificationType,
      title: 'Document Approved',
      message: `Your document "${documentName}" has been successfully verified.`,
    });
  }

  async notifyDocumentRejected(userId: string, documentName: string, reason?: string) {
    return this.sendNotification(userId, {
      type: 'DOCUMENT_REJECTED' as NotificationType,
      title: 'Document Rejected',
      message: `Your document "${documentName}" was rejected. ${reason || 'Please upload a valid document.'}`,
    });
  }

  async notifyMaintenanceUpdate(userId: string, ticketTitle: string, status: string) {
    return this.sendNotification(userId, {
      type: 'MAINTENANCE_UPDATE' as NotificationType,
      title: 'Maintenance Request Update',
      message: `Your maintenance request "${ticketTitle}" status has been updated to: ${status}`,
    });
  }

  async notifyAnnouncement(userId: string, title: string, message: string) {
    return this.sendNotification(userId, {
      type: 'ANNOUNCEMENT' as NotificationType,
      title,
      message,
    });
  }
}
