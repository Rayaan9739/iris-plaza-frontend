import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { NotificationsService } from "@/modules/notifications/notifications.service";
import { EventEmitterService } from "@/common/services/event-emitter.service";
import { CreateMaintenanceDto } from "./dto/create-maintenance.dto";

@Injectable()
export class MaintenanceService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private eventEmitter: EventEmitterService,
  ) {}

  private mapMaintenanceStatus(status: string) {
    const normalized = String(status || "").toUpperCase();
    if (normalized === "RESOLVED") return "APPROVED";
    if (normalized === "CLOSED") return "REJECTED";
    return "PENDING";
  }

  async findMyTickets(userId: string) {
    try {
      const tickets = await this.prisma.maintenanceTicket.findMany({
        where: { tenantId: userId } as any,
        orderBy: { createdAt: "desc" },
      });

      // Map status to PENDING/APPROVED/REJECTED for frontend compatibility
      return tickets.map((ticket: any) => ({
        ...ticket,
        status: this.mapMaintenanceStatus(ticket.status),
      }));
    } catch (error: any) {
      console.error("Error fetching tickets:", error);
      // Return empty array instead of crashing
      return [];
    }
  }

  async create(userId: string, dto: CreateMaintenanceDto) {
    try {
      // Validate DTO
      if (!dto) {
        throw new BadRequestException("Invalid maintenance request data");
      }

      if (!dto.title || !dto.category) {
        throw new BadRequestException("title and category are required");
      }

      const normalizedCategory = String(dto.category || "")
        .trim()
        .replace(/\s+/g, "_")
        .toUpperCase();

      // Normalize priority to enum value
      const priorityStr = String(dto.priority || "MEDIUM").toUpperCase();
      const validPriorities = ["LOW", "MEDIUM", "HIGH", "URGENT"];
      const normalizedPriority = validPriorities.includes(priorityStr)
        ? priorityStr
        : "MEDIUM";

      // Build the ticket data
      const ticketData: any = {
        title: dto.title,
        description: dto.description || "",
        category: normalizedCategory,
        tenantId: userId,
        priority: normalizedPriority,
      };

      const created = await this.prisma.maintenanceTicket.create({
        data: ticketData,
      });

      const admins = await this.prisma.user.findMany({
        where: { role: "ADMIN", isActive: true },
        select: { id: true },
      });
      for (const admin of admins) {
        await this.notificationsService.create(admin.id, {
          type: "PUSH",
          title: "New maintenance request",
          message: `New ${normalizedCategory} request from tenant.`,
        });
      }

      this.eventEmitter.emitDashboardUpdate(userId, { maintenanceCreated: true });
      return created;
    } catch (error) {
      console.error("Error creating maintenance ticket:", error);
      throw error;
    }
  }

  async findOne(id: string) {
    const ticket = await this.prisma.maintenanceTicket.findUnique({
      where: { id },
      include: {
        tenant: true,
        booking: {
          include: {
            room: true,
          },
        },
      } as any,
    });
    if (!ticket) throw new NotFoundException("Ticket not found");
    return ticket;
  }

  async updateStatus(id: string, status: string, resolution?: string) {
    return this.prisma.maintenanceTicket.update({
      where: { id },
      data: {
        status: status as any,
        resolution,
        resolvedAt:
          status === "RESOLVED" || status === "CLOSED" ? new Date() : null,
      },
    });
  }

  async findAll() {
    try {
      return await this.prisma.maintenanceTicket.findMany({
        include: {
          tenant: true,
          booking: {
            include: {
              room: true,
            },
          },
        } as any,
        orderBy: { createdAt: "desc" },
      });
    } catch (error) {
      console.error("Error fetching all maintenance tickets:", error);
      return [];
    }
  }

  /**
   * Approve a maintenance request
   */
  async approveRequest(ticketId: string) {
    const ticket = await this.prisma.maintenanceTicket.findUnique({
      where: { id: ticketId },
      include: {
        tenant: true,
        booking: {
          include: {
            room: true,
          },
        },
      } as any,
    });
    if (!ticket) throw new NotFoundException("Ticket not found");

    // Update ticket status to RESOLVED (approved)
    const updated = await this.prisma.maintenanceTicket.update({
      where: { id: ticketId },
      data: {
        status: "RESOLVED" as any,
        resolvedAt: new Date(),
      },
      include: {
        tenant: true,
        booking: {
          include: {
            room: true,
          },
        },
      } as any,
    });

    return updated;
  }

  /**
   * Reject a maintenance request
   */
  async rejectRequest(ticketId: string, reason?: string) {
    return this.prisma.maintenanceTicket.update({
      where: { id: ticketId },
      data: {
        status: "CLOSED" as any,
        resolution: reason,
        resolvedAt: new Date(),
      },
    });
  }
}
