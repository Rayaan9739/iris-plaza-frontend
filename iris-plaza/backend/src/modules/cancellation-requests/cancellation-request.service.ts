import { Injectable, BadRequestException } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { PrismaService } from "../../prisma/prisma.service";
import { CancellationRequestDto } from "./dto/create-cancellation-request.dto";
import { NotificationsService } from "../notifications/notifications.service";
import { NotificationType } from "@prisma/client";

@Injectable()
export class CancellationRequestService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async create(dto: CancellationRequestDto, tenantId: string) {
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
      throw new BadRequestException("Booking not found");
    }

    // Check if booking can be cancelled
    const cancellableStatuses = ["APPROVED", "APPROVED_PENDING_PAYMENT"];
    if (!cancellableStatuses.includes(booking.status)) {
      throw new BadRequestException(
        `Cannot cancel booking with status ${booking.status}. Only confirmed bookings can be cancelled.`
      );
    }

    // Check if there's already a pending cancellation request
    const existingRequest = await this.prisma.cancellationRequest.findUnique({
      where: { bookingId: dto.bookingId },
    });

    if (existingRequest && existingRequest.status === "PENDING") {
      throw new BadRequestException("A cancellation request is already pending");
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

    // Notify tenant that request was submitted.
    await this.notificationsService.create(tenantId, {
      type: NotificationType.SYSTEM,
      title: "Cancellation Request Submitted",
      message:
        "Your cancellation request was submitted and is pending admin approval.",
      metadata: {
        path: "/tenant/room",
        bookingId: dto.bookingId,
        cancellationRequestId: cancellationRequest.id,
        event: "CANCELLATION_REQUEST_SUBMITTED",
      },
    });

    // Notify admins that a new cancellation request is pending action.
    const admins = await this.prisma.user.findMany({
      where: { role: "ADMIN", isActive: true },
      select: { id: true },
    });
    await Promise.all(
      admins.map((admin) =>
        this.notificationsService.create(admin.id, {
          type: NotificationType.SYSTEM,
          title: "New Cancellation Request",
          message: `${
            tenantName || "A tenant"
          } requested cancellation for ${roomName}.`,
          metadata: {
            path: "/admin/cancellation-requests",
            bookingId: dto.bookingId,
            cancellationRequestId: cancellationRequest.id,
            event: "CANCELLATION_REQUEST_PENDING",
          },
        }),
      ),
    );

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

  async approveRequest(requestId: string, adminId: string) {
    const request = await this.prisma.cancellationRequest.findUnique({
      where: { id: requestId },
      include: { booking: { include: { room: true } } },
    });

    if (!request) {
      throw new BadRequestException("Cancellation request not found");
    }

    if (request.status !== "PENDING") {
      throw new BadRequestException("Only pending requests can be approved");
    }

    const approvedAt = new Date();

    // 1. Update Booking status to CANCELLED
    await this.prisma.booking.update({
      where: { id: request.bookingId },
      data: { status: "CANCELLED" },
    });

    // Add status history
    await this.prisma.bookingStatusHistory.create({
      data: {
        bookingId: request.bookingId,
        status: "CANCELLED",
        comment: "Cancellation request approved by admin",
        changedBy: adminId,
      },
    });

    // 2. Release the room immediately
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

    // 3. Update cancellation request
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

    // Notify tenant that cancellation was approved.
    await this.notificationsService.create(request.tenantId, {
      type: NotificationType.SYSTEM,
      title: "Cancellation Approved",
      message:
        "Your cancellation request has been approved. The room has been released.",
      metadata: {
        path: "/tenant/room",
        bookingId: request.bookingId,
        cancellationRequestId: requestId,
        event: "CANCELLATION_REQUEST_APPROVED",
      },
    });

    return updatedRequest;
  }

  async rejectRequest(
    requestId: string,
    adminId: string,
    rejectionReason: string,
  ) {
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
    // Find approved requests with releaseTime <= now
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
      // Update room status to AVAILABLE
      await this.prisma.room.update({
        where: { id: request.booking.roomId },
        data: {
          status: "AVAILABLE",
          occupiedFrom: null,
          occupiedUntil: null,
          isAvailable: true,
        },
      });

      // Update booking status to CANCELLED
      await this.prisma.booking.update({
        where: { id: request.bookingId },
        data: {
          status: "CANCELLED",
        },
      });
    }

    return requestsToProcess;
  }

  @Cron("0 * * * * *") // Run every minute
  async handleCron() {
    try {
      await this.processApprovedRequests();
    } catch (error) {
      // Only log non-connection errors
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

  async getMyRequest(userId: string) {
    // Get the user's current booking
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

    // Get cancellation request for this booking
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
}
