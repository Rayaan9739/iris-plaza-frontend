import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import {
  BookingSource,
  BookingStatus,
  Prisma,
  RoomStatus,
} from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { PrismaService } from "@/prisma/prisma.service";
import { CreateRoomDto, UpdateRoomDto } from "./dto/room.dto";
import { RoomType } from "./enums/room-type.enum";

type RuleRow = { room_id: string; rule: string };
type RoomTransferRow = {
  id: bigint;
  booking_id: string;
  user_id: string;
  from_room_id: string;
  to_room_id: string;
  effective_date: Date;
  desired_move_out_date: Date | null;
  status: string;
};

const LEGACY_ROOM_TYPE_MAP: Record<string, RoomType> = {
  STUDIO: RoomType.ONE_BHK,
  SINGLE: RoomType.ONE_BHK,
  DOUBLE: RoomType.ONE_BHK,
  THREE_BHK: RoomType.TWO_BHK,
  SUITE: RoomType.PENTHOUSE,
  PENT_HOUSE: RoomType.PENTHOUSE,
};

@Injectable()
export class RoomsService {
  private readonly logger = new Logger(RoomsService.name);
  constructor(private prisma: PrismaService) {}

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
    const occupiedThrough = this.toEndOfUtcDay(parsedOccupiedUntil);
    if (
      Number.isNaN(parsedOccupiedUntil.getTime()) ||
      occupiedThrough <= new Date()
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

  private async applyOccupancyStateFromBookings<
    TRoom extends {
      id: string;
      status: string;
      isAvailable: boolean;
      occupiedUntil: Date | string | null;
    },
  >(rooms: TRoom[]): Promise<TRoom[]> {
    if (!rooms.length) {
      return rooms;
    }

    return rooms.map((room) => {
      const derivedOccupancy = this.deriveRoomOccupancyState(
        room.occupiedUntil,
        room.status,
      );

      return {
        ...room,
        status: derivedOccupancy.status,
        isAvailable: derivedOccupancy.isAvailable,
      };
    });
  }

  private normalizeRoomType(input: unknown): RoomType {
    const raw = String(input ?? "").trim();
    const normalized = raw.replace(/\s+/g, "_").toUpperCase();
    const mapped = LEGACY_ROOM_TYPE_MAP[normalized] ?? normalized;

    if (
      mapped === RoomType.ONE_BHK ||
      mapped === RoomType.TWO_BHK ||
      mapped === RoomType.PENTHOUSE
    ) {
      return mapped;
    }

    throw new BadRequestException(
      "Room type must be ONE_BHK, TWO_BHK, or PENTHOUSE",
    );
  }

  private parseSelectedMonthStart(month?: string) {
    if (!month) {
      return null;
    }

    const normalized = String(month).trim();
    const match = normalized.match(/^(\d{4})-(\d{2})$/);
    if (!match) {
      throw new BadRequestException("month must be in YYYY-MM format");
    }

    const year = Number(match[1]);
    const monthIndex = Number(match[2]) - 1;
    if (
      !Number.isFinite(year) ||
      !Number.isFinite(monthIndex) ||
      monthIndex < 0 ||
      monthIndex > 11
    ) {
      throw new BadRequestException("month must be in YYYY-MM format");
    }

    return new Date(Date.UTC(year, monthIndex, 1));
  }

  private roomListSelect = {
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
    // Management fields for listing page
    managementRent: true,
    managementStatus: true,
    managementIsAvailable: true,
    managementOccupiedUntil: true,
    // Only fetch the first media/image for the thumbnail preview to reduce payload
    media: { orderBy: { createdAt: "asc" as const }, take: 1 },
    images: { orderBy: { order: "asc" as const }, take: 1 },
    amenities: { include: { amenity: true } },
  };

  private roomDetailSelect = {
    id: true,
    name: true,
    type: true,
    description: true, // Included only in detail view
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
    // Fetch all media and images for the detail carousel
    media: { orderBy: { createdAt: "asc" as const } },
    images: { orderBy: { order: "asc" as const } },
    amenities: { include: { amenity: true } },
  };

  private mapMediaToImageRows(media?: Array<{ type?: string; url?: string }>) {
    if (!media?.length) {
      return [];
    }

    return media
      .map((item, index) => {
        const url = String(item?.url || "").trim();
        if (!url) return null;
        const isVideo = String(item?.type || "").toLowerCase() === "video";

        return {
          url,
          order: index,
          caption: isVideo ? "ROOM_VIDEO" : undefined,
        };
      })
      .filter(Boolean) as Array<{
      url: string;
      order: number;
      caption?: string;
    }>;
  }

  private getPrimaryVideoUrl(media?: Array<{ type?: string; url?: string }>) {
    if (!media?.length) {
      return undefined;
    }

    const firstVideo = media.find(
      (item) =>
        String(item?.type || "").toLowerCase() === "video" &&
        String(item?.url || "").trim().length > 0,
    );

    return firstVideo ? String(firstVideo.url).trim() : undefined;
  }

  private normalizeMediaInput(
    media?: Array<{ type?: string; url?: string }>,
    images?: Array<{ url?: string }>,
    videoUrl?: string,
  ) {
    if (media?.length) {
      return media
        .map((item) => ({
          type:
            String(item?.type || "").toLowerCase() === "video"
              ? "video"
              : "image",
          url: String(item?.url || "").trim(),
        }))
        .filter((item) => item.url.length > 0);
    }

    const fromImages =
      images
        ?.map((img) => String(img?.url || "").trim())
        .filter(Boolean)
        .map((url) => ({ type: "image", url })) ?? [];

    const fromVideo = String(videoUrl || "").trim();
    if (fromVideo) {
      fromImages.push({ type: "video", url: fromVideo });
    }

    return fromImages;
  }

  private buildAmenityCreateInput(amenities?: string[]) {
    if (!amenities?.length) {
      return undefined;
    }

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

  private async ensureRoomRulesTable() {
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
    } catch (error) {
      console.error("Error ensuring room_rules table:", error);
      throw new Error(
        `Failed to create room_rules table: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async setRules(roomId: string, rules: string[]) {
    try {
      await this.ensureRoomRulesTable();

      await this.prisma.$executeRaw`
        DELETE FROM room_rules WHERE room_id = ${roomId}
      `;

      for (const rule of rules) {
        const trimmed = String(rule || "").trim();
        if (!trimmed) continue;

        await this.prisma.$executeRaw`
          INSERT INTO room_rules(room_id, rule)
          VALUES (${roomId}, ${trimmed})
        `;
      }
    } catch (error) {
      console.error("Error setting room rules for room", roomId, ":", error);
      // Rules are optional metadata; do not fail room create/update flows.
      return;
    }
  }

  private async getRulesByRoomIds(roomIds: string[]) {
    const map = new Map<string, string[]>();

    roomIds.forEach((id) => map.set(id, []));

    if (!roomIds.length) {
      return map;
    }

    try {
      await this.ensureRoomRulesTable();

      const rows = await this.prisma.$queryRaw<RuleRow[]>(
        Prisma.sql`SELECT room_id, rule FROM room_rules WHERE room_id IN (${Prisma.join(roomIds)})`,
      );

      rows.forEach((row) => {
        const list = map.get(row.room_id) ?? [];
        list.push(row.rule);
        map.set(row.room_id, list);
      });
    } catch (error) {
      console.error("Error reading room rules:", error);
      return map;
    }

    return map;
  }

  private async ensureRoomTransfersTable() {
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

  private async processDueRoomTransfers(now: Date) {
    await this.ensureRoomTransfersTable();

    const dueTransfers = await this.prisma.$queryRaw<RoomTransferRow[]>`
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
          await this.prisma.$executeRaw`
            UPDATE room_transfers
            SET status = 'FAILED', updated_at = NOW()
            WHERE id = ${transfer.id}
          `;
          continue;
        }

        const finalMoveOutDate =
          transfer.desired_move_out_date ??
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

        await this.prisma.$executeRaw`
          UPDATE room_transfers
          SET status = 'COMPLETED', updated_at = NOW()
          WHERE id = ${transfer.id}
        `;

        processed += 1;
      } catch (error) {
        this.logger.error(
          `Failed processing room transfer ${transfer.id.toString()}: ${
            error instanceof Error ? error.message : String(error)
          }`,
          error instanceof Error ? error.stack : undefined,
        );
      }
    }

    return processed;
  }

