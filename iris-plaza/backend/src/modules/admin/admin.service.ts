import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { BookingSource, BookingStatus, Prisma, RoomStatus, TenantType } from "@prisma/client";
import { PrismaService } from "@/prisma/prisma.service";
import { NotificationsService } from "@/modules/notifications/notifications.service";
import { EventEmitterService } from "@/common/services/event-emitter.service";
import { PaymentsService } from "@/modules/payments/payments.service";

@Injectable()
export class AdminService {
  private readonly activeTenantBookingStatuses: BookingStatus[] = [
    BookingStatus.APPROVED,
    BookingStatus.APPROVED_PENDING_PAYMENT,
  ];
  private roomTransfersTableReady = false;

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private eventEmitter: EventEmitterService,
    private paymentsService: PaymentsService,
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
    availableAt: true,
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
    images: { orderBy: { order: "asc" as const } },
    amenities: { include: { amenity: true } },
  };

  private mapMaintenanceStatus(status: string) {
    const normalized = String(status || "").toUpperCase();
    if (normalized === "RESOLVED") return "APPROVED";
    if (normalized === "CLOSED") return "REJECTED";
    return "PENDING";
  }

  private normalizeBookingSource(
    bookingSource?: BookingSource | null,
  ): BookingSource {
    return bookingSource === BookingSource.BROKER
      ? BookingSource.BROKER
      : BookingSource.WALK_IN;
  }

  private normalizeBrokerName(
    bookingSource?: BookingSource | null,
    brokerName?: string | null,
  ): string | null {
    if (this.normalizeBookingSource(bookingSource) !== BookingSource.BROKER) {
      return null;
    }

    const normalizedBrokerName =
      typeof brokerName === "string" ? brokerName.trim() : "";
    return normalizedBrokerName || null;
  }

  private toStartOfUtcDay(date: Date) {
    return new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );
  }

  private deriveRoomOccupancyState(
    occupiedUntil: Date | string | null | undefined,
    currentStatus?: string | null,
  ) {
    const normalizedCurrentStatus = String(currentStatus ?? "").toUpperCase();

    if (normalizedCurrentStatus === RoomStatus.MAINTENANCE) {
      return {
        status: RoomStatus.MAINTENANCE,
        isAvailable: false,
      };
    }

    if (normalizedCurrentStatus === RoomStatus.RESERVED) {
      return {
        status: RoomStatus.RESERVED,
        isAvailable: false,
      };
    }

    if (!occupiedUntil) {
      return {
        status: RoomStatus.AVAILABLE,
        isAvailable: true,
      };
    }

    const parsedOccupiedUntil = new Date(occupiedUntil);
    if (
      Number.isNaN(parsedOccupiedUntil.getTime()) ||
      parsedOccupiedUntil <= new Date()
    ) {
      return {
        status: RoomStatus.AVAILABLE,
        isAvailable: true,
      };
    }

    return {
      status: RoomStatus.OCCUPIED,
      isAvailable: false,
    };
  }

  private async applyOccupancyStateFromBookings<TRoom extends {
    id: string;
    status: string;
    isAvailable: boolean;
    occupiedUntil: Date | string | null;
    managementStatus?: string | null;
    managementIsAvailable?: boolean | null;
    managementOccupiedUntil?: Date | string | null;
  }>(rooms: TRoom[]): Promise<TRoom[]> {
    if (!rooms.length) {
      return rooms;
    }

    return rooms.map((room) => {
      // Use management fields if available, otherwise fall back to listing fields
      const effectiveOccupiedUntil = room.managementOccupiedUntil ?? room.occupiedUntil;
      const effectiveStatus = room.managementStatus ?? room.status;
      const effectiveIsAvailable = room.managementIsAvailable ?? room.isAvailable;
      
      const derivedOccupancy = this.deriveRoomOccupancyState(
        effectiveOccupiedUntil,
        effectiveStatus,
      );

      return {
        ...room,
        status: derivedOccupancy.status,
        isAvailable: derivedOccupancy.isAvailable,
        // Keep the effective values for frontend to use
        occupiedUntil: effectiveOccupiedUntil,
      };
    });
  }

  private parseDateInput(value: string | undefined, fieldName: string): Date | undefined {
    if (value === undefined) return undefined;
    const trimmed = String(value).trim();
    if (!trimmed) return undefined;
    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException(`${fieldName} must be a valid date`);
    }
    return parsed;
  }

  private async ensureRoomTransfersTable(db: any = this.prisma) {
    if (this.roomTransfersTableReady) {
      return;
    }

    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS room_transfers (
        id BIGSERIAL PRIMARY KEY,
        booking_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        from_room_id TEXT NOT NULL,
        to_room_id TEXT NOT NULL,
        effective_date TIMESTAMPTZ NOT NULL,
        desired_move_out_date TIMESTAMPTZ NULL,
        status TEXT NOT NULL DEFAULT 'PENDING',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await db.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_room_transfers_effective_status
      ON room_transfers (effective_date, status)
    `);

    await db.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_room_transfers_to_room_pending
      ON room_transfers (to_room_id, status)
    `);

    this.roomTransfersTableReady = true;
  }

  async getDashboardStats() {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const [
      totalRooms,
      availableRooms,
      occupiedRooms,
      totalTenants,
      pendingBookings,
      pendingMaintenanceRequests,
      monthlyCompletedPayments,
    ] = await Promise.all([
      this.prisma.room.count({ where: { deletedAt: null } }),
      this.prisma.room.count({
        where: { deletedAt: null, status: "AVAILABLE", isAvailable: true },
      }),
      this.prisma.room.count({
        where: { deletedAt: null, isAvailable: false },
      }),
      // Count only tenants with active bookings (APPROVED or APPROVED_PENDING_PAYMENT)
      this.prisma.booking.count({
        where: { status: { in: this.activeTenantBookingStatuses } },
      }),
      this.prisma.booking.count({
        where: { status: { in: ["PENDING_APPROVAL", "VERIFICATION_PENDING"] } },
      }),
      this.prisma.maintenanceTicket.count({
        where: { status: { in: ["OPEN", "IN_PROGRESS"] } },
      }),
      this.prisma.payment.findMany({
        where: {
          status: "COMPLETED",
          createdAt: { gte: monthStart, lt: monthEnd },
        },
        select: {
          amount: true,
        } as any,
      }),
    ]);

    const totalMonthlyRevenue = monthlyCompletedPayments.reduce(
      (sum, p: any) => {
        const paid = p?.amount ?? 0;
        return sum + Number(paid);
      },
      0,
    );

    return {
      totalRooms,
      availableRooms,
      occupiedRooms,
      totalTenants,
      pendingBookingRequests: pendingBookings,
      pendingMaintenanceRequests,
      totalMonthlyRevenue,
      rooms: {
        total: totalRooms,
        available: availableRooms,
        occupied: occupiedRooms,
      },
      tenants: { total: totalTenants },
      bookings: { pending: pendingBookings },
      payments: { revenue: totalMonthlyRevenue },
      maintenance: { openTickets: pendingMaintenanceRequests },
    };
  }

  async getAdminRooms() {
    console.log("🔍 getAdminRooms: Starting query...");
    try {
      const rooms = await this.prisma.room.findMany({
        where: { deletedAt: null },
        select: this.roomSafeSelect,
        orderBy: [
          { floor: 'asc' },
          { name: 'asc' }
        ],
      });
      const normalizedRooms = await this.applyOccupancyStateFromBookings(rooms);
      console.log("getAdminRooms: Found", normalizedRooms.length, "rooms");
      return normalizedRooms;
    } catch (error) {
      console.error("❌ getAdminRooms ERROR:", error);
      throw error;
    }
  }

  async getAdminRoom(id: string) {
    try {
      const room = await this.prisma.room.findUnique({
        where: { id },
        include: {
          amenities: {
            include: {
              amenity: true
            }
          },
          images: true,
          media: true
        }
      });

      if (!room) {
        throw new NotFoundException("Room not found");
      }
      const [normalizedRoom] = await this.applyOccupancyStateFromBookings([room]);
      return normalizedRoom;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error("Error fetching admin room:", error);
      throw error;
    }
  }

  async getAmenities() {
    return this.prisma.amenity.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    });
  }

  async createAmenity(name: string) {
    const normalizedName = String(name || "").trim().replace(/\s+/g, " ");
    if (!normalizedName) {
      throw new BadRequestException("Amenity name is required");
    }

    try {
      return await this.prisma.amenity.create({
        data: { name: normalizedName },
        select: {
          id: true,
          name: true,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new BadRequestException("Amenity already exists");
      }
      throw error;
    }
  }

  async deleteAmenity(amenityId: string) {
    const normalizedAmenityId = String(amenityId || "").trim();
    if (!normalizedAmenityId) {
      throw new BadRequestException("Amenity ID is required");
    }

    const existingAmenity = await this.prisma.amenity.findUnique({
      where: { id: normalizedAmenityId },
      select: { id: true, name: true },
    });

    if (!existingAmenity) {
      throw new NotFoundException("Amenity not found");
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.roomAmenity.deleteMany({
        where: { amenityId: normalizedAmenityId },
      });

      await tx.amenity.delete({
        where: { id: normalizedAmenityId },
      });
    });

    return {
      success: true,
      message: `Amenity "${existingAmenity.name}" deleted`,
    };
  }

  async getAdminBookings() {
    console.log("🔍 getAdminBookings: Starting query...");
    try {
      const bookings = await this.prisma.booking.findMany({
        where: { deletedAt: null },
        include: {
          user: true,
          room: { select: this.roomSafeSelect },
          documents: true,
          statusHistory: { orderBy: { createdAt: "desc" } },
        },
        orderBy: { createdAt: "desc" },
      });
      const todayStart = this.toStartOfUtcDay(new Date());
      const filteredBookings = bookings.filter((booking) => {
        const effectiveMoveOutDate =
          booking.moveOutDate ?? booking.checkoutDate ?? booking.endDate ?? null;
        if (!effectiveMoveOutDate) return true;
        const moveOutDay = this.toStartOfUtcDay(new Date(effectiveMoveOutDate));
        return moveOutDay >= todayStart;
      });

      console.log("✅ getAdminBookings: Found", filteredBookings.length, "active bookings");

      return filteredBookings.map((booking) => {
        const bookingSource = this.normalizeBookingSource(booking.bookingSource);
        const derivedRoomOccupancy = booking.room
          ? this.deriveRoomOccupancyState(
              booking.room.occupiedUntil,
              booking.room.status,
            )
          : null;
        return {
          ...booking,
          room: booking.room
            ? {
                ...booking.room,
                status: derivedRoomOccupancy?.status ?? booking.room.status,
                isAvailable:
                  derivedRoomOccupancy?.isAvailable ?? booking.room.isAvailable,
              }
            : booking.room,
          bookingSource,
          brokerName: this.normalizeBrokerName(bookingSource, booking.brokerName),
        };
      });
    } catch (error) {
      console.error("❌ getAdminBookings ERROR:", error);
      throw error;
    }
  }

  async getAllTenants() {
    console.log("🔍 getAllTenants: Starting query...");
    try {
      const approvedBookings = await this.prisma.booking.findMany({
        where: { status: { in: this.activeTenantBookingStatuses } },
        include: { user: true, room: { select: this.roomSafeSelect } },
        orderBy: { createdAt: "desc" },
      });
      console.log("✅ getAllTenants: Found", approvedBookings.length, "tenants");

      const todayStart = this.toStartOfUtcDay(new Date());
      return approvedBookings.map((booking) => {
        const bookingSource = this.normalizeBookingSource(booking.bookingSource);
        const brokerName = this.normalizeBrokerName(bookingSource, booking.brokerName);
        const baseMoveInDate =
          booking.moveInDate ?? booking.startDate ?? (booking as any).expectedMoveIn;
        const derivedTenantType =
          baseMoveInDate &&
          this.toStartOfUtcDay(new Date(baseMoveInDate)) > todayStart
            ? TenantType.FUTURE
            : TenantType.ACTIVE;
        const derivedRoomOccupancy = booking.room
          ? this.deriveRoomOccupancyState(
              booking.room.managementOccupiedUntil ?? booking.room.occupiedUntil,
              booking.room.managementStatus ?? booking.room.status,
            )
          : null;
        return {
          id: booking.user.id,
          bookingId: booking.id,
          userId: booking.user.id,
          name: [booking.user.firstName, booking.user.lastName]
            .filter(Boolean)
            .join(" ")
            .trim(),
          phone: booking.user.phone,
          email: booking.user.email,
          room: booking.room
            ? {
                ...booking.room,
                // Priority: booking.rentAmount > managementRent > room.rent
                rent: Number(
                  (booking as any).rentAmount ?? 
                  booking.room.managementRent ?? 
                  booking.room.rent ?? 0
                ),
                status: derivedRoomOccupancy?.status ?? booking.room.status,
                isAvailable:
                  derivedRoomOccupancy?.isAvailable ?? booking.room.isAvailable,
              }
            : booking.room,
          moveInDate: booking.moveInDate,
          rent: Number(
            (booking as any).rentAmount ??
            booking.room.managementRent ??
            booking.room.rent ?? 0
          ),
          status: booking.status,
          tenantType: derivedTenantType,
          expectedMoveIn: (booking as any).expectedMoveIn || null,
          user: booking.user,
          bookingSource,
          brokerName,
        };
      });
    } catch (error) {
      console.error("❌ getAllTenants ERROR:", error);
      throw error;
    }
  }

  async getTenantById(tenantId: string) {
    // Find tenant with approved booking
    const booking = await this.prisma.booking.findFirst({
      where: {
        userId: tenantId,
        status: { in: this.activeTenantBookingStatuses },
      },
      select: {
        id: true,
        userId: true,
        status: true,
        startDate: true,
        endDate: true,
        moveInDate: true,
        moveOutDate: true,
        bookingSource: true,
        brokerName: true,
        user: true,
        room: { select: this.roomSafeSelect },
        agreement: true
      },
      orderBy: { createdAt: "desc" },
    });

    if (!booking) {
      throw new NotFoundException("Tenant with active booking not found");
    }

    // Get tenant documents
    const documents = await this.prisma.document.findMany({
      where: { userId: tenantId },
      orderBy: { uploadedAt: "desc" },
    });
    const bookingSource = this.normalizeBookingSource(booking.bookingSource);
    const brokerName = this.normalizeBrokerName(
      bookingSource,
      booking.brokerName,
    );
    const tenantBaseMoveInDate =
      booking.moveInDate ?? booking.startDate ?? (booking as any).expectedMoveIn;
    const derivedTenantType =
      tenantBaseMoveInDate &&
      this.toStartOfUtcDay(new Date(tenantBaseMoveInDate)) >
        this.toStartOfUtcDay(new Date())
        ? TenantType.FUTURE
        : TenantType.ACTIVE;

    return {
      id: booking.user.id,
      name: [booking.user.firstName, booking.user.lastName]
        .filter(Boolean)
        .join(" ")
        .trim(),
      phone: booking.user.phone,
      email: booking.user.email,
      status: booking.status,
      tenantType: derivedTenantType,
      expectedMoveIn: (booking as any).expectedMoveIn || null,
      booking: {
        id: booking.id,
        status: booking.status,
        moveInDate: booking.moveInDate,
        moveOutDate: booking.moveOutDate,
        startDate: booking.startDate,
        endDate: booking.endDate,
        bookingSource,
        brokerName,
      },
      room: {
        id: booking.room.id,
        name: booking.room.name,
        floor: booking.room.floor,
        rent: Number(
          (booking as any).rentAmount ??
          (booking.room as any).managementRent ??
          booking.room.rent ?? 0
        ),
        deposit: booking.room.deposit,
        status: (booking.room as any).managementStatus ?? booking.room.status,
        isAvailable: (booking.room as any).managementIsAvailable ?? booking.room.isAvailable,
        occupiedUntil: (booking.room as any).managementOccupiedUntil ?? booking.room.occupiedUntil,
      },
      agreement: booking.agreement ? {
        id: booking.agreement.id,
        url: booking.agreement.agreementUrl,
        status: booking.agreement.status,
        startDate: booking.agreement.startDate,
        endDate: booking.agreement.endDate,
        monthlyRent: booking.agreement.monthlyRent,
        securityDeposit: booking.agreement.securityDeposit,
      } : null,
      documents: documents.map(doc => ({
        id: doc.id,
        type: doc.type,
        url: doc.fileUrl,
      })),
    };
  }

  async removeTenant(userId: string) {
    const booking = await this.prisma.booking.findFirst({
      where: {
        userId,
        status: { in: this.activeTenantBookingStatuses },
      },
      include: { room: { select: this.roomSafeSelect }, user: true },
      orderBy: { createdAt: "desc" },
    });

    if (!booking) {
      throw new NotFoundException("Active tenant booking not found");
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: booking.id },
        data: { status: "CANCELLED" },
      });

      await tx.bookingStatusHistory.create({
        data: {
          bookingId: booking.id,
          status: "CANCELLED",
          comment: "Tenant removed by admin",
        },
      });

      await tx.room.update({
        where: { id: booking.roomId },
        data: {
          // Update listing fields
          status: "AVAILABLE",
          isAvailable: true,
          occupiedFrom: null,
          occupiedUntil: null,
        } as any,
      });

      await tx.user.update({
        where: { id: userId },
        data: {
          // Removing a tenant from a room should not block account login.
          isApproved: true,
          accountStatus: "ACTIVE",
          isActive: true,
        },
      });

      return { success: true };
    });
  }

  async updateTenant(
    userId: string,
    data: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      newRoomId?: string;
      roomChangeDate?: string;
      moveOutDate?: string;
      bookingSource?: string;
      brokerName?: string;
      newRent?: number;
      extendOccupiedUntil?: string;
    },
  ) {
    const requestedRoomId = String(data.newRoomId ?? "").trim();
    const parsedRoomChangeDate = this.parseDateInput(
      data.roomChangeDate,
      "roomChangeDate",
    );
    const parsedMoveOutDate = this.parseDateInput(
      data.moveOutDate,
      "moveOutDate",
    );

    try {
      const booking = await this.prisma.booking.findFirst({
        where: {
          userId,
          status: { in: this.activeTenantBookingStatuses },
        },
        include: {
          room: {
            select: {
              id: true,
              name: true,
              type: true,
              floor: true,
              area: true,
              rent: true,
              deposit: true,
              status: true,
              isAvailable: true,
              occupiedFrom: true,
              occupiedUntil: true,
              availableAt: true,
              videoUrl: true,
              // Management fields
              managementRent: true,
              managementStatus: true,
              managementIsAvailable: true,
              managementOccupiedUntil: true,
            },
          },
          user: true,
        },
        orderBy: { createdAt: "desc" },
      });

      if (!booking) {
        throw new NotFoundException("Active tenant booking not found");
      }

      const currentRoomId = booking.roomId;
      if (!currentRoomId) {
        throw new BadRequestException("Current booking has no room assigned");
      }

      const targetRoomId = requestedRoomId || undefined;
      const isRoomChangeRequested =
        !!targetRoomId && targetRoomId !== currentRoomId;
      const todayUtc = this.toStartOfUtcDay(new Date());

      if (isRoomChangeRequested && !parsedRoomChangeDate) {
        throw new BadRequestException(
          "roomChangeDate is required when assigning a different room",
        );
      }
      if (!isRoomChangeRequested && parsedRoomChangeDate) {
        throw new BadRequestException(
          "roomChangeDate can only be provided when assigning a different room",
        );
      }

      const transactionResult = await this.prisma.$transaction(async (tx) => {
        let bookingIdForResponse = booking.id;
        let createdNewTransferBooking = false;

        if (
          data.firstName !== undefined ||
          data.lastName !== undefined ||
          data.phone !== undefined
        ) {
          const userUpdate: Prisma.UserUpdateInput = {};

          if (data.firstName !== undefined) userUpdate.firstName = data.firstName;
          if (data.lastName !== undefined) userUpdate.lastName = data.lastName;

          if (data.phone !== undefined) {
            const normalizedPhone = String(data.phone || "").trim();
            if (!normalizedPhone) {
              throw new BadRequestException("Phone number cannot be empty");
            }

            const existingUser = await tx.user.findFirst({
              where: {
                phone: normalizedPhone,
                NOT: { id: userId },
              },
            });

            if (existingUser) {
              throw new BadRequestException(
                "Phone number is already in use by another user",
              );
            }
            userUpdate.phone = normalizedPhone;
          }

          await tx.user.update({
            where: { id: userId },
            data: userUpdate,
          });
        }

        const normalizedCurrentBookingSource = this.normalizeBookingSource(
          booking.bookingSource,
        );
        const shouldUpdateBookingSource =
          data.bookingSource !== undefined || data.brokerName !== undefined;

        let nextBookingSource = normalizedCurrentBookingSource;
        if (data.bookingSource !== undefined) {
          const normalizedInput = String(data.bookingSource || "")
            .trim()
            .toUpperCase()
            .replace(/[\s-]+/g, "_");

          if (normalizedInput === "BROKER") {
            nextBookingSource = BookingSource.BROKER;
          } else if (
            normalizedInput === "WALK_IN" ||
            normalizedInput === "WALKIN"
          ) {
            nextBookingSource = BookingSource.WALK_IN;
          } else {
            throw new BadRequestException(
              "bookingSource must be either WALK_IN or BROKER",
            );
          }
        }

        const brokerNameInput =
          data.brokerName !== undefined ? data.brokerName : booking.brokerName;
        const nextBrokerName = this.normalizeBrokerName(
          nextBookingSource,
          brokerNameInput,
        );

        if (nextBookingSource === BookingSource.BROKER && !nextBrokerName) {
          throw new BadRequestException(
            "brokerName is required when bookingSource is BROKER",
          );
        }

        if (isRoomChangeRequested && targetRoomId && parsedRoomChangeDate) {
          const moveDateUtc = this.toStartOfUtcDay(parsedRoomChangeDate);
          if (moveDateUtc < todayUtc) {
            throw new BadRequestException("roomChangeDate cannot be in the past");
          }

          const targetRoom = await tx.room.findUnique({
            where: { id: targetRoomId },
            select: {
              id: true,
            },
          });

          if (!targetRoom) {
            throw new NotFoundException("Target room not found");
          }

          const oldBookingEndDate = parsedRoomChangeDate;
          const newBookingMoveOutDate =
            parsedMoveOutDate ?? booking.moveOutDate ?? booking.endDate ?? null;

          await tx.booking.update({
            where: { id: booking.id },
            data: {
              status: BookingStatus.EXPIRED,
              moveOutDate: oldBookingEndDate,
              endDate: oldBookingEndDate,
              checkoutDate: oldBookingEndDate,
            },
          });

          await tx.bookingStatusHistory.create({
            data: {
              bookingId: booking.id,
              status: BookingStatus.EXPIRED,
              comment: `Room transfer completed to room ${targetRoomId}`,
            },
          });

          const newBooking = await tx.booking.create({
            data: {
              userId,
              roomId: targetRoomId,
              status: booking.status,
              startDate: parsedRoomChangeDate,
              moveInDate: parsedRoomChangeDate,
              moveOutDate: newBookingMoveOutDate,
              endDate: newBookingMoveOutDate,
              bookingFee: booking.bookingFee,
              bookingFeePaid: booking.bookingFeePaid,
              expiresAt: booking.expiresAt,
              bookingSource: nextBookingSource,
              brokerName: nextBrokerName,
            },
          });

          await tx.bookingStatusHistory.create({
            data: {
              bookingId: newBooking.id,
              status: newBooking.status,
              comment: `Booking created from room transfer from room ${currentRoomId}`,
            },
          });

          bookingIdForResponse = newBooking.id;
          createdNewTransferBooking = true;
        } else {
          const bookingUpdateData: Prisma.BookingUpdateInput = {};

          if (shouldUpdateBookingSource) {
            bookingUpdateData.bookingSource = nextBookingSource;
            bookingUpdateData.brokerName = nextBrokerName;
          }

          if (parsedMoveOutDate !== undefined) {
            bookingUpdateData.moveOutDate = parsedMoveOutDate;
            bookingUpdateData.endDate = parsedMoveOutDate;
          }

          // Update booking with tenant-specific rent
          if (data.newRent !== undefined) {
            (bookingUpdateData as any).rentAmount = new Prisma.Decimal(data.newRent);
          }
          
          if (Object.keys(bookingUpdateData).length > 0) {
            await tx.booking.update({
              where: { id: booking.id },
              data: bookingUpdateData,
            });
          }

          // Keep both management + listing occupancy in sync so admin/home listings show the latest occupiedUntil.
          const roomManagementUpdate: any = {};

          const effectiveOccupiedUntil = data.extendOccupiedUntil
            ? new Date(data.extendOccupiedUntil)
            : parsedMoveOutDate;

          if (effectiveOccupiedUntil) {
            roomManagementUpdate.managementOccupiedUntil = effectiveOccupiedUntil;
            roomManagementUpdate.managementStatus = "OCCUPIED";
            roomManagementUpdate.managementIsAvailable = false;
            roomManagementUpdate.occupiedUntil = effectiveOccupiedUntil;
            roomManagementUpdate.status = RoomStatus.OCCUPIED;
            roomManagementUpdate.isAvailable = false;
          }
          
          if (Object.keys(roomManagementUpdate).length > 0) {
            await tx.room.update({
              where: { id: currentRoomId },
              data: roomManagementUpdate,
            });
          }
        }

        return {
          bookingId: bookingIdForResponse,
          createdNewTransferBooking,
        };
      }, {
        maxWait: 10000,
        timeout: 20000,
      });

      // Fetch response data after commit to keep transaction short and avoid timeout.
      const [updatedUser, updatedBooking] = await Promise.all([
        this.prisma.user.findUnique({
          where: { id: userId },
        }),
        this.prisma.booking.findUnique({
          where: { id: transactionResult.bookingId },
          include: {
            room: {
              select: {
                id: true,
                name: true,
                type: true,
                floor: true,
                area: true,
                rent: true,
                deposit: true,
                status: true,
                isAvailable: true,
                occupiedFrom: true,
                occupiedUntil: true,
                availableAt: true,
                videoUrl: true,
                // Management fields
                managementRent: true,
                managementStatus: true,
                managementIsAvailable: true,
                managementOccupiedUntil: true,
              },
            },
          },
        }),
      ]);

      return {
        success: true,
        user: updatedUser,
        room: updatedBooking?.room,
        booking: updatedBooking,
        message: transactionResult.createdNewTransferBooking
          ? "Tenant updated. A new transfer booking has been created."
          : "Tenant updated successfully",
      };
    } catch (error) {
      console.error("REAL UPDATE TENANT ERROR:", error);
      throw error;
    }
  }

  async getAdminPayments() {
    const payments = await this.prisma.payment.findMany({
      select: {
        id: true,
        userId: true,
        bookingId: true,
        rentCycleId: true,
        amount: true,
        type: true,
        status: true,
        gateway: true,
        gatewayOrderId: true,
        gatewayPaymentId: true,
        gatewaySignature: true,
        description: true,
        invoiceUrl: true,
        createdAt: true,
        updatedAt: true,
        user: true,
        booking: { include: { room: { select: this.roomSafeSelect } } },
        rentCycle: true,
      } as any,
      orderBy: { createdAt: "desc" },
    });

    return payments.map((p: any) => ({
      ...p,
      tenantId: p.tenantId ?? p.userId,
      rentAmount: Number(p.rentAmount ?? p.amount ?? 0),
      paidAmount:
        p.paidAmount === null || p.paidAmount === undefined
          ? null
          : Number(p.paidAmount),
      pendingAmount: Number(p.pendingAmount ?? p.borrowedAmount ?? 0),
    }));
  }

  async markPaymentAsPaid(id: string, amountReceived?: number, note?: string, paymentMethod?: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id } });
    if (!payment) {
      throw new NotFoundException("Payment not found");
    }

    const amount = Number(amountReceived ?? payment.rentAmount ?? payment.amount ?? 0);
    // Default to CASH if not specified
    const method = paymentMethod?.toUpperCase() === "UPI" ? "ONLINE" : "CASH";
    return this.paymentsService.adminMarkCashPayment(id, amount, note, method as "ONLINE" | "CASH");
  }

  async getAdminDocuments() {
    return this.prisma.document.findMany({
      include: {
        user: true,
        booking: {
          include: { room: { select: this.roomSafeSelect } },
        },
      },
      orderBy: { uploadedAt: "desc" },
    });
  }

  async approveDocument(id: string) {
    return this.prisma.document.update({
      where: { id },
      data: { status: "APPROVED", reviewedAt: new Date(), rejectReason: null },
    });
  }

  async rejectDocument(id: string) {
    return this.prisma.document.update({
      where: { id },
      data: { status: "REJECTED", reviewedAt: new Date() },
    });
  }

  async getMaintenanceRequests() {
    try {
      const requests = await this.prisma.maintenanceTicket.findMany({
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

      return requests.map((req: any) => ({
        ...req,
        tenantName: req.tenant
          ? `${req.tenant.firstName || ""} ${req.tenant.lastName || ""}`.trim()
          : "Unknown",
        room: req.booking?.room || null,
        user: req.tenant,
        status: this.mapMaintenanceStatus(req.status),
      }));
    } catch (error) {
      console.error("Error fetching maintenance requests:", error);
      return [];
    }
  }

  async approveMaintenanceRequest(id: string, _amountToPayNow?: number) {
    try {
      const ticket = await this.prisma.maintenanceTicket.findUnique({
        where: { id },
        include: { tenant: true },
      });
      if (!ticket) {
        throw new NotFoundException("Maintenance request not found");
      }

      const updated = await this.prisma.maintenanceTicket.update({
        where: { id },
        data: {
          status: "RESOLVED",
          resolvedAt: new Date(),
          resolution: "Approved by admin",
        },
      });

      return {
        ...updated,
        status: this.mapMaintenanceStatus(updated.status),
      };
    } catch (error) {
      console.error("Error approving maintenance request:", error);
      throw error;
    }
  }

  async rejectMaintenanceRequest(id: string) {
    const ticket = await this.prisma.maintenanceTicket.findUnique({
      where: { id },
    });
    const updated = await this.prisma.maintenanceTicket.update({
      where: { id },
      data: {
        status: "CLOSED",
        resolvedAt: new Date(),
        resolution: "Rejected by admin",
      },
    });
    if (ticket?.tenantId) {
      await this.notificationsService.create(ticket.tenantId, {
        type: "PUSH",
        title: "Maintenance Decision",
        message: "Your maintenance request was rejected.",
      });
      this.eventEmitter.emitDashboardUpdate(ticket.tenantId, {
        maintenanceDecision: "REJECTED",
      });
    }
    return {
      ...updated,
      status: this.mapMaintenanceStatus(updated.status),
    };
  }

  async getPendingVerifications() {
    const pendingDocuments = await this.prisma.document.findMany({
      where: { status: "PENDING" },
      include: { user: true, booking: true },
    });

    const pendingBookings = await this.prisma.booking.findMany({
      where: { status: { in: ["PENDING", "VERIFICATION_PENDING"] } },
      include: { user: true, room: { select: this.roomSafeSelect }, documents: true },
    });

    const pendingTenants = await this.prisma.user.findMany({
      where: {
        role: "TENANT",
        accountStatus: "PENDING",
      },
      include: { tenantProfile: true },
    });

    return {
      documents: pendingDocuments,
      bookings: pendingBookings,
      tenants: pendingTenants,
    };
  }

  async approveTenant(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    if (user.role !== "TENANT") {
      throw new Error("User is not a tenant");
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        isApproved: true,
        accountStatus: "ACTIVE",
      },
    });
  }

  async rejectTenant(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    if (user.role !== "TENANT") {
      throw new Error("User is not a tenant");
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        isApproved: false,
        accountStatus: "REJECTED",
      },
    });
  }

  async suspendTenant(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        isApproved: false,
        accountStatus: "SUSPENDED",
      },
    });
  }

  async getMonthlyRevenue() {
    const now = new Date();
    const currentYear = now.getFullYear();
    
    // Get all completed payments for the current year
    const payments = await this.prisma.payment.findMany({
      where: {
        status: "COMPLETED",
        createdAt: {
          gte: new Date(currentYear, 0, 1),
          lt: new Date(currentYear + 1, 0, 1),
        },
      },
      select: {
        amount: true,
        createdAt: true,
      },
    });

    // Group by month
    const monthlyRevenue = Array.from({ length: 12 }, (_, i) => {
      const month = i;
      const monthPayments = payments.filter(p => {
        const paymentDate = new Date(p.createdAt);
        return paymentDate.getMonth() === month;
      });
      const total = monthPayments.reduce((sum, p) => sum + Number(p.amount), 0);
      return {
        month: new Date(currentYear, month, 1).toLocaleString("en-IN", { month: "short" }),
        revenue: total,
      };
    });

    return monthlyRevenue;
  }

  async getOccupancyData() {
    const [totalRooms, occupiedRooms] = await Promise.all([
      this.prisma.room.count({ where: { deletedAt: null } }),
      this.prisma.room.count({
        where: { deletedAt: null, isAvailable: false },
      }),
    ]);

    const availableRooms = totalRooms - occupiedRooms;
    const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

    return {
      totalRooms,
      occupiedRooms,
      availableRooms,
      occupancyRate,
    };
  }

  async createOfflineTenant(data: {
    firstName: string;
    lastName?: string;
    phone: string;
    roomId: string;
    moveInDate: string;
    moveOutDate?: string;
    bookingSource?: string;
    brokerName?: string;
    isFutureBooking?: boolean;
    expectedMoveIn?: string;
    rentAmount?: number;
  }) {
    if (!data.firstName || !data.phone || !data.roomId || !data.moveInDate) {
      throw new BadRequestException(
        "firstName, phone, roomId and moveInDate are required",
      );
    }

    const normalizedPhone = String(data.phone).trim();
    const normalizedRoomId = String(data.roomId).trim();

    if (!normalizedPhone) {
      throw new BadRequestException("Phone number cannot be empty");
    }

    const normalizedBookingSource = this.normalizeBookingSource(
      data.bookingSource as any,
    );
    const normalizedBrokerName = this.normalizeBrokerName(
      normalizedBookingSource,
      data.brokerName,
    );

    const requestedFutureBooking = data.isFutureBooking === true;
    const parsedMoveInDate = this.parseDateInput(data.moveInDate, "moveInDate");
    const parsedExpectedMoveIn = requestedFutureBooking
      ? this.parseDateInput(data.expectedMoveIn, "expectedMoveIn")
      : undefined;
    const parsedMoveOutDate = this.parseDateInput(data.moveOutDate, "moveOutDate");
    const effectiveMoveInDate = parsedExpectedMoveIn ?? parsedMoveInDate;

    if (!effectiveMoveInDate) {
      throw new BadRequestException("moveInDate must be a valid date");
    }

    const room = await this.prisma.room.findUnique({
      where: { id: normalizedRoomId },
      select: {
        id: true,
        name: true,
        rent: true,
        deposit: true,
        deletedAt: true,
        status: true,
        occupiedUntil: true,
        managementStatus: true,
        managementOccupiedUntil: true,
      },
    });

    if (!room || room.deletedAt) {
      throw new NotFoundException("Room not found");
    }

    const effectiveRoomStatus = room.managementStatus ?? room.status;
    const effectiveOccupiedUntil = room.managementOccupiedUntil ?? room.occupiedUntil;
    const derivedRoomOccupancy = this.deriveRoomOccupancyState(
      effectiveOccupiedUntil,
      effectiveRoomStatus,
    );

    if (derivedRoomOccupancy.status === RoomStatus.MAINTENANCE) {
      throw new BadRequestException(
        "Selected room is under maintenance. Please choose another room.",
      );
    }

    const occupiedBasedFuture = !derivedRoomOccupancy.isAvailable;
    let finalMoveInDate = effectiveMoveInDate;
    let wasMoveInAutoAdjusted = false;
    if (occupiedBasedFuture && effectiveOccupiedUntil) {
      const occupiedUntilDay = this.toStartOfUtcDay(new Date(effectiveOccupiedUntil));
      const requestedMoveInDay = this.toStartOfUtcDay(effectiveMoveInDate);
      if (requestedMoveInDay <= occupiedUntilDay) {
        finalMoveInDate = new Date(occupiedUntilDay);
        finalMoveInDate.setUTCDate(finalMoveInDate.getUTCDate() + 1);
        wasMoveInAutoAdjusted = true;
      }
    }

    const todayStart = this.toStartOfUtcDay(new Date());
    const isMoveInFuture = this.toStartOfUtcDay(finalMoveInDate) > todayStart;
    const shouldCreateFutureBooking = occupiedBasedFuture || isMoveInFuture;

    if (parsedMoveOutDate && parsedMoveOutDate <= finalMoveInDate) {
      throw new BadRequestException("moveOutDate must be after moveInDate");
    }

    const existingUser = await this.prisma.user.findFirst({
      where: { phone: normalizedPhone },
    });

    if (existingUser) {
      const existingBooking = await this.prisma.booking.findFirst({
        where: {
          userId: existingUser.id,
          deletedAt: null,
          status: { in: this.activeTenantBookingStatuses },
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          moveOutDate: true,
          checkoutDate: true,
          endDate: true,
          startDate: true,
        },
      });

      if (existingBooking) {
        if (!shouldCreateFutureBooking) {
          throw new BadRequestException(
            "A user with this phone number already has an active booking",
          );
        }

        const existingBookingEnd =
          existingBooking.moveOutDate ??
          existingBooking.checkoutDate ??
          existingBooking.endDate ??
          null;
        if (!existingBookingEnd) {
          throw new BadRequestException(
            "This user already has an active booking without a move-out date. Complete/update that booking first.",
          );
        }

        const existingEndDay = this.toStartOfUtcDay(new Date(existingBookingEnd));
        const newMoveInDay = this.toStartOfUtcDay(finalMoveInDate);
        if (newMoveInDay <= existingEndDay) {
          throw new BadRequestException(
            `Future move-in must be after the current booking end date (${existingEndDay.toISOString().split("T")[0]}).`,
          );
        }
      }
    }

    return this.prisma.$transaction(async (tx) => {
      let user: any;

      if (existingUser) {
        user = await tx.user.update({
          where: { id: existingUser.id },
          data: {
            firstName: data.firstName,
            lastName: data.lastName || existingUser.lastName,
            isActive: true,
            isApproved: true,
            accountStatus: "ACTIVE",
          },
        });
      } else {
        user = await tx.user.create({
          data: {
            firstName: data.firstName,
            lastName: data.lastName || "",
            phone: normalizedPhone,
            role: "TENANT",
            isActive: true,
            isApproved: true,
            accountStatus: "ACTIVE",
          },
        });
      }

      const tenantType = shouldCreateFutureBooking
        ? TenantType.FUTURE
        : TenantType.ACTIVE;
      const now = new Date();

      const booking = await tx.booking.create({
        data: {
          userId: user.id,
          roomId: normalizedRoomId,
          startDate: finalMoveInDate,
          moveInDate: finalMoveInDate,
          endDate: parsedMoveOutDate || undefined,
          moveOutDate: parsedMoveOutDate || undefined,
          status: BookingStatus.APPROVED,
          bookingSource: normalizedBookingSource,
          brokerName: normalizedBrokerName,
          tenantType,
          expectedMoveIn: shouldCreateFutureBooking ? finalMoveInDate : undefined,
          bookingDate: shouldCreateFutureBooking ? now : undefined,
          ...(data.rentAmount !== undefined
            ? { rentAmount: new Prisma.Decimal(data.rentAmount) }
            : {}),
          statusHistory: {
            create: {
              status: BookingStatus.APPROVED,
              comment: shouldCreateFutureBooking
                ? `Future booking auto-created by admin (room occupied). Expected move-in: ${finalMoveInDate.toISOString().split("T")[0]}`
                : "Offline tenant created by admin",
            },
          },
        },
      });

      if (!shouldCreateFutureBooking) {
        const updatedRoom = await tx.room.update({
          where: { id: normalizedRoomId },
          data: {
            status: RoomStatus.OCCUPIED,
            isAvailable: false,
            occupiedFrom: finalMoveInDate,
            occupiedUntil: parsedMoveOutDate || undefined,
            managementStatus: RoomStatus.OCCUPIED,
            managementIsAvailable: false,
            managementOccupiedUntil: parsedMoveOutDate || undefined,
          } as any,
        });
        this.eventEmitter.emitRoomUpdated(normalizedRoomId, {
          status: updatedRoom.status,
          isAvailable: updatedRoom.isAvailable,
          occupiedFrom: updatedRoom.occupiedFrom,
          occupiedUntil: updatedRoom.occupiedUntil,
        });
      } else {
        // Future tenant: if room currently occupied keep OCCUPIED, else mark RESERVED.
        const occupiedUntilDate = effectiveOccupiedUntil ? new Date(effectiveOccupiedUntil) : null;
        const roomUpdatePayload = occupiedBasedFuture
          ? ({
              status: RoomStatus.OCCUPIED,
              isAvailable: false,
              occupiedUntil:
                occupiedUntilDate && !Number.isNaN(occupiedUntilDate.getTime())
                  ? occupiedUntilDate
                  : undefined,
            } as any)
          : ({
              status: RoomStatus.RESERVED,
              isAvailable: false,
              availableAt: finalMoveInDate,
              managementStatus: RoomStatus.RESERVED,
              managementIsAvailable: false,
            } as any);
        const updatedRoom = await tx.room.update({
          where: { id: normalizedRoomId },
          data: roomUpdatePayload,
        });
        this.eventEmitter.emitRoomUpdated(normalizedRoomId, {
          status: updatedRoom.status,
          isAvailable: updatedRoom.isAvailable,
          occupiedFrom: updatedRoom.occupiedFrom,
          occupiedUntil: updatedRoom.occupiedUntil,
          tenantType: "FUTURE",
        });
      }

      return {
        success: true,
        tenantType,
        user,
        booking,
        message: shouldCreateFutureBooking
          ? wasMoveInAutoAdjusted
            ? `Future booking created successfully. Move-in auto-set to ${finalMoveInDate.toISOString().split("T")[0]} based on current occupancy.`
            : "Future booking created successfully"
          : "Offline tenant created successfully",
      };
    });
  }
}
