import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private notificationsService;
    constructor(notificationsService: NotificationsService);
    getMyNotifications(req: any): Promise<{
        type: import(".prisma/client").$Enums.NotificationType;
        title: string;
        id: string;
        createdAt: Date;
        userId: string;
        message: string;
        isRead: boolean;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        readAt: Date | null;
    }[]>;
    getUnreadCount(req: any): Promise<{
        count: number;
    }>;
    markAllNotificationsRead(req: any): Promise<import(".prisma/client").Prisma.BatchPayload>;
    markNotificationRead(id: string, req: any): Promise<import(".prisma/client").Prisma.BatchPayload>;
}
