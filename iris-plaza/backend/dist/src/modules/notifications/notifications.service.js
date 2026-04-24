"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let NotificationsService = class NotificationsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findMyNotifications(userId) {
        return this.prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getUnreadCount(userId) {
        return this.prisma.notification.count({
            where: { userId, isRead: false },
        });
    }
    async markAsRead(notificationId, userId) {
        return this.prisma.notification.updateMany({
            where: { id: notificationId, userId },
            data: { isRead: true, readAt: new Date() },
        });
    }
    async markAllAsRead(userId) {
        return this.prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true, readAt: new Date() },
        });
    }
    async create(userId, data) {
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
    async sendNotification(userId, data) {
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
    async sendBulkNotifications(userIds, data) {
        const notifications = userIds.map(userId => ({
            userId,
            type: data.type,
            title: data.title,
            message: data.message,
            metadata: data.metadata,
        }));
        return this.prisma.notification.createMany({ data: notifications });
    }
    async notifyRentReminder(userId, dueDate, amount) {
        return this.sendNotification(userId, {
            type: 'RENT_REMINDER',
            title: 'Rent Payment Reminder',
            message: `Reminder: Your rent for this month is due on ${dueDate.toLocaleDateString()}. Please complete the payment before the due date.`,
        });
    }
    async notifyRentOverdue(userId) {
        return this.sendNotification(userId, {
            type: 'RENT_OVERDUE',
            title: 'Rent Payment Overdue',
            message: 'Your rent payment is overdue. Please complete your payment immediately.',
        });
    }
    async notifyPaymentApproved(userId, amount, month) {
        return this.sendNotification(userId, {
            type: 'PAYMENT_APPROVED',
            title: 'Payment Approved',
            message: `Your rent payment of Rs ${amount} for ${month} has been approved.`,
        });
    }
    async notifyPaymentRejected(userId, month) {
        return this.sendNotification(userId, {
            type: 'PAYMENT_REJECTED',
            title: 'Payment Rejected',
            message: `Your payment screenshot for ${month} was rejected. Please upload valid proof.`,
        });
    }
    async notifyDocumentApproved(userId, documentName) {
        return this.sendNotification(userId, {
            type: 'DOCUMENT_APPROVED',
            title: 'Document Approved',
            message: `Your document "${documentName}" has been successfully verified.`,
        });
    }
    async notifyDocumentRejected(userId, documentName, reason) {
        return this.sendNotification(userId, {
            type: 'DOCUMENT_REJECTED',
            title: 'Document Rejected',
            message: `Your document "${documentName}" was rejected. ${reason || 'Please upload a valid document.'}`,
        });
    }
    async notifyMaintenanceUpdate(userId, ticketTitle, status) {
        return this.sendNotification(userId, {
            type: 'MAINTENANCE_UPDATE',
            title: 'Maintenance Request Update',
            message: `Your maintenance request "${ticketTitle}" status has been updated to: ${status}`,
        });
    }
    async notifyAnnouncement(userId, title, message) {
        return this.sendNotification(userId, {
            type: 'ANNOUNCEMENT',
            title,
            message,
        });
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map