  /**
   * Background job that runs periodically to refresh expired room occupancies.
   * This runs as a scheduled task instead of during GET requests.
   * Runs every 5 minutes.
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async refreshExpiredOccupancies() {
    this.logger.log("Starting scheduled occupancy refresh...");
    const now = new Date();

    const maxRetries = 3;
    const retryDelay = 5000; // 5 seconds

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.prisma.room.updateMany({
          where: {
            status: "OCCUPIED" as any,
            occupiedUntil: { lt: now },
          },
          data: {
            status: "AVAILABLE" as any,
            isAvailable: true,
            occupiedFrom: null,
          },
        });

        if (result.count > 0) {
          this.logger.log(
            `Successfully refreshed ${result.count} expired room occupancies`,
          );
        } else {
          this.logger.log("No expired occupancies found");
        }

        const processedTransfers = await this.processDueRoomTransfers(
          new Date(),
        );
        if (processedTransfers > 0) {
          this.logger.log(
            `Applied ${processedTransfers} scheduled room transfer(s)`,
          );
        }
        return; // Success - exit the retry loop
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        this.logger.warn(
          `Occupancy refresh attempt ${attempt}/${maxRetries} failed: ${errorMessage}`,
        );

        // Check if it's a connection error (P1001 is Prisma's connection error code)
        const isConnectionError =
          errorMessage.includes("P1001") ||
          errorMessage.includes("connection") ||
          errorMessage.includes("timeout");

        if (!isConnectionError || attempt === maxRetries) {
          // Non-connection error or max retries reached
          // Only log if it's not a connection error
          if (!isConnectionError) {
            this.logger.error(
              "Occupancy refresh failed after all retries",
              error,
            );
          }
          return;
        }

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }
  }

  /**
   * Manually trigger occupancy refresh (for administrative use).
   * Uses the same error handling as the scheduled job.
   */
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

