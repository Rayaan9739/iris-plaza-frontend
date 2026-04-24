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
var RoomsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomsService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const client_1 = require("@prisma/client");
const library_1 = require("@prisma/client/runtime/library");
const prisma_service_1 = require("../../prisma/prisma.service");
const room_type_enum_1 = require("./enums/room-type.enum");
const LEGACY_ROOM_TYPE_MAP = {
    STUDIO: room_type_enum_1.RoomType.ONE_BHK,
    SINGLE: room_type_enum_1.RoomType.ONE_BHK,
    DOUBLE: room_type_enum_1.RoomType.ONE_BHK,
    THREE_BHK: room_type_enum_1.RoomType.TWO_BHK,
    SUITE: room_type_enum_1.RoomType.PENTHOUSE,
    PENT_HOUSE: room_type_enum_1.RoomType.PENTHOUSE,
};
let RoomsService = RoomsService_1 = class RoomsService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(RoomsService_1.name);
        this.roomListSelect = {
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
            videoUrl: true,
            createdAt: true,
            updatedAt: true,
            deletedAt: true,
            managementRent: true,
            managementStatus: true,
            managementIsAvailable: true,
            managementOccupiedUntil: true,
            media: { orderBy: { createdAt: "asc" }, take: 1 },
            images: { orderBy: { order: "asc" }, take: 1 },
            amenities: { include: { amenity: true } },
        };
        this.roomDetailSelect = {
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
            media: { orderBy: { createdAt: "asc" } },
            images: { orderBy: { order: "asc" } },
            amenities: { include: { amenity: true } },
        };
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
    deriveRoomOccupancyState(occupiedUntil, currentStatus) {
        const normalizedCurrentStatus = String(currentStatus ?? "").toUpperCase();
        if (normalizedCurrentStatus === client_1.RoomStatus.MAINTENANCE) {
            return {
                status: client_1.RoomStatus.MAINTENANCE,
                isAvailable: false,
            };
        }
        if (normalizedCurrentStatus === client_1.RoomStatus.RESERVED) {
            return {
                status: client_1.RoomStatus.RESERVED,
                isAvailable: false,
            };
        }
        if (!occupiedUntil) {
            return {
                status: client_1.RoomStatus.AVAILABLE,
                isAvailable: true,
            };
        }
        const parsedOccupiedUntil = new Date(occupiedUntil);
        const occupiedThrough = this.toEndOfUtcDay(parsedOccupiedUntil);
        if (Number.isNaN(parsedOccupiedUntil.getTime()) ||
            occupiedThrough <= new Date()) {
            return {
                status: client_1.RoomStatus.AVAILABLE,
                isAvailable: true,
            };
        }
        return {
            status: client_1.RoomStatus.OCCUPIED,
            isAvailable: false,
        };
    }
    async applyOccupancyStateFromBookings(rooms) {
        if (!rooms.length) {
            return rooms;
        }
        return rooms.map((room) => {
            const derivedOccupancy = this.deriveRoomOccupancyState(room.occupiedUntil, room.status);
            return {
                ...room,
                status: derivedOccupancy.status,
                isAvailable: derivedOccupancy.isAvailable,
            };
        });
    }
    normalizeRoomType(input) {
        const raw = String(input ?? "").trim();
        const normalized = raw.replace(/\s+/g, "_").toUpperCase();
        const mapped = LEGACY_ROOM_TYPE_MAP[normalized] ?? normalized;
        if (mapped === room_type_enum_1.RoomType.ONE_BHK ||
            mapped === room_type_enum_1.RoomType.TWO_BHK ||
            mapped === room_type_enum_1.RoomType.PENTHOUSE) {
            return mapped;
        }
        throw new common_1.BadRequestException("Room type must be ONE_BHK, TWO_BHK, or PENTHOUSE");
    }
    parseSelectedMonthStart(month) {
        if (!month) {
            return null;
        }
        const normalized = String(month).trim();
        const match = normalized.match(/^(\d{4})-(\d{2})$/);
        if (!match) {
            throw new common_1.BadRequestException("month must be in YYYY-MM format");
        }
        const year = Number(match[1]);
        const monthIndex = Number(match[2]) - 1;
        if (!Number.isFinite(year) ||
            !Number.isFinite(monthIndex) ||
            monthIndex < 0 ||
            monthIndex > 11) {
            throw new common_1.BadRequestException("month must be in YYYY-MM format");
        }
        return new Date(Date.UTC(year, monthIndex, 1));
    }
    mapMediaToImageRows(media) {
        if (!media?.length) {
            return [];
        }
        return media
            .map((item, index) => {
            const url = String(item?.url || "").trim();
            if (!url)
                return null;
            const isVideo = String(item?.type || "").toLowerCase() === "video";
            return {
                url,
                order: index,
                caption: isVideo ? "ROOM_VIDEO" : undefined,
            };
        })
            .filter(Boolean);
    }
    getPrimaryVideoUrl(media) {
        if (!media?.length) {
            return undefined;
        }
        const firstVideo = media.find((item) => String(item?.type || "").toLowerCase() === "video" &&
            String(item?.url || "").trim().length > 0);
        return firstVideo ? String(firstVideo.url).trim() : undefined;
    }
    normalizeMediaInput(media, images, videoUrl) {
        if (media?.length) {
            return media
                .map((item) => ({
                type: String(item?.type || "").toLowerCase() === "video"
                    ? "video"
                    : "image",
                url: String(item?.url || "").trim(),
            }))
                .filter((item) => item.url.length > 0);
        }
        const fromImages = images
            ?.map((img) => String(img?.url || "").trim())
            .filter(Boolean)
            .map((url) => ({ type: "image", url })) ?? [];
        const fromVideo = String(videoUrl || "").trim();
        if (fromVideo) {
            fromImages.push({ type: "video", url: fromVideo });
        }
        return fromImages;
    }
    buildAmenityCreateInput(amenities) {
        if (!amenities?.length) {
            return undefined;
        }
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        const records = amenities
            .map((value) => String(value || "").trim())
            .filter(Boolean)
            .map((value) => {
            if (uuidRegex.test(value)) {
                return {
                    amenity: {
                        connect: { id: value },
                    },
                };
            }
            return {
                amenity: {
                    connectOrCreate: {
                        where: { name: value },
                        create: { name: value },
                    },
                },
            };
        });
        return records.length ? { create: records } : undefined;
    }
    async ensureRoomRulesTable() {
        try {
            await this.prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS room_rules (
          id BIGSERIAL PRIMARY KEY,
          room_id TEXT NOT NULL,
          rule TEXT NOT NULL
        )
      `);
            await this.prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS idx_room_rules_room_id
        ON room_rules(room_id)
      `);
        }
        catch (error) {
            console.error("Error ensuring room_rules table:", error);
            throw new Error(`Failed to create room_rules table: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async setRules(roomId, rules) {
        try {
            await this.ensureRoomRulesTable();
            await this.prisma.$executeRaw `
        DELETE FROM room_rules WHERE room_id = ${roomId}
      `;
            for (const rule of rules) {
                const trimmed = String(rule || "").trim();
                if (!trimmed)
                    continue;
                await this.prisma.$executeRaw `
          INSERT INTO room_rules(room_id, rule)
          VALUES (${roomId}, ${trimmed})
        `;
            }
        }
        catch (error) {
            console.error("Error setting room rules for room", roomId, ":", error);
            return;
        }
    }
    async getRulesByRoomIds(roomIds) {
        const map = new Map();
        roomIds.forEach((id) => map.set(id, []));
        if (!roomIds.length) {
            return map;
        }
        try {
            await this.ensureRoomRulesTable();
            const rows = await this.prisma.$queryRaw(client_1.Prisma.sql `SELECT room_id, rule FROM room_rules WHERE room_id IN (${client_1.Prisma.join(roomIds)})`);
            rows.forEach((row) => {
                const list = map.get(row.room_id) ?? [];
                list.push(row.rule);
                map.set(row.room_id, list);
            });
        }
        catch (error) {
            console.error("Error reading room rules:", error);
            return map;
        }
        return map;
    }
    async ensureRoomTransfersTable() {
        await this.prisma.$executeRawUnsafe(`
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
        await this.prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_room_transfers_effective_status
      ON room_transfers (effective_date, status)
    `);
    }
    async processDueRoomTransfers(now) {
        await this.ensureRoomTransfersTable();
        const dueTransfers = await this.prisma.$queryRaw `
      SELECT id, booking_id, user_id, from_room_id, to_room_id, effective_date, desired_move_out_date, status
      FROM room_transfers
      WHERE status = 'PENDING'
        AND effective_date <= ${now}
      ORDER BY effective_date ASC
      LIMIT 50
    `;
        if (!dueTransfers.length) {
            return 0;
        }
        let processed = 0;
        for (const transfer of dueTransfers) {
            try {
                const booking = await this.prisma.booking.findUnique({
                    where: { id: transfer.booking_id },
                    select: {
                        id: true,
                        roomId: true,
                        moveOutDate: true,
                        endDate: true,
                    },
                });
                if (!booking) {
                    await this.prisma.$executeRaw `
            UPDATE room_transfers
            SET status = 'FAILED', updated_at = NOW()
            WHERE id = ${transfer.id}
          `;
                    continue;
                }
                const finalMoveOutDate = transfer.desired_move_out_date ??
                    booking.moveOutDate ??
                    booking.endDate ??
                    null;
                await this.prisma.$transaction([
                    this.prisma.booking.update({
                        where: { id: transfer.booking_id },
                        data: {
                            roomId: transfer.to_room_id,
                            moveInDate: transfer.effective_date,
                            startDate: transfer.effective_date,
                            moveOutDate: finalMoveOutDate,
                            endDate: finalMoveOutDate,
                        },
                    }),
                    this.prisma.room.update({
                        where: { id: transfer.from_room_id },
                        data: {
                            status: "AVAILABLE",
                            isAvailable: true,
                            occupiedFrom: null,
                            occupiedUntil: null,
                            availableAt: null,
                        },
                    }),
                    this.prisma.room.update({
                        where: { id: transfer.to_room_id },
                        data: {
                            status: "OCCUPIED",
                            isAvailable: false,
                            occupiedFrom: transfer.effective_date,
                            occupiedUntil: finalMoveOutDate,
                            availableAt: null,
                        },
                    }),
                ]);
                await this.prisma.$executeRaw `
          UPDATE room_transfers
          SET status = 'COMPLETED', updated_at = NOW()
          WHERE id = ${transfer.id}
        `;
                processed += 1;
            }
            catch (error) {
                this.logger.error(`Failed processing room transfer ${transfer.id.toString()}: ${error instanceof Error ? error.message : String(error)}`, error instanceof Error ? error.stack : undefined);
            }
        }
        return processed;
    }
    async refreshExpiredOccupancies() {
        this.logger.log("Starting scheduled occupancy refresh...");
        const now = new Date();
        const maxRetries = 3;
        const retryDelay = 5000;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const result = await this.prisma.room.updateMany({
                    where: {
                        status: "OCCUPIED",
                        occupiedUntil: { lt: now },
                    },
                    data: {
                        status: "AVAILABLE",
                        isAvailable: true,
                        occupiedFrom: null,
                    },
                });
                if (result.count > 0) {
                    this.logger.log(`Successfully refreshed ${result.count} expired room occupancies`);
                }
                else {
                    this.logger.log("No expired occupancies found");
                }
                const processedTransfers = await this.processDueRoomTransfers(new Date());
                if (processedTransfers > 0) {
                    this.logger.log(`Applied ${processedTransfers} scheduled room transfer(s)`);
                }
                return;
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                this.logger.warn(`Occupancy refresh attempt ${attempt}/${maxRetries} failed: ${errorMessage}`);
                const isConnectionError = errorMessage.includes("P1001") ||
                    errorMessage.includes("connection") ||
                    errorMessage.includes("timeout");
                if (!isConnectionError || attempt === maxRetries) {
                    if (!isConnectionError) {
                        this.logger.error("Occupancy refresh failed after all retries", error);
                    }
                    return;
                }
                await new Promise((resolve) => setTimeout(resolve, retryDelay));
            }
        }
    }
    async triggerOccupancyRefresh() {
        return this.refreshExpiredOccupancies();
    }
    async findAll() {
        try {
            const rooms = await this.prisma.room.findMany({
                where: { deletedAt: null },
                select: this.roomListSelect,
            });
            const normalizedRooms = await this.applyOccupancyStateFromBookings(rooms);
            const rulesMap = await this.getRulesByRoomIds(normalizedRooms.map((room) => room.id));
            return normalizedRooms.map((room) => ({
                ...room,
                rules: rulesMap.get(room.id) ?? [],
            }));
        }
        catch (error) {
            this.logger.error("Error fetching rooms:", error);
            return [];
        }
    }
    async findOne(id) {
        const room = await this.prisma.room.findUnique({
            where: { id },
            select: this.roomDetailSelect,
        });
        if (!room) {
            throw new common_1.NotFoundException("Room not found");
        }
        const [normalizedRoom] = await this.applyOccupancyStateFromBookings([room]);
        const rulesMap = await this.getRulesByRoomIds([normalizedRoom.id]);
        return {
            ...normalizedRoom,
            rules: rulesMap.get(normalizedRoom.id) ?? [],
        };
    }
    async create(createRoomDto) {
        console.log("[ROOMS SERVICE CREATE] Received type:", createRoomDto.type);
        console.log("[ROOMS SERVICE CREATE] Full DTO:", JSON.stringify(createRoomDto));
        const payload = { ...createRoomDto };
        delete payload.existingMedia;
        const { amenities, rules, status: _status, media, images, videoUrl, ...roomData } = payload;
        const normalizedType = this.normalizeRoomType(roomData.type);
        const data = {
            ...roomData,
            type: normalizedType,
            status: "AVAILABLE",
            isAvailable: true,
            amenities: this.buildAmenityCreateInput(amenities),
        };
        if (media && media.length) {
            const mediaImageRows = this.mapMediaToImageRows(media);
            if (mediaImageRows.length) {
                data.images = { create: mediaImageRows };
            }
            data.videoUrl = this.getPrimaryVideoUrl(media) || null;
        }
        else {
            const imageRows = [
                ...(images?.map((img) => ({
                    url: img.url || "",
                    order: img.order || 0,
                    caption: img.caption || undefined,
                })) ?? []),
                ...(videoUrl
                    ? [
                        {
                            url: videoUrl,
                            order: 999,
                            caption: "ROOM_VIDEO",
                        },
                    ]
                    : []),
            ];
            if (imageRows.length) {
                data.images = { create: imageRows };
            }
            if (videoUrl) {
                data.videoUrl = videoUrl;
            }
        }
        try {
            const room = await this.prisma.room.create({ data });
            const mediaRows = this.normalizeMediaInput(media, images, videoUrl);
            if (mediaRows.length) {
                await this.prisma.roomMedia.createMany({
                    data: mediaRows.map((item) => ({
                        roomId: room.id,
                        type: item.type,
                        url: item.url,
                    })),
                });
            }
            try {
                await this.setRules(room.id, rules ?? []);
            }
            catch (ruleError) {
                console.error("Error setting room rules:", ruleError);
            }
            return this.findOne(room.id);
        }
        catch (error) {
            console.error("Error creating room:", error);
            throw error;
        }
    }
    async update(id, updateRoomDto) {
        this.logger.log(`[RoomsService.update] Incoming payload for room ${id}: ${JSON.stringify(updateRoomDto)}`);
        try {
            const payload = { ...updateRoomDto };
            delete payload.existingMedia;
            const { amenities, rules, status, isAvailable, occupiedUntil, media, tenantName, tenantPhone, bookingSource, brokerName, images, videoUrl, ...roomData } = payload;
            const normalizedStatus = status === undefined ? undefined : String(status).trim();
            if (normalizedStatus !== undefined) {
                const allowedStatuses = Object.values(client_1.RoomStatus);
                if (!allowedStatuses.includes(normalizedStatus)) {
                    throw new common_1.BadRequestException(`Invalid room status "${status}". Allowed values: ${allowedStatuses.join(", ")}`);
                }
                roomData.status = normalizedStatus;
            }
            if (isAvailable !== undefined) {
                if (typeof isAvailable !== "boolean") {
                    throw new common_1.BadRequestException("isAvailable must be a boolean");
                }
                roomData.isAvailable = isAvailable;
            }
            let parsedOccupiedUntil = undefined;
            if (occupiedUntil !== undefined) {
                if (occupiedUntil === null || String(occupiedUntil).trim() === "") {
                    parsedOccupiedUntil = null;
                }
                else {
                    const rawOccupiedUntil = String(occupiedUntil).trim();
                    const candidate = new Date(rawOccupiedUntil);
                    if (Number.isNaN(candidate.getTime())) {
                        throw new common_1.BadRequestException("occupiedUntil must be a valid ISO date string");
                    }
                    parsedOccupiedUntil = /^\d{4}-\d{2}-\d{2}$/.test(rawOccupiedUntil)
                        ? this.toEndOfUtcDay(candidate)
                        : candidate;
                }
                roomData.occupiedUntil = parsedOccupiedUntil;
            }
            if (occupiedUntil !== undefined &&
                normalizedStatus === undefined &&
                isAvailable === undefined) {
                const derivedOccupancy = this.deriveRoomOccupancyState(parsedOccupiedUntil);
                roomData.status = derivedOccupancy.status;
                roomData.isAvailable = derivedOccupancy.isAvailable;
            }
            const isMarkingOccupied = normalizedStatus === client_1.RoomStatus.OCCUPIED;
            this.logger.log(`[RoomsService.update] isMarkingOccupied=${isMarkingOccupied} for room ${id}`);
            if (isMarkingOccupied) {
                const normalizedTenantName = typeof tenantName === "string" ? tenantName.trim() : "";
                const normalizedTenantPhone = typeof tenantPhone === "string" ? tenantPhone.trim() : "";
                const incomingBookingSource = typeof bookingSource === "string" ? bookingSource.trim() : "";
                const normalizedBrokerName = typeof brokerName === "string" ? brokerName.trim() : "";
                const validationErrors = [];
                if (tenantName === undefined || !normalizedTenantName) {
                    validationErrors.push("tenantName is required when marking room occupied");
                }
                if (tenantPhone === undefined || !normalizedTenantPhone) {
                    validationErrors.push("tenantPhone is required when marking room occupied");
                }
                if (bookingSource === undefined || !incomingBookingSource) {
                    validationErrors.push("bookingSource is required when marking room occupied");
                }
                if (occupiedUntil === undefined ||
                    parsedOccupiedUntil === null ||
                    !parsedOccupiedUntil) {
                    validationErrors.push("occupiedUntil is required when marking room occupied");
                }
                if (incomingBookingSource &&
                    incomingBookingSource !== client_1.BookingSource.WALK_IN &&
                    incomingBookingSource !== client_1.BookingSource.BROKER) {
                    validationErrors.push(`bookingSource must be one of: ${Object.values(client_1.BookingSource).join(", ")}`);
                }
                if (incomingBookingSource === client_1.BookingSource.BROKER &&
                    !normalizedBrokerName) {
                    validationErrors.push("brokerName is required when bookingSource is BROKER");
                }
                if (validationErrors.length > 0) {
                    throw new common_1.BadRequestException(validationErrors.join("; "));
                }
                const room = await this.prisma.room.findUnique({
                    where: { id },
                    select: { id: true, name: true },
                });
                if (!room) {
                    throw new common_1.NotFoundException(`Room with ID ${id} not found`);
                }
                this.logger.log(`[RoomsService.update][occupy:${id}] Step 1 - validating roomId`);
                if (!id || !id.trim()) {
                    throw new common_1.BadRequestException("roomId is invalid");
                }
                this.logger.log(`[RoomsService.update][occupy:${id}] Step 2 - upsert user by phone ${normalizedTenantPhone}`);
                console.log("START TRANSACTION");
                console.log("STEP 1: user");
                const user = await this.prisma.user.upsert({
                    where: { phone: normalizedTenantPhone },
                    update: {
                        firstName: normalizedTenantName,
                    },
                    create: {
                        phone: normalizedTenantPhone,
                        firstName: normalizedTenantName,
                        lastName: "",
                        password: "",
                        role: "TENANT",
                        isActive: true,
                        isApproved: true,
                        accountStatus: "ACTIVE",
                    },
                });
                if (!user?.id) {
                    throw new common_1.BadRequestException("Failed to resolve valid tenant user");
                }
                this.logger.log(`[RoomsService.update][occupy:${id}] Step 3 - checking active booking duplication`);
                const existingBooking = await this.prisma.booking.findFirst({
                    where: {
                        roomId: id,
                        deletedAt: null,
                        status: {
                            in: [
                                client_1.BookingStatus.APPROVED,
                                client_1.BookingStatus.APPROVED_PENDING_PAYMENT,
                            ],
                        },
                    },
                    select: {
                        id: true,
                        userId: true,
                        roomId: true,
                        status: true,
                    },
                });
                if (existingBooking) {
                    throw new common_1.BadRequestException("Room already occupied");
                }
                const moveInDate = this.toStartOfUtcDay(new Date());
                const moveOutDate = parsedOccupiedUntil;
                const validatedBookingSource = incomingBookingSource;
                this.logger.log(`[RoomsService.update][occupy:${id}] Step 4 - creating booking + updating room in atomic transaction`);
                const rentAmount = Number(room.rent ?? 0);
                console.log("STEP 2: booking");
                console.log("STEP 3: room update");
                const [booking] = await this.prisma.$transaction([
                    this.prisma.booking.create({
                        data: {
                            userId: user.id,
                            roomId: id,
                            status: client_1.BookingStatus.APPROVED,
                            startDate: moveInDate,
                            endDate: moveOutDate,
                            moveInDate,
                            moveOutDate,
                            bookingSource: validatedBookingSource,
                            brokerName: validatedBookingSource === client_1.BookingSource.BROKER
                                ? normalizedBrokerName
                                : null,
                            rentAmount: new library_1.Decimal(rentAmount),
                        },
                        select: {
                            id: true,
                            userId: true,
                            roomId: true,
                            status: true,
                            moveInDate: true,
                            moveOutDate: true,
                            bookingSource: true,
                            brokerName: true,
                        },
                    }),
                    this.prisma.room.update({
                        where: { id },
                        data: {
                            status: client_1.RoomStatus.OCCUPIED,
                            isAvailable: false,
                            occupiedFrom: moveInDate,
                            occupiedUntil: moveOutDate,
                        },
                    }),
                ]);
                if (!booking.userId || !booking.roomId) {
                    throw new common_1.BadRequestException("Booking creation returned invalid booking.userId or booking.roomId");
                }
                this.logger.log(`[RoomsService.update][occupy:${id}] Step 5 - fetching updated room`);
                const updatedRoom = await this.prisma.room.findUnique({
                    where: { id },
                    include: {
                        amenities: { include: { amenity: true } },
                        images: true,
                        media: true,
                    },
                });
                return {
                    ...updatedRoom,
                    booking,
                    user,
                    message: "Room marked as occupied successfully",
                };
            }
            if (amenities !== undefined) {
                await this.prisma.roomAmenity.deleteMany({ where: { roomId: id } });
            }
            const data = {
                ...roomData,
                amenities: this.buildAmenityCreateInput(amenities),
            };
            if (roomData.type !== undefined) {
                data.type = this.normalizeRoomType(roomData.type);
            }
            if (media) {
                await this.prisma.roomImage.deleteMany({ where: { roomId: id } });
                const mediaImageRows = this.mapMediaToImageRows(media);
                data.videoUrl = this.getPrimaryVideoUrl(media) || null;
                if (mediaImageRows.length) {
                    data.images = { create: mediaImageRows };
                }
            }
            else {
                if (images) {
                    await this.prisma.roomImage.deleteMany({ where: { roomId: id } });
                }
                const imageRows = [
                    ...(images?.map((img) => ({
                        url: img.url || "",
                        order: img.order || 0,
                        caption: img.caption || undefined,
                    })) ?? []),
                    ...(videoUrl
                        ? [
                            {
                                url: videoUrl,
                                order: 999,
                                caption: "ROOM_VIDEO",
                            },
                        ]
                        : []),
                ];
                if (imageRows.length) {
                    data.images = { create: imageRows };
                }
                if (videoUrl) {
                    data.videoUrl = videoUrl;
                }
            }
            await this.prisma.room.update({ where: { id }, data });
            if (media || images || videoUrl !== undefined) {
                const mediaRows = this.normalizeMediaInput(media, images, videoUrl);
                await this.prisma.roomMedia.deleteMany({ where: { roomId: id } });
                if (mediaRows.length) {
                    await this.prisma.roomMedia.createMany({
                        data: mediaRows.map((item) => ({
                            roomId: id,
                            type: item.type,
                            url: item.url,
                        })),
                    });
                }
            }
            if (rules) {
                await this.setRules(id, rules);
            }
            return this.findOne(id);
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
                this.logger.error(`[RoomsService.update] Prisma known error code=${error.code} for room ${id}: ${error.message}`, error.stack);
            }
            else if (error instanceof client_1.Prisma.PrismaClientValidationError) {
                this.logger.error(`[RoomsService.update] Prisma validation error for room ${id}: ${error.message}`, error.stack);
            }
            else if (error instanceof Error) {
                this.logger.error(`[RoomsService.update] Failed for room ${id}: ${error.message}`, error.stack);
            }
            else {
                this.logger.error(`[RoomsService.update] Failed for room ${id} with non-error payload: ${JSON.stringify(error)}`);
            }
            throw error;
        }
    }
    async remove(id) {
        try {
            const existingRoom = await this.prisma.room.findUnique({
                where: { id },
            });
            if (!existingRoom) {
                throw new common_1.NotFoundException(`Room with ID ${id} not found`);
            }
            if (existingRoom.deletedAt) {
                throw new common_1.BadRequestException("Room is already deleted");
            }
            return await this.prisma.room.update({
                where: { id },
                data: {
                    deletedAt: new Date(),
                    isAvailable: false,
                },
            });
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException ||
                error instanceof common_1.BadRequestException) {
                throw error;
            }
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`Failed to delete room ${id}: ${errorMessage}`);
            throw new common_1.BadRequestException("Failed to delete room");
        }
    }
    async delete(id) {
        const bookings = await this.prisma.booking.findMany({
            where: { roomId: id },
        });
        if (bookings && bookings.length > 0) {
            return this.prisma.room.update({
                where: { id },
                data: {
                    deletedAt: new Date(),
                    isAvailable: false,
                },
            });
        }
        return this.prisma.room.delete({
            where: { id },
        });
    }
    async getAvailableRooms(selectedMonth) {
        const selectedMonthStart = this.parseSelectedMonthStart(selectedMonth);
        const selectedMonthEndExclusive = selectedMonthStart
            ? new Date(Date.UTC(selectedMonthStart.getUTCFullYear(), selectedMonthStart.getUTCMonth() + 1, 1))
            : null;
        const rooms = await this.prisma.room.findMany({
            where: {
                deletedAt: null,
            },
            select: this.roomListSelect,
        });
        const normalizedRooms = await this.applyOccupancyStateFromBookings(rooms);
        const rulesMap = await this.getRulesByRoomIds(normalizedRooms.map((room) => room.id));
        const now = new Date();
        const mappedRooms = normalizedRooms.map((room) => {
            const effectiveRent = room.rent ?? room.managementRent;
            const effectiveStatus = room.status ?? room.managementStatus;
            const effectiveIsAvailable = room.isAvailable ?? room.managementIsAvailable;
            const effectiveOccupiedUntil = room.occupiedUntil ?? room.managementOccupiedUntil;
            let availabilityStatus = String(effectiveStatus || "AVAILABLE").toUpperCase();
            let availableFrom = null;
            const occupiedUntilDate = effectiveOccupiedUntil
                ? new Date(effectiveOccupiedUntil)
                : null;
            const occupiedThroughDate = occupiedUntilDate && !Number.isNaN(occupiedUntilDate.getTime())
                ? this.toEndOfUtcDay(occupiedUntilDate)
                : null;
            if (occupiedThroughDate &&
                occupiedThroughDate > now) {
                availabilityStatus = "OCCUPIED";
                availableFrom = this.toNextUtcDayStart(occupiedThroughDate).toISOString();
            }
            return {
                ...room,
                rent: effectiveRent,
                status: effectiveStatus,
                isAvailable: effectiveIsAvailable,
                occupiedUntil: effectiveOccupiedUntil,
                availabilityStatus,
                availableFrom,
                availableBy: occupiedThroughDate && occupiedThroughDate > now
                    ? this.toNextUtcDayStart(occupiedThroughDate).toISOString()
                    : now.toISOString(),
                rules: rulesMap.get(room.id) ?? [],
            };
        });
        if (!selectedMonthEndExclusive) {
            return mappedRooms.map(({ availableBy: _availableBy, ...room }) => room);
        }
        return mappedRooms
            .filter((room) => {
            const availableByDate = new Date(room.availableBy);
            if (Number.isNaN(availableByDate.getTime()))
                return false;
            return availableByDate < selectedMonthEndExclusive;
        })
            .map(({ availableBy: _availableBy, ...room }) => room);
    }
    async findOccupiedRooms() {
        const rooms = await this.prisma.room.findMany({
            where: {
                deletedAt: null,
                status: "OCCUPIED",
            },
            orderBy: {
                createdAt: "desc",
            },
            select: this.roomListSelect,
        });
        const rulesMap = await this.getRulesByRoomIds(rooms.map((room) => room.id));
        return rooms.map((room) => ({
            ...room,
            rules: rulesMap.get(room.id) ?? [],
        }));
    }
};
exports.RoomsService = RoomsService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_5_MINUTES),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RoomsService.prototype, "refreshExpiredOccupancies", null);
exports.RoomsService = RoomsService = RoomsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RoomsService);
//# sourceMappingURL=rooms.service.js.map