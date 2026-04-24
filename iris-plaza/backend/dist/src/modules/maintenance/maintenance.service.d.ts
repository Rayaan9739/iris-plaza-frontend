import { PrismaService } from "@/prisma/prisma.service";
import { NotificationsService } from "@/modules/notifications/notifications.service";
import { EventEmitterService } from "@/common/services/event-emitter.service";
import { CreateMaintenanceDto } from "./dto/create-maintenance.dto";
export declare class MaintenanceService {
    private prisma;
    private notificationsService;
    private eventEmitter;
    constructor(prisma: PrismaService, notificationsService: NotificationsService, eventEmitter: EventEmitterService);
    private mapMaintenanceStatus;
    findMyTickets(userId: string): Promise<any[]>;
    create(userId: string, dto: CreateMaintenanceDto): Promise<{
        description: string;
        title: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.TicketStatus;
        bookingId: string | null;
        tenantId: string;
        category: string;
        priority: import(".prisma/client").$Enums.TicketPriority;
        requestedAmount: import("@prisma/client/runtime/library").Decimal | null;
        resolvedAt: Date | null;
        resolution: string | null;
    }>;
    findOne(id: string): Promise<{
        [x: string]: never;
        [x: number]: never;
        [x: symbol]: never;
    } & {
        description: string;
        title: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.TicketStatus;
        bookingId: string | null;
        tenantId: string;
        category: string;
        priority: import(".prisma/client").$Enums.TicketPriority;
        requestedAmount: import("@prisma/client/runtime/library").Decimal | null;
        resolvedAt: Date | null;
        resolution: string | null;
    }>;
    updateStatus(id: string, status: string, resolution?: string): Promise<{
        description: string;
        title: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.TicketStatus;
        bookingId: string | null;
        tenantId: string;
        category: string;
        priority: import(".prisma/client").$Enums.TicketPriority;
        requestedAmount: import("@prisma/client/runtime/library").Decimal | null;
        resolvedAt: Date | null;
        resolution: string | null;
    }>;
    findAll(): Promise<({
        [x: string]: never;
        [x: number]: never;
        [x: symbol]: never;
    } & {
        description: string;
        title: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.TicketStatus;
        bookingId: string | null;
        tenantId: string;
        category: string;
        priority: import(".prisma/client").$Enums.TicketPriority;
        requestedAmount: import("@prisma/client/runtime/library").Decimal | null;
        resolvedAt: Date | null;
        resolution: string | null;
    })[]>;
    approveRequest(ticketId: string): Promise<{
        [x: string]: never;
        [x: number]: never;
        [x: symbol]: never;
    } & {
        description: string;
        title: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.TicketStatus;
        bookingId: string | null;
        tenantId: string;
        category: string;
        priority: import(".prisma/client").$Enums.TicketPriority;
        requestedAmount: import("@prisma/client/runtime/library").Decimal | null;
        resolvedAt: Date | null;
        resolution: string | null;
    }>;
    rejectRequest(ticketId: string, reason?: string): Promise<{
        description: string;
        title: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.TicketStatus;
        bookingId: string | null;
        tenantId: string;
        category: string;
        priority: import(".prisma/client").$Enums.TicketPriority;
        requestedAmount: import("@prisma/client/runtime/library").Decimal | null;
        resolvedAt: Date | null;
        resolution: string | null;
    }>;
}
