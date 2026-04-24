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
exports.CancellationRequestService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
const client_1 = require("@prisma/client");
let CancellationRequestService = class CancellationRequestService {
    constructor(prisma, notificationsService) {
        this.prisma = prisma;
        this.notificationsService = notificationsService;
    }
    async create(dto, tenantId) {
        const booking = await this.prisma.booking.findUnique({
            where: { id: dto.bookingId },
            include: {
                user: {
                    select: { firstName: true, lastName: true },
                },
                room: {
                    select: { name: true },
                },
            },
        });
        if (!booking) {
            throw new common_1.BadRequestException("Booking not found");
        }
        const cancellableStatuses = ["APPROVED", "APPROVED_PENDING_PAYMENT"];
        if (!cancellableStatuses.includes(booking.status)) {
            throw new common_1.BadRequestException(`Cannot cancel booking with status ${booking.status}. Only confirmed bookings can be cancelled.`);
        }
        const existingRequest = await this.prisma.cancellationRequest.findUnique({
            where: { bookingId: dto.bookingId },
        });
        if (existingRequest && existingRequest.status === "PENDING") {
            throw new common_1.BadRequestException("A cancellation request is already pending");
        }
        const cancellationRequest = await this.prisma.cancellationRequest.upsert({
            where: { bookingId: dto.bookingId },
            create: {
                bookingId: dto.bookingId,
                tenantId: tenantId,
                reason: dto.reason || null,
                status: "PENDING",
            },
            update: {
                reason: dto.reason || null,
                status: "PENDING",
                requestedAt: new Date(),
                approvedAt: null,
                approvedBy: null,
                rejectionReason: null,
                releaseTime: null,
            },
        });
        const tenantName = [booking.user?.firstName, booking.user?.lastName]
            .filter(Boolean)
            .join(" ")
            .trim();
        const roomName = String(booking.room?.name || "your room");
        await this.notificationsService.create(tenantId, {
            type: client_1.NotificationType.SYSTEM,
            title: "Cancellation Request Submitted",
            message: "Your cancellation request was submitted and is pending admin approval.",
            metadata: {
                path: "/tenant/room",
                bookingId: dto.bookingId,
                cancellationRequestId: cancellationRequest.id,
                event: "CANCELLATION_REQUEST_SUBMITTED",
            },
        });
        const admins = await this.prisma.user.findMany({
            where: { role: "ADMIN", isActive: true },
            select: { id: true },
        });
        await Promise.all(admins.map((admin) => this.notificationsService.create(admin.id, {
            type: client_1.NotificationType.SYSTEM,
            title: "New Cancellation Request",
            message: `${tenantName || "A tenant"} requested cancellation for ${roomName}.`,
            metadata: {
                path: "/admin/cancellation-requests",
                bookingId: dto.bookingId,
                cancellationRequestId: cancellationRequest.id,
                event: "CANCELLATION_REQUEST_PENDING",
            },
        })));
        return cancellationRequest;
    }
    async getPendingRequests() {
        const requests = await this.prisma.cancellationRequest.findMany({
            where: { status: "PENDING" },
            include: {
                booking: {
                    include: {
                        room: true,
                        user: true,
                    },
                },
                tenant: true,
            },
            orderBy: { requestedAt: "desc" },
        });
        return requests;
    }
    async approveRequest(requestId, adminId) {
        const request = await this.prisma.cancellationRequest.findUnique({
            where: { id: requestId },
            include: { booking: { include: { room: true } } },
        });
        if (!request) {
            throw new common_1.BadRequestException("Cancellation request not found");
        }
        if (request.status !== "PENDING") {
            throw new common_1.BadRequestException("Only pending requests can be approved");
        }
        const approvedAt = new Date();
        await this.prisma.booking.update({
            where: { id: request.bookingId },
            data: { status: "CANCELLED" },
        });
        await this.prisma.bookingStatusHistory.create({
            data: {
                bookingId: request.bookingId,
                status: "CANCELLED",
                comment: "Cancellation request approved by admin",
                changedBy: adminId,
            },
        });
        await this.prisma.room.update({
            where: { id: request.booking.roomId },
            data: {
                status: "AVAILABLE",
                isAvailable: true,
                occupiedFrom: null,
                occupiedUntil: null,
                availableAt: null,
            },
        });
        const updatedRequest = await this.prisma.cancellationRequest.update({
            where: { id: requestId },
            data: {
                status: "APPROVED",
                approvedAt,
                approvedBy: adminId,
                releaseTime: approvedAt,
            },
            include: {
                booking: {
                    include: {
                        room: true,
                        user: true,
                    },
                },
            },
        });
        await this.notificationsService.create(request.tenantId, {
            type: client_1.NotificationType.SYSTEM,
            title: "Cancellation Approved",
            message: "Your cancellation request has been approved. The room has been released.",
            metadata: {
                path: "/tenant/room",
                bookingId: request.bookingId,
                cancellationRequestId: requestId,
                event: "CANCELLATION_REQUEST_APPROVED",
            },
        });
        return updatedRequest;
    }
    async rejectRequest(requestId, adminId, rejectionReason) {
        const request = await this.prisma.cancellationRequest.findUnique({
            where: { id: requestId },
        });
        if (!request) {
            throw new Error("Cancellation request not found");
        }
        if (request.status !== "PENDING") {
            throw new Error("Only pending requests can be rejected");
        }
        const updatedRequest = await this.prisma.cancellationRequest.update({
            where: { id: requestId },
            data: {
                status: "REJECTED",
                approvedBy: adminId,
                rejectionReason,
            },
            include: {
                booking: {
                    include: {
                        room: true,
                        user: true,
                    },
                },
            },
        });
        return updatedRequest;
    }
    async processApprovedRequests() {
        const now = new Date();
        const requestsToProcess = await this.prisma.cancellationRequest.findMany({
            where: {
                status: "APPROVED",
                releaseTime: { lte: now },
            },
            include: {
                booking: {
                    include: { room: true },
                },
            },
        });
        for (const request of requestsToProcess) {
            await this.prisma.room.update({
                where: { id: request.booking.roomId },
                data: {
                    status: "AVAILABLE",
                    occupiedFrom: null,
                    occupiedUntil: null,
                    isAvailable: true,
                },
            });
            await this.prisma.booking.update({
                where: { id: request.bookingId },
                data: {
                    status: "CANCELLED",
                },
            });
        }
        return requestsToProcess;
    }
    async handleCron() {
        try {
            await this.processApprovedRequests();
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const isConnectionError = errorMessage.includes('P1001') ||
                errorMessage.includes('connection') ||
                errorMessage.includes('timeout') ||
                errorMessage.includes('database server');
            if (!isConnectionError) {
                console.error("Error processing approved cancellation requests:", error);
            }
        }
    }
    async getMyRequest(userId) {
        const booking = await this.prisma.booking.findFirst({
            where: {
                userId,
                status: {
                    in: ["APPROVED", "APPROVED_PENDING_PAYMENT"]
                }
            },
        });
        if (!booking) {
            return null;
        }
        const request = await this.prisma.cancellationRequest.findUnique({
            where: { bookingId: booking.id },
            include: {
                booking: {
                    include: {
                        room: true,
                    },
                },
            },
        });
        return request;
    }
};
exports.CancellationRequestService = CancellationRequestService;
__decorate([
    (0, schedule_1.Cron)("0 * * * * *"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CancellationRequestService.prototype, "handleCron", null);
exports.CancellationRequestService = CancellationRequestService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService])
], CancellationRequestService);
//# sourceMappingURL=cancellation-request.service.js.map