      const rulesMap = await this.getRulesByRoomIds(
        normalizedRooms.map((room) => room.id),
      );

      return normalizedRooms.map((room) => ({
        ...room,
        rules: rulesMap.get(room.id) ?? [],
      }));
    } catch (error) {
      this.logger.error("Error fetching rooms:", error);
      return [];
    }
  }

  async findOne(id: string) {
    const room = await this.prisma.room.findUnique({
      where: { id },
      select: this.roomDetailSelect,
    });

    if (!room) {
      throw new NotFoundException("Room not found");
    }
    const [normalizedRoom] = await this.applyOccupancyStateFromBookings([room]);

    const rulesMap = await this.getRulesByRoomIds([normalizedRoom.id]);

    return {
      ...normalizedRoom,
      rules: rulesMap.get(normalizedRoom.id) ?? [],
    };
  }

  async create(createRoomDto: CreateRoomDto) {
    console.log("[ROOMS SERVICE CREATE] Received type:", createRoomDto.type);
    console.log(
      "[ROOMS SERVICE CREATE] Full DTO:",
      JSON.stringify(createRoomDto),
    );

    const payload: any = { ...(createRoomDto as any) };
    delete payload.existingMedia;

    const {
      amenities,
      rules,
      status: _status,
      media,
      // legacy fields (ignored if media provided)
      images,
      videoUrl,
      ...roomData
    } = payload;
    const normalizedType = this.normalizeRoomType(roomData.type);

    const data: any = {
      ...roomData,
      type: normalizedType as any,
      status: "AVAILABLE" as any,
      isAvailable: true,
      amenities: this.buildAmenityCreateInput(amenities),
    };

    if (media && media.length) {
      const mediaImageRows = this.mapMediaToImageRows(media);
      if (mediaImageRows.length) {
        data.images = { create: mediaImageRows };
      }
      data.videoUrl = this.getPrimaryVideoUrl(media) || null;
    } else {
      // fallback to legacy image/video fields
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
      } catch (ruleError) {
        console.error("Error setting room rules:", ruleError);
        // Don't fail room creation if rules fail, log the error
      }
      return this.findOne(room.id);
    } catch (error) {
      console.error("Error creating room:", error);
      throw error;
    }
  }

  async update(id: string, updateRoomDto: UpdateRoomDto) {
    this.logger.log(
      `[RoomsService.update] Incoming payload for room ${id}: ${JSON.stringify(updateRoomDto)}`,
    );

    try {
      const payload: any = { ...(updateRoomDto as any) };
      delete payload.existingMedia;

      const {
        amenities,
        rules,
        status,
        isAvailable,
        occupiedUntil,
        media,
        // tenant info for Mark Occupied
        tenantName,
        tenantPhone,
        bookingSource,
        brokerName,
        // legacy
        images,
        videoUrl,
        ...roomData
      } = payload;

      const normalizedStatus =
        status === undefined ? undefined : String(status).trim();
      if (normalizedStatus !== undefined) {
        const allowedStatuses = Object.values(RoomStatus);
        if (!allowedStatuses.includes(normalizedStatus as RoomStatus)) {
          throw new BadRequestException(
            `Invalid room status "${status}". Allowed values: ${allowedStatuses.join(", ")}`,
          );
        }
        roomData.status = normalizedStatus as RoomStatus;
      }

      if (isAvailable !== undefined) {
        if (typeof isAvailable !== "boolean") {
          throw new BadRequestException("isAvailable must be a boolean");
        }
        roomData.isAvailable = isAvailable;
      }

      let parsedOccupiedUntil: Date | null | undefined = undefined;
      if (occupiedUntil !== undefined) {
        if (occupiedUntil === null || String(occupiedUntil).trim() === "") {
          parsedOccupiedUntil = null;
        } else {
          const rawOccupiedUntil = String(occupiedUntil).trim();
          const candidate = new Date(rawOccupiedUntil);
          if (Number.isNaN(candidate.getTime())) {
            throw new BadRequestException(
              "occupiedUntil must be a valid ISO date string",
            );
          }
          parsedOccupiedUntil = /^\d{4}-\d{2}-\d{2}$/.test(rawOccupiedUntil)
            ? this.toEndOfUtcDay(candidate)
            : candidate;
        }
        roomData.occupiedUntil = parsedOccupiedUntil;
      }

      if (
        occupiedUntil !== undefined &&
        normalizedStatus === undefined &&
        isAvailable === undefined
      ) {
        const derivedOccupancy =
          this.deriveRoomOccupancyState(parsedOccupiedUntil);
        roomData.status = derivedOccupancy.status;
        roomData.isAvailable = derivedOccupancy.isAvailable;
      }

      const isMarkingOccupied = normalizedStatus === RoomStatus.OCCUPIED;
      this.logger.log(
        `[RoomsService.update] isMarkingOccupied=${isMarkingOccupied} for room ${id}`,
      );

      if (isMarkingOccupied) {
        const normalizedTenantName =
          typeof tenantName === "string" ? tenantName.trim() : "";
        const normalizedTenantPhone =
          typeof tenantPhone === "string" ? tenantPhone.trim() : "";
        const incomingBookingSource =
          typeof bookingSource === "string" ? bookingSource.trim() : "";
        const normalizedBrokerName =
          typeof brokerName === "string" ? brokerName.trim() : "";

        const validationErrors: string[] = [];
        if (tenantName === undefined || !normalizedTenantName) {
          validationErrors.push(
            "tenantName is required when marking room occupied",
          );
        }
        if (tenantPhone === undefined || !normalizedTenantPhone) {
          validationErrors.push(
            "tenantPhone is required when marking room occupied",
          );
        }
        if (bookingSource === undefined || !incomingBookingSource) {
          validationErrors.push(
            "bookingSource is required when marking room occupied",
          );
        }
        if (
          occupiedUntil === undefined ||
          parsedOccupiedUntil === null ||
          !parsedOccupiedUntil
        ) {
          validationErrors.push(
            "occupiedUntil is required when marking room occupied",
          );
        }
        if (
          incomingBookingSource &&
          incomingBookingSource !== BookingSource.WALK_IN &&
          incomingBookingSource !== BookingSource.BROKER
        ) {
          validationErrors.push(
            `bookingSource must be one of: ${Object.values(BookingSource).join(", ")}`,
          );
        }
        if (
          incomingBookingSource === BookingSource.BROKER &&
          !normalizedBrokerName
        ) {
          validationErrors.push(
            "brokerName is required when bookingSource is BROKER",
          );
        }

        if (validationErrors.length > 0) {
          throw new BadRequestException(validationErrors.join("; "));
        }

        const room = await this.prisma.room.findUnique({
          where: { id },
          select: { id: true, name: true },
        });
        if (!room) {
          throw new NotFoundException(`Room with ID ${id} not found`);
        }

        this.logger.log(
          `[RoomsService.update][occupy:${id}] Step 1 - validating roomId`,
        );
        if (!id || !id.trim()) {
          throw new BadRequestException("roomId is invalid");
        }

        this.logger.log(
          `[RoomsService.update][occupy:${id}] Step 2 - upsert user by phone ${normalizedTenantPhone}`,
        );
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
          throw new BadRequestException("Failed to resolve valid tenant user");
        }

        this.logger.log(
          `[RoomsService.update][occupy:${id}] Step 3 - checking active booking duplication`,
        );
        const existingBooking = await this.prisma.booking.findFirst({
          where: {
            roomId: id,
            deletedAt: null,
            status: {
              in: [
                BookingStatus.APPROVED,
                BookingStatus.APPROVED_PENDING_PAYMENT,
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
          throw new BadRequestException("Room already occupied");
        }

        const moveInDate = this.toStartOfUtcDay(new Date());
        const moveOutDate = parsedOccupiedUntil as Date;
        const validatedBookingSource = incomingBookingSource as BookingSource;

        this.logger.log(
          `[RoomsService.update][occupy:${id}] Step 4 - creating booking + updating room in atomic transaction`,
        );
        const rentAmount = Number((room as any).rent ?? 0);
        console.log("STEP 2: booking");
        console.log("STEP 3: room update");
        const [booking] = await this.prisma.$transaction([
          this.prisma.booking.create({
            data: {
              userId: user.id,
              roomId: id,
              status: BookingStatus.APPROVED,
              startDate: moveInDate,
              endDate: moveOutDate,
              moveInDate,
              moveOutDate,
              bookingSource: validatedBookingSource,
              brokerName:
                validatedBookingSource === BookingSource.BROKER
                  ? normalizedBrokerName
                  : null,
              rentAmount: new Decimal(rentAmount),
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
              status: RoomStatus.OCCUPIED,
              isAvailable: false,
              occupiedFrom: moveInDate,
              occupiedUntil: moveOutDate,
            },
          }),
        ]);

        if (!booking.userId || !booking.roomId) {
          throw new BadRequestException(
            "Booking creation returned invalid booking.userId or booking.roomId",
          );
        }

        this.logger.log(
          `[RoomsService.update][occupy:${id}] Step 5 - fetching updated room`,
        );
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

      const data: any = {
        ...roomData,
        amenities: this.buildAmenityCreateInput(amenities),
      };

      if (roomData.type !== undefined) {
        data.type = this.normalizeRoomType(roomData.type) as any;
      }

      if (media) {
        await this.prisma.roomImage.deleteMany({ where: { roomId: id } });
        const mediaImageRows = this.mapMediaToImageRows(media);
        data.videoUrl = this.getPrimaryVideoUrl(media) || null;
        if (mediaImageRows.length) {
          data.images = { create: mediaImageRows };
        }
      } else {
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
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        this.logger.error(
          `[RoomsService.update] Prisma known error code=${error.code} for room ${id}: ${error.message}`,
          error.stack,
        );
      } else if (error instanceof Prisma.PrismaClientValidationError) {
        this.logger.error(
          `[RoomsService.update] Prisma validation error for room ${id}: ${error.message}`,
          error.stack,
        );
      } else if (error instanceof Error) {
        this.logger.error(
          `[RoomsService.update] Failed for room ${id}: ${error.message}`,
          error.stack,
        );
      } else {
        this.logger.error(
          `[RoomsService.update] Failed for room ${id} with non-error payload: ${JSON.stringify(error)}`,
        );
      }
      throw error;
    }
  }

  // soft delete from database - preferred method
  async remove(id: string) {
    try {
      const existingRoom = await this.prisma.room.findUnique({
        where: { id },
      });

      if (!existingRoom) {
        throw new NotFoundException(`Room with ID ${id} not found`);
      }

      if (existingRoom.deletedAt) {
        throw new BadRequestException("Room is already deleted");
      }

      return await this.prisma.room.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          isAvailable: false,
        },
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to delete room ${id}: ${errorMessage}`);
      throw new BadRequestException("Failed to delete room");
    }
  }

  // hard delete from database - throws error if room has related records
  async delete(id: string) {
    // Check if room has any bookings
    const bookings = await this.prisma.booking.findMany({
      where: { roomId: id },
    });

    if (bookings && bookings.length > 0) {
      // If bookings exist, use soft delete instead
      return this.prisma.room.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          isAvailable: false,
        },
      });
    }

    // Only do hard delete if no bookings exist
    return this.prisma.room.delete({
      where: { id },
    });
  }

  async getAvailableRooms(selectedMonth?: string) {
    const selectedMonthStart = this.parseSelectedMonthStart(selectedMonth);
    const selectedMonthEndExclusive = selectedMonthStart
      ? new Date(
          Date.UTC(
            selectedMonthStart.getUTCFullYear(),
            selectedMonthStart.getUTCMonth() + 1,
            1,
          ),
        )
      : null;

    // Get ALL rooms (only exclude deleted)
    const rooms = await this.prisma.room.findMany({
      where: {
        deletedAt: null,
      },
      select: this.roomListSelect,
    });
    const normalizedRooms = await this.applyOccupancyStateFromBookings(rooms);

    const rulesMap = await this.getRulesByRoomIds(
      normalizedRooms.map((room) => room.id),
    );

    const now = new Date();
    const mappedRooms = normalizedRooms.map((room) => {
      // Use rent field first (updated by admin), fall back to managementRent
      const effectiveRent = room.rent ?? room.managementRent;
      const effectiveStatus = room.status ?? room.managementStatus;
      const effectiveIsAvailable =
        room.isAvailable ?? room.managementIsAvailable;
      const effectiveOccupiedUntil =
        room.occupiedUntil ?? room.managementOccupiedUntil;

      // Compute availability status based on management fields
      let availabilityStatus:
        | "AVAILABLE"
        | "RESERVED"
        | "OCCUPIED"
        | "MAINTENANCE" = String(
        effectiveStatus || "AVAILABLE",
      ).toUpperCase() as "AVAILABLE" | "RESERVED" | "OCCUPIED" | "MAINTENANCE";
      let availableFrom: string | null = null;

      const occupiedUntilDate = effectiveOccupiedUntil
        ? new Date(effectiveOccupiedUntil)
        : null;
      const occupiedThroughDate =
        occupiedUntilDate && !Number.isNaN(occupiedUntilDate.getTime())
          ? this.toEndOfUtcDay(occupiedUntilDate)
          : null;

      if (
        occupiedThroughDate &&
        occupiedThroughDate > now
      ) {
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
        // A room is considered selectable for a month if it becomes
        // available on/before that month's end.
        availableBy:
          occupiedThroughDate && occupiedThroughDate > now
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
        if (Number.isNaN(availableByDate.getTime())) return false;
        return availableByDate < selectedMonthEndExclusive;
      })
      .map(({ availableBy: _availableBy, ...room }) => room);
  }

  async findOccupiedRooms() {
    const rooms = await this.prisma.room.findMany({
      where: {
        deletedAt: null,
        status: "OCCUPIED" as any,
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
}
