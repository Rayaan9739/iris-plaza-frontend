import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
export interface CreateContactMessageDto {
    name: string;
    email: string;
    phone?: string;
    subject: string;
    message: string;
}
export declare class ContactService {
    private readonly prisma;
    private readonly notificationsService;
    constructor(prisma: PrismaService, notificationsService: NotificationsService);
    createMessage(dto: CreateContactMessageDto): Promise<{
        success: boolean;
        message: string;
    }>;
}
