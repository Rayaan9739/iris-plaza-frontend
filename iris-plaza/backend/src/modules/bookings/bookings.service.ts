import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { BookingSource, NotificationType } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { PrismaService } from "@/prisma/prisma.service";
import { NotificationsService } from "@/modules/notifications/notifications.service";
import { AgreementsService } from "@/modules/agreements/agreements.service";
import { EventEmitterService } from "@/common/services/event-emitter.service";

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);
  private readonly conflictBookingStatuses = [
    "PENDING",
    "PENDING_APPROVAL",
    "VERIFICATION_PENDING",
    "APPROVED_PENDING_PAYMENT",
    "APPROVED",
    "RESERVED",
  ] as const;

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private agreementsService: AgreementsService,
    private eventEmitter: EventEmitterService,
  ) {}

  private roomSafeSelect = {
    id: true,
    name: true,
    type: true,
    description: true,
    floor: true,
    area: true,
    rent: true,
    deposit: true,
    status: true,
    isAvailable: true,
    occupiedFrom: true,
    occupiedUntil: true,
    videoUrl: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
    // Management fields
    managementRent: true,
    managementStatus: true,
    managementIsAvailable: true,
    managementOccupiedUntil: true,
    media: { orderBy: { createdAt: "asc" as const } },
    amenities: { include: { amenity: true } },
    images: { orderBy: { order: "asc" as const } },
  };

  private toOptionalNumber(value: unknown): number | null {
    if (value === null || value === undefined) return null;
    if (typeof value === "string" && value.trim() === "") return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private toStartOfUtcDay(date: Date) {
    return new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );
  }

  private toEndOfUtcDay(date: Date) {
    return new Date(
      Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
        23,
        59,
        59,
        999,
      ),
    );
  }

  private toNextUtcDayStart(date: Date) {
    return new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1),
    );
  }

  private getBookingWindow(booking: {
    startDate?: Date | null;
    moveInDate?: Date | null;
    endDate?: Date | null;
    moveOutDate?: Date | null;
    checkoutDate?: Date | null;
    createdAt?: Date | null;
  }) {
    const startCandidate =
      booking.moveInDate ??
      booking.startDate ??
      booking.createdAt ??
      null;
    const endCandidate =
      booking.moveOutDate ??
      booking.endDate ??
      booking.checkoutDate ??
      null;

    const normalizedStart =
      startCandidate && !Number.isNaN(new Date(startCandidate).getTime())
        ? this.toStartOfUtcDay(new Date(startCandidate))
        : null;
    const normalizedEnd =
      endCandidate && !Number.isNaN(new Date(endCandidate).getTime())
        ? this.toNextUtcDayStart(new Date(endCandidate))
        : null;

    return {
      start: normalizedStart,
      end: normalizedEnd,
    };
  }

  private hasBookingOverlap(
    booking: {
      startDate?: Date | null;
      moveInDate?: Date | null;
      endDate?: Date | null;
      moveOutDate?: Date | null;
      checkoutDate?: Date | null;
      createdAt?: Date | null;
    },
    requestedStart: Date,
    requestedEnd: Date,
  ) {
    const { start, end } = this.getBookingWindow(booking);
    if (!start) {
      // Missing/invalid date window in an active booking should be treated as conflicting.
      return true;
    }

    const effectiveEnd =
      end ?? new Date("9999-12-31T00:00:00.000Z");

    // Half-open interval overlap: [start, end) with [requestedStart, requestedEnd)
    return start < requestedEnd && effectiveEnd > requestedStart;
  }

  private normalizeDateInputUtc(
    value: string,
    fieldName: string,
    boundary: "start" | "end" = "start",
  ) {
    const parsed = new Date(String(value));
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException(`Invalid ${fieldName}`);
    }
    return boundary === "end"
      ? this.toEndOfUtcDay(parsed)
      : this.toStartOfUtcDay(parsed);
  }

  private normalizeBookingSource(
    bookingSource?: BookingSource | string | null,
    source?: BookingSource | string | null,
  ): BookingSource {
    const rawSource = String(
      bookingSource ?? source ?? BookingSource.WALK_IN,
    )
      .trim()
      .toUpperCase()
      .replace(/[\s-]+/g, "_");

    if (rawSource === BookingSource.BROKER) {
      return BookingSource.BROKER;
    }

    if (rawSource === BookingSource.WALK_IN || rawSource === "WALKIN") {
      return BookingSource.WALK_IN;
    }

    throw new BadRequestException(
      "bookingSource must be either WALK_IN or BROKER",
    );
  }

  private normalizeBrokerName(
    bookingSource: BookingSource,
    brokerName?: string | null,
  ): string | null {
    const normalizedBrokerName =
      typeof brokerName === "string" ? brokerName.trim() : "";

    if (bookingSource === BookingSource.BROKER) {
      if (!normalizedBrokerName) {
        throw new BadRequestException(
          "Broker name is required when booking source is BROKER",
        );
      }
      return normalizedBrokerName;
    }

    return null;
  }

  private monthKey(date: Date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  }

  private computeNextRentDueDate(moveInDate: Date, fromDate = new Date()) {
    const anchorDay = moveInDate.getDate();
    const year = fromDate.getFullYear();
    const month = fromDate.getMonth();

    const thisMonthLastDay = new Date(year, month + 1, 0).getDate();
    const thisMonthDue = new Date(year, month, Math.min(anchorDay, thisMonthLastDay));

    if (thisMonthDue > fromDate) {
      return thisMonthDue;
    }

    const nextMonthLastDay = new Date(year, month + 2, 0).getDate();
    return new Date(year, month + 1, Math.min(anchorDay, nextMonthLastDay));
  }

  private async notifyAllAdmins(title: string, message: string) {
    const admins = await this.prisma.user.findMany({
      where: { role: "ADMIN", isActive: true },
      select: { id: true },
    });

    for (const admin of admins) {
      await this.notificationsService.create(admin.id, {
        type: NotificationType.PUSH,
        title,
        message,
      });
    }
  }

  async findAll() {
    return this.prisma.booking.findMany({
      include: {
        user: true,
        room: { select: this.roomSafeSelect },
        statusHistory: { orderBy: { createdAt: "desc" } },
      },
    });
  }

  async findMyBookings(userId: string) {
    return this.prisma.booking.findMany({
      where: { 
        userId,
        status: { in: ["APPROVED", "APPROVED_PENDING_PAYMENT", "PENDING_APPROVAL", "VERIFICATION_PENDING"] as any }
      },
      include: {
        room: { select: this.roomSafeSelect },
        statusHistory: { orderBy: { createdAt: "desc" } },
      },
    });
  }

  async findMyApprovedBooking(userId: string) {
    const booking = await this.prisma.booking.findFirst({
      where: {
        userId,
        status: { in: ["APPROVED", "APPROVED_PENDING_PAYMENT"] as any },
      },
      include: {
        room: {
          select: this.roomSafeSelect,
        },
        statusHistory: { orderBy: { createdAt: "desc" } },
        agreement: true, // Include rental agreement
      },
      orderBy: { createdAt: "desc" },
    });

    if (!booking) {
      return null;
    }

    return {
      ...booking,
      bookingId: booking.id,
      moveInDate: booking.moveInDate ?? booking.startDate,
      room: {
        ...booking.room,
        // Priority: booking.rentAmount (tenant-specific) > managementRent > room.rent (listing)
        rent: Number(
          (booking as any)?.rentAmount ?? 
          (booking.room as any)?.managementRent ?? 
          (booking.room as any)?.rent ?? 0
        ),
        deposit: Number((booking.room as any)?.deposit ?? 0),
        // Use management status fields if available
        status: (booking.room as any)?.managementStatus ?? (booking.room as any)?.status ?? 'AVAILABLE',
        isAvailable: (booking.room as any)?.managementIsAvailable ?? (booking.room as any)?.isAvailable ?? true,
        occupiedUntil: (booking.room as any)?.managementOccupiedUntil ?? (booking.room as any)?.occupiedUntil,
      },
      // Include agreement in response
      agreement: booking.agreement,
    };
  }

  async findOne(id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        user: true,
        room: { select: this.roomSafeSelect },
        documents: true,
        agreement: true,
        payments: true,
        rentCycles: true,
        statusHistory: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!booking) {
      throw new NotFoundException("Booking not found");
    }

    return booking;
  }

  async create(input: {
    userId: string;
    roomId?: string;
    moveInDate?: string;
    moveOutDate?: string;
    source?: BookingSource | string;
    bookingSource?: BookingSource | string;
    brokerName?: string | null;
  }) {
    console.log("BOOKING SERVICE CREATE INPUT:", input);

    const {
      userId,
      roomId,
      moveInDate,
      moveOutDate,
      source,
      bookingSource,
      brokerName,
    } = input;

    const normalizedSource = this.normalizeBookingSource(bookingSource, source);
    const normalizedBrokerName = this.normalizeBrokerName(
      normalizedSource,
      brokerName,
    );

    if (!userId || !roomId || !moveInDate) {
      console.error("BOOKING VALIDATION FAILED:", { userId, roomId, moveInDate });
      throw new BadRequestException(
        "userId, roomId and moveInDate are required",
      );
    }
    const normalizedRoomId = String(roomId);

    const normalizedMoveInDate = this.normalizeDateInputUtc(
      String(moveInDate),
      "moveInDate",
    );

    if (!moveOutDate) {
      throw new BadRequestException("moveOutDate is required");
    }
    const normalizedMoveOutDate = this.normalizeDateInputUtc(
      String(moveOutDate),
      "moveOutDate",
      "end",
    );
    if (normalizedMoveOutDate <= normalizedMoveInDate) {
      throw new BadRequestException("moveOutDate must be after moveInDate");
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException("User not found");
    }

    // STEP 1: BLOCK USER-LEVEL CONFLICTS (prevent overlapping bookings)
    const existingUserBookings = await this.prisma.booking.findMany({
      where: {
        userId,
        deletedAt: null,
        status: {
          in: this.conflictBookingStatuses as any,
        },
      },
      select: {
        id: true,
        status: true,
        startDate: true,
        moveInDate: true,
        endDate: true,
        moveOutDate: true,
        checkoutDate: true,
        createdAt: true,
      },
    });

    const userBookingConflict = existingUserBookings.find((booking) =>
      this.hasBookingOverlap(
        booking,
        normalizedMoveInDate,
        normalizedMoveOutDate,
      ),
    );

    if (userBookingConflict) {
      this.logger.warn(
        `[BookingCreate] User booking conflict userId=${userId} bookingId=${userBookingConflict.id} status=${userBookingConflict.status}`,
      );
      throw new BadRequestException(
        "You already have an active room or pending request"
      );
    }

    // Also check if user already occupies a room (OCCUPIED status)
    const occupiedRoom = await this.prisma.room.findFirst({
      where: {
        status: "OCCUPIED",
        bookings: {
          some: {
            userId,
            status: "APPROVED"
          }
        }
      }
    });
    
    if (occupiedRoom) {
      throw new BadRequestException(
        "You already occupy a room"
      );
    }

    // STEP 2: ROOM VALIDATION
    const room = await this.prisma.room.findUnique({
      where: { id: normalizedRoomId },
      select: {
        id: true,
        name: true,
        deletedAt: true,
        status: true,
        isAvailable: true,
        occupiedUntil: true,
        rent: true,
        deposit: true,
      } as any,
    });

    if (!room || (room as any).deletedAt) {
      throw new BadRequestException("Room not found");
    }

    const normalizedRoomStatus = String((room as any).status || "").toUpperCase();
    const occupiedUntilRaw = (room as any).occupiedUntil;
    const occupiedUntilDate = occupiedUntilRaw ? new Date(occupiedUntilRaw) : null;
    const normalizedOccupiedUntilDate =
      occupiedUntilDate && !Number.isNaN(occupiedUntilDate.getTime())
        ? this.toEndOfUtcDay(occupiedUntilDate)
        : null;

    // Check room status
    if (normalizedRoomStatus === "RESERVED") {
      throw new BadRequestException("Room is already reserved");
    }

    // Strict status-based validation
    if (normalizedRoomStatus === "OCCUPIED") {
      // For OCCUPIED rooms, validate moveInDate > occupiedUntil
      if (!normalizedOccupiedUntilDate) {
        throw new BadRequestException("Invalid occupied room state - no occupiedUntil date");
      }

      if (normalizedMoveInDate <= normalizedOccupiedUntilDate) {
        const formattedDate = normalizedOccupiedUntilDate.toISOString().split('T')[0];
        throw new BadRequestException(
          `Room is occupied until ${formattedDate}. Move-in date must be after.`,
        );
      }
    } else if (normalizedRoomStatus !== "AVAILABLE") {
      throw new BadRequestException("Room is not available for booking");
    }

    // Check for existing active room bookings with overlapping date window.
    const existingRoomBookings = await this.prisma.booking.findMany({
      where: {
        roomId: normalizedRoomId,
        deletedAt: null,
        status: {
          in: this.conflictBookingStatuses as any,
        },
      },
      select: {
        id: true,
        status: true,
        startDate: true,
        moveInDate: true,
        endDate: true,
        moveOutDate: true,
        checkoutDate: true,
        createdAt: true,
      },
    });

    const existingActiveBooking = existingRoomBookings.find((booking) =>
      this.hasBookingOverlap(
        booking,
        normalizedMoveInDate,
        normalizedMoveOutDate,
      ),
    );

    if (existingActiveBooking) {
      this.logger.warn(
        `[BookingCreate] Room booking conflict roomId=${normalizedRoomId} bookingId=${existingActiveBooking.id} status=${existingActiveBooking.status}`,
      );
      throw new BadRequestException("Room already has an active booking request");
    }

    const internalRent = Number((room as any).rent ?? 0);
    const internalDeposit = Number((room as any).deposit ?? 0);
    const roomName = String((room as any).name || "this room");

    // STEP 2: MINIMAL TRANSACTION (FAST)
    const txResult = await this.prisma.$transaction(async (tx) => {
      // Create booking
      const booking = await tx.booking.create({
        data: {
          userId,
          roomId: normalizedRoomId,
          startDate: normalizedMoveInDate,
          moveInDate: normalizedMoveInDate,
          endDate: normalizedMoveOutDate,
          moveOutDate: normalizedMoveOutDate,
          checkoutDate: normalizedMoveOutDate,
          status: "PENDING_APPROVAL" as any,
          bookingSource: normalizedSource,
          brokerName: normalizedBrokerName,
          expiresAt: null,
          statusHistory: {
            create: {
              status: "PENDING_APPROVAL" as any,
              comment: `Booking request submitted (rent ${internalRent}, deposit ${internalDeposit}). Waiting for admin approval.`,
            },
          },
        },
      });

      // Update room status to RESERVED (only if was AVAILABLE)
      if (normalizedRoomStatus === "AVAILABLE") {
        await tx.room.update({
          where: { id: normalizedRoomId },
          data: {
            status: "RESERVED" as any,
            isAvailable: false,
          } as any,
        });
      }

      return { bookingId: booking.id, roomName };
    });

    // Emit room update event
    this.eventEmitter.emitRoomUpdated(normalizedRoomId, {
      status: normalizedRoomStatus === "OCCUPIED" ? "OCCUPIED" : "RESERVED",
      isAvailable: false,
    });

    await this.notifyAllAdmins(
      "New booking request",
      `New booking request received for room ${txResult.roomName}.`,
    );

    return this.prisma.booking.findUnique({
      where: { id: txResult.bookingId },
      include: {
        room: { select: this.roomSafeSelect },
        user: true,
        documents: true,
        statusHistory: { orderBy: { createdAt: "desc" } },
      },
    });
  }

  async updateStatus(
    id: string,
    status: string,
    comment?: string,
    changedBy?: string,
  ) {
    const booking = await this.findOne(id);
    const normalizedStatus = String(status || "").toUpperCase();
    const currentStatus = String(booking.status || "").toUpperCase();
    console.log(`[BookingStatus] updateStatus called for booking ${id}: ${currentStatus} -> ${normalizedStatus}`);
    const allowedTransitions: Record<string, string[]> = {
      PENDING_APPROVAL: ["APPROVED", "APPROVED_PENDING_PAYMENT", "REJECTED", "CANCELLED"],
      PENDING: ["APPROVED", "APPROVED_PENDING_PAYMENT", "REJECTED", "CANCELLED"], // Keep for legacy
      VERIFICATION_PENDING: ["APPROVED", "APPROVED_PENDING_PAYMENT", "REJECTED", "CANCELLED"],
      APPROVED_PENDING_PAYMENT: ["APPROVED", "REJECTED", "CANCELLED"],
      APPROVED: ["EXPIRED", "CANCELLED"],
      REJECTED: [],
      CANCELLED: [],
      EXPIRED: [],
    };

    if (!allowedTransitions[currentStatus]?.includes(normalizedStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${currentStatus} to ${normalizedStatus}`,
      );
    }

    const updateData: any = { status: normalizedStatus };

    // Booking lifecycle drives room availability; admin does not edit room status directly.
    // Transition to final occupancy only when specifically marked as APPROVED
    if (normalizedStatus === "APPROVED") {
      const occupiedFrom = booking.moveInDate ?? booking.startDate;
      const occupiedUntil =
        booking.moveOutDate ?? booking.checkoutDate ?? booking.endDate ?? null;
      await this.prisma.room.update({
        where: { id: booking.roomId },
        data: {
          status: "OCCUPIED",
          isAvailable: false,
          occupiedFrom,
          occupiedUntil,
        },
      });

      // Emit room updated event so frontend can refresh room list
      this.eventEmitter.emitRoomUpdated(booking.roomId, {
        status: "OCCUPIED",
        occupiedFrom,
        occupiedUntil,
      });

      // Update User account status to ACTIVE if they have a tenant profile
      await this.prisma.user.update({
        where: { id: booking.userId },
        data: { accountStatus: "ACTIVE" },
      });

      await this.notificationsService.create(booking.userId, {
        type: NotificationType.PUSH,
        title: "Booking Approved",
        message: "Your booking has been approved by the admin. Your room is now ready for move-in.",
      });

      // Generate rental agreement DOCX (non-blocking - errors should not break booking flow)
      console.log(`[Agreement] Generating rental agreement for booking ${booking.id}...`);
      try {
        const agreementUrl = await this.agreementsService.generateRentalAgreement(booking.id);
        console.log(`[Agreement] Rental agreement generated successfully for booking ${booking.id}: ${agreementUrl}`);
        await this.notificationsService.create(booking.userId, {
          type: NotificationType.PUSH,
          title: "Rental Agreement Generated",
          message: "Your rental agreement has been generated. You can download it from the Documents section.",
        });
      } catch (error: any) {
        console.error(`[Agreement] Failed to generate rental agreement for booking ${booking.id}:`, error?.message || error);
        // Don't throw - booking flow should continue even if agreement generation fails
        console.log(`[Agreement] Booking ${booking.id} approved successfully (agreement generation failed but booking is active)`);
      }
    }

    // Generate payments and notify when admin approves the request
    if (normalizedStatus === "APPROVED_PENDING_PAYMENT") {
      await this.notificationsService.create(booking.userId, {
        type: NotificationType.PUSH,
        title: "Booking Approved",
        message: "Your booking request is approved. Please complete the initial payment (Deposit + First month rent) to confirm your occupancy.",
      });

      const bookingWithRoom = await this.prisma.booking.findUnique({
        where: { id: booking.id },
        include: {
          room: { select: { rent: true, deposit: true } as any },
        },
      });
      if (!bookingWithRoom) {
        throw new NotFoundException("Booking not found");
      }

      const depositAmount = Number((bookingWithRoom.room as any).deposit ?? 0);
      const rentAmount = Number((bookingWithRoom as any).rentAmount ?? (bookingWithRoom.room as any).rent ?? 0);
      const month = this.monthKey(new Date());

      const existingDeposit = await this.prisma.payment.findFirst({
        where: {
          bookingId: booking.id,
          userId: booking.userId,
          type: "DEPOSIT" as any,
          month,
        } as any,
      });

      if (!existingDeposit) {
        await this.prisma.payment.create({
          data: {
            userId: booking.userId,
            tenantId: booking.userId,
            roomId: booking.roomId,
            bookingId: booking.id,
            month,
            amount: new Decimal(depositAmount),
            rentAmount: new Decimal(depositAmount),
            pendingAmount: new Decimal(depositAmount),
            paidAmount: new Decimal(0),
            amountPaid: new Decimal(0),
            borrowedAmount: new Decimal(0),
            type: "DEPOSIT" as any,
            status: "PENDING" as any,
            paymentMethod: "ONLINE" as any,
            description: "Deposit due on booking approval",
          } as any,
        });
      }

      const dueDate = this.computeNextRentDueDate(
        booking.moveInDate ?? booking.startDate,
      );
      const dueMonth = this.monthKey(dueDate);
      const existingRent = await this.prisma.payment.findFirst({
        where: {
          bookingId: booking.id,
          userId: booking.userId,
          type: "RENT" as any,
          month: dueMonth,
        } as any,
      });

      if (!existingRent) {
        await this.prisma.payment.create({
          data: {
            userId: booking.userId,
            tenantId: booking.userId,
            roomId: booking.roomId,
            bookingId: booking.id,
            month: dueMonth,
            amount: new Decimal(rentAmount),
            rentAmount: new Decimal(rentAmount),
            pendingAmount: new Decimal(0),
            paidAmount: new Decimal(0),
            amountPaid: new Decimal(0),
            borrowedAmount: new Decimal(0),
            type: "RENT" as any,
            status: "PENDING" as any,
            paymentMethod: "ONLINE" as any,
            description: `Monthly rent due by ${dueDate.toISOString()}`,
          } as any,
        });
      }
    }

    if (normalizedStatus === "REJECTED" || normalizedStatus === "CANCELLED") {
      // Get current room to check if it was originally OCCUPIED
      const currentRoom = await this.prisma.room.findUnique({
        where: { id: booking.roomId },
        select: { status: true, occupiedUntil: true },
      });
      
      // If room was OCCUPIED with an occupiedUntil date, keep it OCCUPIED
      // Otherwise, set to AVAILABLE
      const shouldRemainOccupied = 
        currentRoom?.status === "OCCUPIED" && 
        currentRoom?.occupiedUntil && 
        new Date(currentRoom.occupiedUntil) > new Date();
      
      if (!shouldRemainOccupied) {
        await this.prisma.room.update({
          where: { id: booking.roomId },
          data: {
            status: "AVAILABLE",
            isAvailable: true,
            occupiedFrom: null,
            occupiedUntil: null,
          },
        });
      } else {
        this.logger.log(`Room ${booking.roomId} remains OCCUPIED until ${currentRoom.occupiedUntil}`);
      }
      updateData.expiresAt = new Date();
      if (normalizedStatus === "REJECTED") {
        await this.notificationsService.create(booking.userId, {
          type: NotificationType.PUSH,
          title: "Booking Rejected",
          message: "Your booking request was rejected.",
        });
      }

      // Booking rejection/cancellation must not lock tenant login.
      // If account was marked REJECTED from a previous flow, restore access.
      const bookingUser = await this.prisma.user.findUnique({
        where: { id: booking.userId },
        select: { accountStatus: true, isApproved: true, isActive: true },
      });
      if (bookingUser?.accountStatus === "REJECTED") {
        await this.prisma.user.update({
          where: { id: booking.userId },
          data: {
            accountStatus: "ACTIVE",
            isApproved: true,
            isActive: true,
          },
        });
      }
    }

    if (normalizedStatus === "EXPIRED") {
      // Get current room to check if it was originally OCCUPIED
      const currentRoom = await this.prisma.room.findUnique({
        where: { id: booking.roomId },
        select: { status: true, occupiedUntil: true },
      });
      
      // If room was OCCUPIED with an occupiedUntil date, keep it OCCUPIED
      const shouldRemainOccupied = 
        currentRoom?.status === "OCCUPIED" && 
        currentRoom?.occupiedUntil && 
        new Date(currentRoom.occupiedUntil) > new Date();
      
      if (!shouldRemainOccupied) {
        await this.prisma.room.update({
          where: { id: booking.roomId },
          data: {
            status: "AVAILABLE",
            isAvailable: true,
            occupiedFrom: null,
            occupiedUntil: null,
          },
        });
      } else {
        this.logger.log(`Room ${booking.roomId} remains OCCUPIED until ${currentRoom.occupiedUntil}`);
      }
    }

    const updated = await this.prisma.booking.update({
      where: { id },
      data: updateData,
      include: { room: { select: this.roomSafeSelect }, user: true },
    });

    // Add status history
    await this.prisma.bookingStatusHistory.create({
      data: {
        bookingId: id,
        status: normalizedStatus as any,
        comment,
        changedBy,
      },
    });

    // Emit booking updated event
    this.eventEmitter.emitBookingUpdated(booking.userId, id, normalizedStatus, {
      roomId: booking.roomId,
      comment,
    });
    this.eventEmitter.emitDashboardUpdate(booking.userId, {
      bookingUpdated: true,
      status: normalizedStatus,
    });

    return updated;
  }

  async cancel(id: string) {
    const booking = await this.findOne(id);

    if (["APPROVED", "REJECTED", "CANCELLED"].includes(booking.status)) {
      throw new BadRequestException("Cannot cancel this booking");
    }

    const updated = await this.prisma.booking.update({
      where: { id },
      data: { status: "CANCELLED" },
      include: { room: { select: this.roomSafeSelect } },
    });

    // Release room
    await this.prisma.room.update({
      where: { id: booking.roomId },
      data: {
        status: "AVAILABLE",
        isAvailable: true,
        occupiedFrom: null,
        occupiedUntil: null,
      },
    });

    // Add status history
    await this.prisma.bookingStatusHistory.create({
      data: {
        bookingId: id,
        status: "CANCELLED",
        comment: "Booking cancelled",
      },
    });

    return updated;
  }

  async findPendingBookings() {
    return this.prisma.booking.findMany({
      where: { status: { in: ["PENDING", "PENDING_APPROVAL", "VERIFICATION_PENDING"] } as any },
      include: {
        user: true,
        room: { select: this.roomSafeSelect },
        documents: true,
      },
    });
  }

  async approve(id: string) {
    return this.updateStatus(id, "APPROVED", "Booking request approved by admin.");
  }

  async reject(id: string) {
    return this.updateStatus(id, "REJECTED", "Booking rejected by admin");
  }

  /**
   * Check and mark expired bookings
   * Should be called periodically to clean up checkouts
   */
  async checkExpiredCheckouts() {
    const expiredBookings = await this.prisma.booking.findMany({
      where: {
        status: "APPROVED",
        checkoutDate: { lte: new Date() },
      },
    });

    const results: Array<{
      bookingId: string;
      success: boolean;
      error?: string;
    }> = [];
    for (const booking of expiredBookings) {
      try {
        await this.updateStatus(
          booking.id,
          "EXPIRED",
          "Booking completed at move-out date",
          "system",
        );

        // Emit booking expired event
        this.eventEmitter.emitBookingExpired(booking.userId, booking.id, {
          roomId: booking.roomId,
          checkoutDate: booking.checkoutDate,
        });

        results.push({ bookingId: booking.id, success: true });
      } catch (error) {
        results.push({
          bookingId: booking.id,
          success: false,
          error: String(error),
        });
      }
    }

    return results;
  }

  /**
   * Create extension request for checkout date
   */
  async createExtensionRequest(
    userId: string,
    bookingId: string,
    requestedCheckoutDate: string,
  ) {
    const booking = await this.findOne(bookingId);

    if (booking.userId !== userId) {
      throw new BadRequestException("Unauthorized");
    }

    if (booking.status !== "APPROVED") {
      throw new BadRequestException("Cannot extend non-approved booking");
    }

    if (!booking.checkoutDate) {
      throw new BadRequestException("No checkout date set for this booking");
    }

    const newCheckoutDate = new Date(requestedCheckoutDate);
    if (Number.isNaN(newCheckoutDate.getTime())) {
      throw new BadRequestException("Invalid checkout date format");
    }

    if (newCheckoutDate <= booking.checkoutDate) {
      throw new BadRequestException(
        "New checkout date must be after current checkout date",
      );
    }

    const created = await this.prisma.extensionRequest.create({
      data: {
        bookingId,
        tenantId: userId,
        currentCheckoutDate: booking.checkoutDate,
        requestedCheckoutDate: newCheckoutDate,
      },
      include: {
        booking: { include: { room: { select: this.roomSafeSelect } } },
        tenant: true,
      },
    });

    await this.notifyAllAdmins(
      "Extension request",
      "A tenant submitted a move-out extension request.",
    );
    return created;
  }

  /**
   * Approve extension request
   */
  async approveExtensionRequest(extensionRequestId: string) {
    const extensionRequest = await this.prisma.extensionRequest.findUnique({
      where: { id: extensionRequestId },
      include: { booking: true },
    });

    if (!extensionRequest) {
      throw new NotFoundException("Extension request not found");
    }

    // Update booking with new checkout date
    const updatedBooking = await this.prisma.booking.update({
      where: { id: extensionRequest.bookingId },
      data: {
        checkoutDate: extensionRequest.requestedCheckoutDate,
        moveOutDate: extensionRequest.requestedCheckoutDate,
        endDate: extensionRequest.requestedCheckoutDate,
      },
    });

    if (updatedBooking.status === "APPROVED") {
      await this.prisma.room.update({
        where: { id: updatedBooking.roomId },
        data: { occupiedUntil: extensionRequest.requestedCheckoutDate },
      });
    }

    const updated = await this.prisma.extensionRequest.update({
      where: { id: extensionRequestId },
      data: {
        status: "APPROVED" as any,
        approvedAt: new Date(),
      },
      include: {
        booking: { include: { room: { select: this.roomSafeSelect } } },
        tenant: true,
      },
    });

    await this.notificationsService.create(extensionRequest.tenantId, {
      type: NotificationType.PUSH,
      title: "Extension Approved",
      message: "Your extension request has been approved.",
    });
    this.eventEmitter.emitDashboardUpdate(extensionRequest.tenantId, {
      extensionDecision: "APPROVED",
    });

    return updated;
  }

  /**
   * Reject extension request
   */
  async rejectExtensionRequest(extensionRequestId: string, reason?: string) {
    const extensionRequest = await this.prisma.extensionRequest.findUnique({
      where: { id: extensionRequestId },
    });

    if (!extensionRequest) {
      throw new NotFoundException("Extension request not found");
    }

    const updated = await this.prisma.extensionRequest.update({
      where: { id: extensionRequestId },
      data: {
        status: "REJECTED" as any,
        rejectionReason: reason,
      },
      include: {
        booking: { include: { room: { select: this.roomSafeSelect } } },
        tenant: true,
      },
    });

    const booking = await this.prisma.booking.update({
      where: { id: extensionRequest.bookingId },
      data: { status: "EXPIRED" as any },
    });
    await this.prisma.room.update({
      where: { id: booking.roomId },
      data: {
        status: "AVAILABLE",
        isAvailable: true,
        occupiedFrom: null,
        occupiedUntil: null,
      },
    });

    await this.notificationsService.create(extensionRequest.tenantId, {
      type: NotificationType.PUSH,
      title: "Extension Rejected",
      message: "Your extension request was rejected. Please vacate as scheduled.",
    });
    this.eventEmitter.emitDashboardUpdate(extensionRequest.tenantId, {
      extensionDecision: "REJECTED",
    });

    return updated;
  }

  /**
   * Get extension requests for a booking
   */
  async getExtensionRequests(bookingId: string) {
    return this.prisma.extensionRequest.findMany({
      where: { bookingId },
      include: {
        booking: { include: { room: { select: this.roomSafeSelect } } },
        tenant: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Get all pending extension requests for admin
   */
  async getPendingExtensionRequests() {
    return this.prisma.extensionRequest.findMany({
      where: { status: "PENDING" },
      include: {
        booking: {
          include: { room: { select: this.roomSafeSelect }, user: true },
        },
        tenant: true,
      },
      orderBy: { createdAt: "asc" },
    });
  }
}
