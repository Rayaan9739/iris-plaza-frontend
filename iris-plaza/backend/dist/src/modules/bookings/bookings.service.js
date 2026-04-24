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
var BookingsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const library_1 = require("@prisma/client/runtime/library");
const prisma_service_1 = require("../../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
const agreements_service_1 = require("../agreements/agreements.service");
const event_emitter_service_1 = require("../../common/services/event-emitter.service");
let BookingsService = BookingsService_1 = class BookingsService {
    constructor(prisma, notificationsService, agreementsService, eventEmitter) {
        this.prisma = prisma;
        this.notificationsService = notificationsService;
        this.agreementsService = agreementsService;
        this.eventEmitter = eventEmitter;
        this.logger = new common_1.Logger(BookingsService_1.name);
        this.conflictBookingStatuses = [
            "PENDING",
            "PENDING_APPROVAL",
            "VERIFICATION_PENDING",
            "APPROVED_PENDING_PAYMENT",
            "APPROVED",
            "RESERVED",
        ];
        this.roomSafeSelect = {
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
            managementRent: true,
            managementStatus: true,
            managementIsAvailable: true,
            managementOccupiedUntil: true,
            media: { orderBy: { createdAt: "asc" } },
            amenities: { include: { amenity: true } },
            images: { orderBy: { order: "asc" } },
        };
    }
    toOptionalNumber(value) {
        if (value === null || value === undefined)
            return null;
        if (typeof value === "string" && value.trim() === "")
            return null;
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    }
    toStartOfUtcDay(date) {
        return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    }
    toEndOfUtcDay(date) {
        return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999));
    }
    toNextUtcDayStart(date) {
        return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1));
    }
    getBookingWindow(booking) {
        const startCandidate = booking.moveInDate ??
            booking.startDate ??
            booking.createdAt ??
            null;
        const endCandidate = booking.moveOutDate ??
            booking.endDate ??
            booking.checkoutDate ??
            null;
        const normalizedStart = startCandidate && !Number.isNaN(new Date(startCandidate).getTime())
            ? this.toStartOfUtcDay(new Date(startCandidate))
            : null;
        const normalizedEnd = endCandidate && !Number.isNaN(new Date(endCandidate).getTime())
            ? this.toNextUtcDayStart(new Date(endCandidate))
            : null;
        return {
            start: normalizedStart,
            end: normalizedEnd,
        };
    }
    hasBookingOverlap(booking, requestedStart, requestedEnd) {
        const { start, end } = this.getBookingWindow(booking);
        if (!start) {
            return true;
        }
        const effectiveEnd = end ?? new Date("9999-12-31T00:00:00.000Z");
        return start < requestedEnd && effectiveEnd > requestedStart;
    }
    normalizeDateInputUtc(value, fieldName, boundary = "start") {
        const parsed = new Date(String(value));
        if (Number.isNaN(parsed.getTime())) {
            throw new common_1.BadRequestException(`Invalid ${fieldName}`);
        }
        return boundary === "end"
            ? this.toEndOfUtcDay(parsed)
            : this.toStartOfUtcDay(parsed);
    }
    normalizeBookingSource(bookingSource, source) {
        const rawSource = String(bookingSource ?? source ?? client_1.BookingSource.WALK_IN)
            .trim()
            .toUpperCase()
            .replace(/[\s-]+/g, "_");
        if (rawSource === client_1.BookingSource.BROKER) {
            return client_1.BookingSource.BROKER;
        }
        if (rawSource === client_1.BookingSource.WALK_IN || rawSource === "WALKIN") {
            return client_1.BookingSource.WALK_IN;
        }
        throw new common_1.BadRequestException("bookingSource must be either WALK_IN or BROKER");
    }
    normalizeBrokerName(bookingSource, brokerName) {
        const normalizedBrokerName = typeof brokerName === "string" ? brokerName.trim() : "";
        if (bookingSource === client_1.BookingSource.BROKER) {
            if (!normalizedBrokerName) {
                throw new common_1.BadRequestException("Broker name is required when booking source is BROKER");
            }
            return normalizedBrokerName;
        }
        return null;
    }
    monthKey(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    }
    computeNextRentDueDate(moveInDate, fromDate = new Date()) {
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
    async notifyAllAdmins(title, message) {
        const admins = await this.prisma.user.findMany({
            where: { role: "ADMIN", isActive: true },
            select: { id: true },
        });
        for (const admin of admins) {
            await this.notificationsService.create(admin.id, {
                type: client_1.NotificationType.PUSH,
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
    async findMyBookings(userId) {
        return this.prisma.booking.findMany({
            where: {
                userId,
                status: { in: ["APPROVED", "APPROVED_PENDING_PAYMENT", "PENDING_APPROVAL", "VERIFICATION_PENDING"] }
            },
            include: {
                room: { select: this.roomSafeSelect },
                statusHistory: { orderBy: { createdAt: "desc" } },
            },
        });
    }
    async findMyApprovedBooking(userId) {
        const booking = await this.prisma.booking.findFirst({
            where: {
                userId,
                status: { in: ["APPROVED", "APPROVED_PENDING_PAYMENT"] },
            },
            include: {
                room: {
                    select: this.roomSafeSelect,
                },
                statusHistory: { orderBy: { createdAt: "desc" } },
                agreement: true,
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
                rent: Number(booking?.rentAmount ??
                    booking.room?.managementRent ??
                    booking.room?.rent ?? 0),
                deposit: Number(booking.room?.deposit ?? 0),
                status: booking.room?.managementStatus ?? booking.room?.status ?? 'AVAILABLE',
                isAvailable: booking.room?.managementIsAvailable ?? booking.room?.isAvailable ?? true,
                occupiedUntil: booking.room?.managementOccupiedUntil ?? booking.room?.occupiedUntil,
            },
            agreement: booking.agreement,
        };
    }
    async findOne(id) {
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
            throw new common_1.NotFoundException("Booking not found");
        }
        return booking;
    }
    async create(input) {
        console.log("BOOKING SERVICE CREATE INPUT:", input);
        const { userId, roomId, moveInDate, moveOutDate, source, bookingSource, brokerName, } = input;
        const normalizedSource = this.normalizeBookingSource(bookingSource, source);
        const normalizedBrokerName = this.normalizeBrokerName(normalizedSource, brokerName);
        if (!userId || !roomId || !moveInDate) {
            console.error("BOOKING VALIDATION FAILED:", { userId, roomId, moveInDate });
            throw new common_1.BadRequestException("userId, roomId and moveInDate are required");
        }
        const normalizedRoomId = String(roomId);
        const normalizedMoveInDate = this.normalizeDateInputUtc(String(moveInDate), "moveInDate");
        if (!moveOutDate) {
            throw new common_1.BadRequestException("moveOutDate is required");
        }
        const normalizedMoveOutDate = this.normalizeDateInputUtc(String(moveOutDate), "moveOutDate", "end");
        if (normalizedMoveOutDate <= normalizedMoveInDate) {
            throw new common_1.BadRequestException("moveOutDate must be after moveInDate");
        }
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new common_1.BadRequestException("User not found");
        }
        const existingUserBookings = await this.prisma.booking.findMany({
            where: {
                userId,
                deletedAt: null,
                status: {
                    in: this.conflictBookingStatuses,
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
        const userBookingConflict = existingUserBookings.find((booking) => this.hasBookingOverlap(booking, normalizedMoveInDate, normalizedMoveOutDate));
        if (userBookingConflict) {
            this.logger.warn(`[BookingCreate] User booking conflict userId=${userId} bookingId=${userBookingConflict.id} status=${userBookingConflict.status}`);
            throw new common_1.BadRequestException("You already have an active room or pending request");
        }
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
            throw new common_1.BadRequestException("You already occupy a room");
        }
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
            },
        });
        if (!room || room.deletedAt) {
            throw new common_1.BadRequestException("Room not found");
        }
        const normalizedRoomStatus = String(room.status || "").toUpperCase();
        const occupiedUntilRaw = room.occupiedUntil;
        const occupiedUntilDate = occupiedUntilRaw ? new Date(occupiedUntilRaw) : null;
        const normalizedOccupiedUntilDate = occupiedUntilDate && !Number.isNaN(occupiedUntilDate.getTime())
            ? this.toEndOfUtcDay(occupiedUntilDate)
            : null;
        if (normalizedRoomStatus === "RESERVED") {
            throw new common_1.BadRequestException("Room is already reserved");
        }
        if (normalizedRoomStatus === "OCCUPIED") {
            if (!normalizedOccupiedUntilDate) {
                throw new common_1.BadRequestException("Invalid occupied room state - no occupiedUntil date");
            }
            if (normalizedMoveInDate <= normalizedOccupiedUntilDate) {
                const formattedDate = normalizedOccupiedUntilDate.toISOString().split('T')[0];
                throw new common_1.BadRequestException(`Room is occupied until ${formattedDate}. Move-in date must be after.`);
            }
        }
        else if (normalizedRoomStatus !== "AVAILABLE") {
            throw new common_1.BadRequestException("Room is not available for booking");
        }
        const existingRoomBookings = await this.prisma.booking.findMany({
            where: {
                roomId: normalizedRoomId,
                deletedAt: null,
                status: {
                    in: this.conflictBookingStatuses,
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
        const existingActiveBooking = existingRoomBookings.find((booking) => this.hasBookingOverlap(booking, normalizedMoveInDate, normalizedMoveOutDate));
        if (existingActiveBooking) {
            this.logger.warn(`[BookingCreate] Room booking conflict roomId=${normalizedRoomId} bookingId=${existingActiveBooking.id} status=${existingActiveBooking.status}`);
            throw new common_1.BadRequestException("Room already has an active booking request");
        }
        const internalRent = Number(room.rent ?? 0);
        const internalDeposit = Number(room.deposit ?? 0);
        const roomName = String(room.name || "this room");
        const txResult = await this.prisma.$transaction(async (tx) => {
            const booking = await tx.booking.create({
                data: {
                    userId,
                    roomId: normalizedRoomId,
                    startDate: normalizedMoveInDate,
                    moveInDate: normalizedMoveInDate,
                    endDate: normalizedMoveOutDate,
                    moveOutDate: normalizedMoveOutDate,
                    checkoutDate: normalizedMoveOutDate,
                    status: "PENDING_APPROVAL",
                    bookingSource: normalizedSource,
                    brokerName: normalizedBrokerName,
                    expiresAt: null,
                    statusHistory: {
                        create: {
                            status: "PENDING_APPROVAL",
                            comment: `Booking request submitted (rent ${internalRent}, deposit ${internalDeposit}). Waiting for admin approval.`,
                        },
                    },
                },
            });
            if (normalizedRoomStatus === "AVAILABLE") {
                await tx.room.update({
                    where: { id: normalizedRoomId },
                    data: {
                        status: "RESERVED",
                        isAvailable: false,
                    },
                });
            }
            return { bookingId: booking.id, roomName };
        });
        this.eventEmitter.emitRoomUpdated(normalizedRoomId, {
            status: normalizedRoomStatus === "OCCUPIED" ? "OCCUPIED" : "RESERVED",
            isAvailable: false,
        });
        await this.notifyAllAdmins("New booking request", `New booking request received for room ${txResult.roomName}.`);
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
    async updateStatus(id, status, comment, changedBy) {
        const booking = await this.findOne(id);
        const normalizedStatus = String(status || "").toUpperCase();
        const currentStatus = String(booking.status || "").toUpperCase();
        console.log(`[BookingStatus] updateStatus called for booking ${id}: ${currentStatus} -> ${normalizedStatus}`);
        const allowedTransitions = {
            PENDING_APPROVAL: ["APPROVED", "APPROVED_PENDING_PAYMENT", "REJECTED", "CANCELLED"],
            PENDING: ["APPROVED", "APPROVED_PENDING_PAYMENT", "REJECTED", "CANCELLED"],
            VERIFICATION_PENDING: ["APPROVED", "APPROVED_PENDING_PAYMENT", "REJECTED", "CANCELLED"],
            APPROVED_PENDING_PAYMENT: ["APPROVED", "REJECTED", "CANCELLED"],
            APPROVED: ["EXPIRED", "CANCELLED"],
            REJECTED: [],
            CANCELLED: [],
            EXPIRED: [],
        };
        if (!allowedTransitions[currentStatus]?.includes(normalizedStatus)) {
            throw new common_1.BadRequestException(`Invalid status transition from ${currentStatus} to ${normalizedStatus}`);
        }
        const updateData = { status: normalizedStatus };
        if (normalizedStatus === "APPROVED") {
            const occupiedFrom = booking.moveInDate ?? booking.startDate;
            const occupiedUntil = booking.moveOutDate ?? booking.checkoutDate ?? booking.endDate ?? null;
            await this.prisma.room.update({
                where: { id: booking.roomId },
                data: {
                    status: "OCCUPIED",
                    isAvailable: false,
                    occupiedFrom,
                    occupiedUntil,
                },
            });
            this.eventEmitter.emitRoomUpdated(booking.roomId, {
                status: "OCCUPIED",
                occupiedFrom,
                occupiedUntil,
            });
            await this.prisma.user.update({
                where: { id: booking.userId },
                data: { accountStatus: "ACTIVE" },
            });
            await this.notificationsService.create(booking.userId, {
                type: client_1.NotificationType.PUSH,
                title: "Booking Approved",
                message: "Your booking has been approved by the admin. Your room is now ready for move-in.",
            });
            console.log(`[Agreement] Generating rental agreement for booking ${booking.id}...`);
            try {
                const agreementUrl = await this.agreementsService.generateRentalAgreement(booking.id);
                console.log(`[Agreement] Rental agreement generated successfully for booking ${booking.id}: ${agreementUrl}`);
                await this.notificationsService.create(booking.userId, {
                    type: client_1.NotificationType.PUSH,
                    title: "Rental Agreement Generated",
                    message: "Your rental agreement has been generated. You can download it from the Documents section.",
                });
            }
            catch (error) {
                console.error(`[Agreement] Failed to generate rental agreement for booking ${booking.id}:`, error?.message || error);
                console.log(`[Agreement] Booking ${booking.id} approved successfully (agreement generation failed but booking is active)`);
            }
        }
        if (normalizedStatus === "APPROVED_PENDING_PAYMENT") {
            await this.notificationsService.create(booking.userId, {
                type: client_1.NotificationType.PUSH,
                title: "Booking Approved",
                message: "Your booking request is approved. Please complete the initial payment (Deposit + First month rent) to confirm your occupancy.",
            });
            const bookingWithRoom = await this.prisma.booking.findUnique({
                where: { id: booking.id },
                include: {
                    room: { select: { rent: true, deposit: true } },
                },
            });
            if (!bookingWithRoom) {
                throw new common_1.NotFoundException("Booking not found");
            }
            const depositAmount = Number(bookingWithRoom.room.deposit ?? 0);
            const rentAmount = Number(bookingWithRoom.rentAmount ?? bookingWithRoom.room.rent ?? 0);
            const month = this.monthKey(new Date());
            const existingDeposit = await this.prisma.payment.findFirst({
                where: {
                    bookingId: booking.id,
                    userId: booking.userId,
                    type: "DEPOSIT",
                    month,
                },
            });
            if (!existingDeposit) {
                await this.prisma.payment.create({
                    data: {
                        userId: booking.userId,
                        tenantId: booking.userId,
                        roomId: booking.roomId,
                        bookingId: booking.id,
                        month,
                        amount: new library_1.Decimal(depositAmount),
                        rentAmount: new library_1.Decimal(depositAmount),
                        pendingAmount: new library_1.Decimal(depositAmount),
                        paidAmount: new library_1.Decimal(0),
                        amountPaid: new library_1.Decimal(0),
                        borrowedAmount: new library_1.Decimal(0),
                        type: "DEPOSIT",
                        status: "PENDING",
                        paymentMethod: "ONLINE",
                        description: "Deposit due on booking approval",
                    },
                });
            }
            const dueDate = this.computeNextRentDueDate(booking.moveInDate ?? booking.startDate);
            const dueMonth = this.monthKey(dueDate);
            const existingRent = await this.prisma.payment.findFirst({
                where: {
                    bookingId: booking.id,
                    userId: booking.userId,
                    type: "RENT",
                    month: dueMonth,
                },
            });
            if (!existingRent) {
                await this.prisma.payment.create({
                    data: {
                        userId: booking.userId,
                        tenantId: booking.userId,
                        roomId: booking.roomId,
                        bookingId: booking.id,
                        month: dueMonth,
                        amount: new library_1.Decimal(rentAmount),
                        rentAmount: new library_1.Decimal(rentAmount),
                        pendingAmount: new library_1.Decimal(0),
                        paidAmount: new library_1.Decimal(0),
                        amountPaid: new library_1.Decimal(0),
                        borrowedAmount: new library_1.Decimal(0),
                        type: "RENT",
                        status: "PENDING",
                        paymentMethod: "ONLINE",
                        description: `Monthly rent due by ${dueDate.toISOString()}`,
                    },
                });
            }
        }
        if (normalizedStatus === "REJECTED" || normalizedStatus === "CANCELLED") {
            const currentRoom = await this.prisma.room.findUnique({
                where: { id: booking.roomId },
                select: { status: true, occupiedUntil: true },
            });
            const shouldRemainOccupied = currentRoom?.status === "OCCUPIED" &&
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
            }
            else {
                this.logger.log(`Room ${booking.roomId} remains OCCUPIED until ${currentRoom.occupiedUntil}`);
            }
            updateData.expiresAt = new Date();
            if (normalizedStatus === "REJECTED") {
                await this.notificationsService.create(booking.userId, {
                    type: client_1.NotificationType.PUSH,
                    title: "Booking Rejected",
                    message: "Your booking request was rejected.",
                });
            }
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
            const currentRoom = await this.prisma.room.findUnique({
                where: { id: booking.roomId },
                select: { status: true, occupiedUntil: true },
            });
            const shouldRemainOccupied = currentRoom?.status === "OCCUPIED" &&
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
            }
            else {
                this.logger.log(`Room ${booking.roomId} remains OCCUPIED until ${currentRoom.occupiedUntil}`);
            }
        }
        const updated = await this.prisma.booking.update({
            where: { id },
            data: updateData,
            include: { room: { select: this.roomSafeSelect }, user: true },
        });
        await this.prisma.bookingStatusHistory.create({
            data: {
                bookingId: id,
                status: normalizedStatus,
                comment,
                changedBy,
            },
        });
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
    async cancel(id) {
        const booking = await this.findOne(id);
        if (["APPROVED", "REJECTED", "CANCELLED"].includes(booking.status)) {
            throw new common_1.BadRequestException("Cannot cancel this booking");
        }
        const updated = await this.prisma.booking.update({
            where: { id },
            data: { status: "CANCELLED" },
            include: { room: { select: this.roomSafeSelect } },
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
            where: { status: { in: ["PENDING", "PENDING_APPROVAL", "VERIFICATION_PENDING"] } },
            include: {
                user: true,
                room: { select: this.roomSafeSelect },
                documents: true,
            },
        });
    }
    async approve(id) {
        return this.updateStatus(id, "APPROVED", "Booking request approved by admin.");
    }
    async reject(id) {
        return this.updateStatus(id, "REJECTED", "Booking rejected by admin");
    }
    async checkExpiredCheckouts() {
        const expiredBookings = await this.prisma.booking.findMany({
            where: {
                status: "APPROVED",
                checkoutDate: { lte: new Date() },
            },
        });
        const results = [];
        for (const booking of expiredBookings) {
            try {
                await this.updateStatus(booking.id, "EXPIRED", "Booking completed at move-out date", "system");
                this.eventEmitter.emitBookingExpired(booking.userId, booking.id, {
                    roomId: booking.roomId,
                    checkoutDate: booking.checkoutDate,
                });
                results.push({ bookingId: booking.id, success: true });
            }
            catch (error) {
                results.push({
                    bookingId: booking.id,
                    success: false,
                    error: String(error),
                });
            }
        }
        return results;
    }
    async createExtensionRequest(userId, bookingId, requestedCheckoutDate) {
        const booking = await this.findOne(bookingId);
        if (booking.userId !== userId) {
            throw new common_1.BadRequestException("Unauthorized");
        }
        if (booking.status !== "APPROVED") {
            throw new common_1.BadRequestException("Cannot extend non-approved booking");
        }
        if (!booking.checkoutDate) {
            throw new common_1.BadRequestException("No checkout date set for this booking");
        }
        const newCheckoutDate = new Date(requestedCheckoutDate);
        if (Number.isNaN(newCheckoutDate.getTime())) {
            throw new common_1.BadRequestException("Invalid checkout date format");
        }
        if (newCheckoutDate <= booking.checkoutDate) {
            throw new common_1.BadRequestException("New checkout date must be after current checkout date");
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
        await this.notifyAllAdmins("Extension request", "A tenant submitted a move-out extension request.");
        return created;
    }
    async approveExtensionRequest(extensionRequestId) {
        const extensionRequest = await this.prisma.extensionRequest.findUnique({
            where: { id: extensionRequestId },
            include: { booking: true },
        });
        if (!extensionRequest) {
            throw new common_1.NotFoundException("Extension request not found");
        }
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
                status: "APPROVED",
                approvedAt: new Date(),
            },
            include: {
                booking: { include: { room: { select: this.roomSafeSelect } } },
                tenant: true,
            },
        });
        await this.notificationsService.create(extensionRequest.tenantId, {
            type: client_1.NotificationType.PUSH,
            title: "Extension Approved",
            message: "Your extension request has been approved.",
        });
        this.eventEmitter.emitDashboardUpdate(extensionRequest.tenantId, {
            extensionDecision: "APPROVED",
        });
        return updated;
    }
    async rejectExtensionRequest(extensionRequestId, reason) {
        const extensionRequest = await this.prisma.extensionRequest.findUnique({
            where: { id: extensionRequestId },
        });
        if (!extensionRequest) {
            throw new common_1.NotFoundException("Extension request not found");
        }
        const updated = await this.prisma.extensionRequest.update({
            where: { id: extensionRequestId },
            data: {
                status: "REJECTED",
                rejectionReason: reason,
            },
            include: {
                booking: { include: { room: { select: this.roomSafeSelect } } },
                tenant: true,
            },
        });
        const booking = await this.prisma.booking.update({
            where: { id: extensionRequest.bookingId },
            data: { status: "EXPIRED" },
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
            type: client_1.NotificationType.PUSH,
            title: "Extension Rejected",
            message: "Your extension request was rejected. Please vacate as scheduled.",
        });
        this.eventEmitter.emitDashboardUpdate(extensionRequest.tenantId, {
            extensionDecision: "REJECTED",
        });
        return updated;
    }
    async getExtensionRequests(bookingId) {
        return this.prisma.extensionRequest.findMany({
            where: { bookingId },
            include: {
                booking: { include: { room: { select: this.roomSafeSelect } } },
                tenant: true,
            },
            orderBy: { createdAt: "desc" },
        });
    }
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
};
exports.BookingsService = BookingsService;
exports.BookingsService = BookingsService = BookingsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService,
        agreements_service_1.AgreementsService,
        event_emitter_service_1.EventEmitterService])
], BookingsService);
//# sourceMappingURL=bookings.service.js.map