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
exports.MaintenanceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
const event_emitter_service_1 = require("../../common/services/event-emitter.service");
let MaintenanceService = class MaintenanceService {
    constructor(prisma, notificationsService, eventEmitter) {
        this.prisma = prisma;
        this.notificationsService = notificationsService;
        this.eventEmitter = eventEmitter;
    }
    mapMaintenanceStatus(status) {
        const normalized = String(status || "").toUpperCase();
        if (normalized === "RESOLVED")
            return "APPROVED";
        if (normalized === "CLOSED")
            return "REJECTED";
        return "PENDING";
    }
    async findMyTickets(userId) {
        try {
            const tickets = await this.prisma.maintenanceTicket.findMany({
                where: { tenantId: userId },
                orderBy: { createdAt: "desc" },
            });
            return tickets.map((ticket) => ({
                ...ticket,
                status: this.mapMaintenanceStatus(ticket.status),
            }));
        }
        catch (error) {
            console.error("Error fetching tickets:", error);
            return [];
        }
    }
    async create(userId, dto) {
        try {
            if (!dto) {
                throw new common_1.BadRequestException("Invalid maintenance request data");
            }
            if (!dto.title || !dto.category) {
                throw new common_1.BadRequestException("title and category are required");
            }
            const normalizedCategory = String(dto.category || "")
                .trim()
                .replace(/\s+/g, "_")
                .toUpperCase();
            const priorityStr = String(dto.priority || "MEDIUM").toUpperCase();
            const validPriorities = ["LOW", "MEDIUM", "HIGH", "URGENT"];
            const normalizedPriority = validPriorities.includes(priorityStr)
                ? priorityStr
                : "MEDIUM";
            const ticketData = {
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
        }
        catch (error) {
            console.error("Error creating maintenance ticket:", error);
            throw error;
        }
    }
    async findOne(id) {
        const ticket = await this.prisma.maintenanceTicket.findUnique({
            where: { id },
            include: {
                tenant: true,
                booking: {
                    include: {
                        room: true,
                    },
                },
            },
        });
        if (!ticket)
            throw new common_1.NotFoundException("Ticket not found");
        return ticket;
    }
    async updateStatus(id, status, resolution) {
        return this.prisma.maintenanceTicket.update({
            where: { id },
            data: {
                status: status,
                resolution,
                resolvedAt: status === "RESOLVED" || status === "CLOSED" ? new Date() : null,
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
                },
                orderBy: { createdAt: "desc" },
            });
        }
        catch (error) {
            console.error("Error fetching all maintenance tickets:", error);
            return [];
        }
    }
    async approveRequest(ticketId) {
        const ticket = await this.prisma.maintenanceTicket.findUnique({
            where: { id: ticketId },
            include: {
                tenant: true,
                booking: {
                    include: {
                        room: true,
                    },
                },
            },
        });
        if (!ticket)
            throw new common_1.NotFoundException("Ticket not found");
        const updated = await this.prisma.maintenanceTicket.update({
            where: { id: ticketId },
            data: {
                status: "RESOLVED",
                resolvedAt: new Date(),
            },
            include: {
                tenant: true,
                booking: {
                    include: {
                        room: true,
                    },
                },
            },
        });
        return updated;
    }
    async rejectRequest(ticketId, reason) {
        return this.prisma.maintenanceTicket.update({
            where: { id: ticketId },
            data: {
                status: "CLOSED",
                resolution: reason,
                resolvedAt: new Date(),
            },
        });
    }
};
exports.MaintenanceService = MaintenanceService;
exports.MaintenanceService = MaintenanceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService,
        event_emitter_service_1.EventEmitterService])
], MaintenanceService);
//# sourceMappingURL=maintenance.service.js.map