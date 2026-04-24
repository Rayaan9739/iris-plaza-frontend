import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Delete,
  Param,
  Body,
  BadRequestException,
  HttpException,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { validate } from "class-validator";
import { plainToInstance } from "class-transformer";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from "@nestjs/swagger";
import { FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import { AdminService } from "./admin.service";
import { RoomsService } from "@/modules/rooms/rooms.service";
import { BookingsService } from "@/modules/bookings/bookings.service";
import { CreateRoomDto, UpdateRoomDto } from "@/modules/rooms/dto/room.dto";
import { JwtAuthGuard } from "@/modules/auth/guards/jwt-auth.guard";
import { RolesGuard } from "@/common/guards/roles.guard";
import { Roles } from "@/common/decorators/roles.decorator";
import { CloudinaryService } from "@/common/services/cloudinary.service";

@ApiTags("Admin")
@Controller("admin")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN")
@ApiBearerAuth()
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly roomsService: RoomsService,
    private readonly bookingsService: BookingsService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  private async executeAdminAction<T>(
    action: () => Promise<T>,
    fallbackMessage: string,
  ): Promise<T> {
    try {
      return await action();
    } catch (error) {
      // 🔴 Log the FULL error with stack trace for debugging
      console.error("🔥 BACKEND ERROR:", error);
      if (error instanceof HttpException) {
        throw error;
      }
      // Re-throw actual error instead of generic message
      throw error;
    }
  }

  @Get("dashboard")
  @ApiOperation({ summary: "Get dashboard statistics" })
  async getDashboard() {
    return this.executeAdminAction(
      () => this.adminService.getDashboardStats(),
      "Failed to fetch dashboard statistics",
    );
  }

  @Get("stats")
  @ApiOperation({ summary: "Get dashboard statistics (legacy alias)" })
  async getStats() {
    return this.executeAdminAction(
      () => this.adminService.getDashboardStats(),
      "Failed to fetch dashboard statistics",
    );
  }

  @Get("rooms")
  @ApiOperation({ summary: "Get all rooms for admin" })
  async getRooms() {
    return this.executeAdminAction(
      () => this.adminService.getAdminRooms(),
      "Failed to fetch rooms",
    );
  }

  @Get("rooms/:id")
  @ApiOperation({ summary: "Get a room by ID for admin" })
  async getRoom(@Param("id") id: string) {
    return this.executeAdminAction(
      () => this.adminService.getAdminRoom(id),
      "Failed to fetch room",
    );
  }

  @Get("amenities")
  @ApiOperation({ summary: "Get all amenities" })
  async getAmenities() {
    return this.executeAdminAction(
      () => this.adminService.getAmenities(),
      "Failed to fetch amenities",
    );
  }

  @Post("amenities")
  @ApiOperation({ summary: "Create a global amenity" })
  async createAmenity(@Body() body: { name?: string }) {
    return this.executeAdminAction(
      () => this.adminService.createAmenity(String(body?.name || "")),
      "Failed to create amenity",
    );
  }

  @Delete("amenities/:id")
  @ApiOperation({ summary: "Delete a global amenity" })
  async deleteAmenity(@Param("id") id: string) {
    return this.executeAdminAction(
      () => this.adminService.deleteAmenity(id),
      "Failed to delete amenity",
    );
  }

  @Get("bookings")
  @ApiOperation({ summary: "Get all bookings for admin" })
  async getBookings() {
    return this.executeAdminAction(
      () => this.adminService.getAdminBookings(),
      "Failed to fetch bookings",
    );
  }

  @Patch("bookings/:id/approve")
  @ApiOperation({ summary: "Approve a booking (Admin)" })
  async approveBooking(@Param("id") id: string) {
    return this.executeAdminAction(
      () => this.bookingsService.approve(id),
      "Failed to approve booking",
    );
  }

  @Patch("bookings/:id/reject")
  @ApiOperation({ summary: "Reject a booking (Admin)" })
  async rejectBooking(@Param("id") id: string) {
    return this.executeAdminAction(
      () => this.bookingsService.reject(id),
      "Failed to reject booking",
    );
  }

  @Get("tenants")
  @ApiOperation({ summary: "Get all tenants with active bookings" })
  async getTenants() {
    return this.executeAdminAction(
      () => this.adminService.getAllTenants(),
      "Failed to fetch tenants",
    );
  }

  @Get("tenants/:id")
  @ApiOperation({ summary: "Get tenant details by ID" })
  async getTenantById(@Param("id") tenantId: string) {
    return this.executeAdminAction(
      () => this.adminService.getTenantById(tenantId),
      "Failed to fetch tenant details",
    );
  }

  @Delete("tenants/:id")
  @ApiOperation({ summary: "Remove tenant and free room" })
  async removeTenant(@Param("id") userId: string) {
    return this.executeAdminAction(
      () => this.adminService.removeTenant(userId),
      "Failed to remove tenant",
    );
  }

  @Put("tenants/:id")
  @ApiOperation({ summary: "Update tenant details and room assignment" })
  async updateTenant(
    @Param("id") userId: string,
    @Body() body: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      updateRoomId?: string;
      newRoomId?: string;
      roomChangeDate?: string;
      extendOccupiedUntil?: string;
      bookingSource?: string;
      brokerName?: string;
      newRent?: number;
    },
  ) {
    return this.executeAdminAction(
      () => this.adminService.updateTenant(userId, body),
      "Failed to update tenant",
    );
  }

  @Get("payments")
  @ApiOperation({ summary: "Get all payments for admin" })
  async getPayments() {
    return this.executeAdminAction(
      () => this.adminService.getAdminPayments(),
      "Failed to fetch payments",
    );
  }

  @Patch("payments/:id/mark-paid")
  @ApiOperation({ summary: "Mark payment as received" })
  async markPaymentAsReceived(
    @Param("id") id: string,
    @Body() body: { amountReceived?: number; note?: string; paymentMethod?: string },
  ) {
    return this.executeAdminAction(
      () =>
        this.adminService.markPaymentAsPaid(
          id,
          body?.amountReceived,
          body?.note,
          body?.paymentMethod,
        ),
      "Failed to mark payment as received",
    );
  }

  @Get("documents")
  @ApiOperation({ summary: "Get all uploaded tenant documents" })
  async getDocuments() {
    return this.executeAdminAction(
      () => this.adminService.getAdminDocuments(),
      "Failed to fetch documents",
    );
  }

  @Patch("documents/:id/approve")
  @ApiOperation({ summary: "Approve a document" })
  async approveDocument(@Param("id") id: string) {
    return this.executeAdminAction(
      () => this.adminService.approveDocument(id),
      "Failed to approve document",
    );
  }

  @Patch("documents/:id/reject")
  @ApiOperation({ summary: "Reject a document" })
  async rejectDocument(@Param("id") id: string) {
    return this.executeAdminAction(
      () => this.adminService.rejectDocument(id),
      "Failed to reject document",
    );
  }

  @Get("maintenance")
  @ApiOperation({ summary: "Get all maintenance requests" })
  async getMaintenanceRequests() {
    return this.executeAdminAction(
      () => this.adminService.getMaintenanceRequests(),
      "Failed to fetch maintenance requests",
    );
  }

  @Patch("maintenance/:id/approve")
  @ApiOperation({ summary: "Approve maintenance request" })
  async approveMaintenanceRequest(
    @Param("id") id: string,
  ) {
    return this.executeAdminAction(
      () =>
        this.adminService.approveMaintenanceRequest(id),
      "Failed to approve maintenance request",
    );
  }

  @Patch("maintenance/:id/reject")
  @ApiOperation({ summary: "Reject maintenance request" })
  async rejectMaintenanceRequest(@Param("id") id: string) {
    return this.executeAdminAction(
      () => this.adminService.rejectMaintenanceRequest(id),
      "Failed to reject maintenance request",
    );
  }

  @Get("verifications")
  @ApiOperation({
    summary:
      "Get pending verifications (documents, bookings, and tenant registrations)",
  })
  async getPendingVerifications() {
    return this.executeAdminAction(
      () => this.adminService.getPendingVerifications(),
      "Failed to fetch pending verifications",
    );
  }

  @Post("rooms")
  @ApiOperation({ summary: "Create a room listing (Admin only)" })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: false }))
  @UseInterceptors(FilesInterceptor("media"))
  async createRoom(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: Record<string, any>,
    @Request() _req: any,
  ) {
    return this.executeAdminAction(async () => {
      console.log("FILES:", files);
      console.log("BODY:", body);
      console.log("[CREATE ROOM] Raw body keys:", Object.keys(body || {}));
      console.log("[CREATE ROOM] Files received:", files?.length || 0);
      console.log("[CREATE ROOM] body.type value:", body?.type, "- type:", typeof body?.type);
      console.log("[CREATE ROOM] Received room type:", body.type);
      console.log("[CREATE ROOM] Full body:", JSON.stringify(body));

      // Parse body fields that come as strings from FormData
      const parseJsonField = (field: any, defaultValue: any = null): any => {
        if (field === undefined || field === null || field === "") {
          return defaultValue;
        }
        if (typeof field === "object") {
          return field;
        }
        try {
          return JSON.parse(field);
        } catch {
          return defaultValue;
        }
      };

      const media: Array<{ type: string; url: string }> = [];
      const existingMediaParsed = parseJsonField(body.existingMedia, []);
      if (Array.isArray(existingMediaParsed)) {
        media.push(...existingMediaParsed);
      }

      // Upload files to Cloudinary
      if (files && files.length) {
        for (const file of files) {
          try {
            const result = await this.cloudinaryService.uploadImage(file, "iris-plaza/rooms");
            const type = file.mimetype.startsWith("image/")
              ? "image"
              : file.mimetype.startsWith("video/")
                ? "video"
                : "unknown";
            media.push({ type, url: result.secure_url });
          } catch (uploadError) {
            console.error("Cloudinary upload error:", uploadError);
            // Continue with other files even if one fails
          }
        }
      }

      const dto: any = {
        ...body,
        floor: Number(body.floor) || 0,
        area: Number(body.area) || 0,
        rent: Number(body.rent) || 0,
        deposit: Number(body.deposit) || 0,
        media,
      };

      // Parse amenities and rules from JSON strings BEFORE validation
      console.log("[CREATE ROOM] Raw amenities:", body.amenities);
      console.log("[CREATE ROOM] Raw rules:", body.rules);
      if (body.amenities) {
        const parsed = parseJsonField(body.amenities, []);
        if (Array.isArray(parsed)) {
          dto.amenities = parsed;
        }
      }
      if (body.rules) {
        const parsed = parseJsonField(body.rules, []);
        if (Array.isArray(parsed)) {
          dto.rules = parsed;
        }
      }
      console.log("[CREATE ROOM] Parsed amenities:", dto.amenities);
      console.log("[CREATE ROOM] Parsed rules:", dto.rules);

      // Validate the DTO explicitly with transformation
      const dtoInstance = plainToInstance(CreateRoomDto, dto);
      const errors = await validate(dtoInstance);
      if (errors.length > 0) {
        const errorMessages = errors.map(e => 
          Object.values(e.constraints || {}).join(', ')
        ).join('; ');
        console.log("[CREATE ROOM] Validation errors:", errorMessages);
        console.log("[CREATE ROOM] DTO instance type value:", dtoInstance.type);
        throw new BadRequestException(errorMessages);
      }

      return this.roomsService.create(dto as CreateRoomDto);
    }, "Room operation failed");
  }

  @Put("rooms/:id")
  @ApiOperation({ summary: "Update a room listing (Admin only)" })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: false }))
  @UseInterceptors(FilesInterceptor("media"))
  async updateRoom(
    @Param("id") id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: Record<string, any>,
    @Request() _req: any,
  ) {
    return this.executeAdminAction(async () => {
      console.log("FILES:", files);
      console.log("BODY:", body);
      console.log("[UPDATE ROOM] Raw body keys:", Object.keys(body || {}));
      console.log("[UPDATE ROOM] body.type value:", body?.type, "- type:", typeof body?.type);
      console.log("[UPDATE ROOM] Received room type:", body.type);
      console.log("[UPDATE ROOM] Full body:", JSON.stringify(body));

      const bodyData = body || {};

      // Parse body fields that come as strings from FormData
      const parseJsonField = (field: any, defaultValue: any = null): any => {
        if (field === undefined || field === null || field === "") {
          return defaultValue;
        }
        if (typeof field === "object") {
          return field;
        }
        try {
          return JSON.parse(field);
        } catch {
          return defaultValue;
        }
      };

      const media: Array<{ type: string; url: string }> = [];
      const existingMediaParsed = parseJsonField(bodyData.existingMedia, []);
      if (Array.isArray(existingMediaParsed)) {
        media.push(...existingMediaParsed);
      }

      // Upload new files to Cloudinary
      console.log("[UPDATE ROOM] Files received:", files?.length || 0);
      if (files && files.length) {
        console.log("[UPDATE ROOM] First file buffer exists:", !!files[0].buffer);
        console.log("[UPDATE ROOM] First file size:", files[0].size);
        for (const file of files) {
          try {
            const result = await this.cloudinaryService.uploadImage(file, "iris-plaza/rooms");
            const type = file.mimetype.startsWith("image/")
              ? "image"
              : file.mimetype.startsWith("video/")
                ? "video"
                : "unknown";
            media.push({ type, url: result.secure_url });
          } catch (uploadError) {
            console.error("Cloudinary upload error:", uploadError);
            // Continue with other files even if one fails
          }
        }
      }

      const data: any = {};
      if (bodyData.name !== undefined) data.name = bodyData.name;
      if (bodyData.type !== undefined) data.type = bodyData.type;
      if (bodyData.floor !== undefined) data.floor = Number(bodyData.floor);
      if (bodyData.area !== undefined) data.area = Number(bodyData.area);
      if (bodyData.rent !== undefined) data.rent = Number(bodyData.rent);
      if (bodyData.deposit !== undefined)
        data.deposit = Number(bodyData.deposit);
      if (bodyData.description !== undefined)
        data.description = bodyData.description || null;
      if (bodyData.status !== undefined) data.status = bodyData.status;
      if (bodyData.isAvailable !== undefined) data.isAvailable = bodyData.isAvailable === true || bodyData.isAvailable === 'true';
      if (bodyData.occupiedUntil !== undefined) data.occupiedUntil = bodyData.occupiedUntil || null;
      if (bodyData.bookingSource !== undefined) data.bookingSource = bodyData.bookingSource;
      if (bodyData.brokerName !== undefined) data.brokerName = bodyData.brokerName || null;
      // Tenant info for Mark Occupied flow
      if (bodyData.tenantName !== undefined) data.tenantName = bodyData.tenantName;
      if (bodyData.tenantPhone !== undefined) data.tenantPhone = bodyData.tenantPhone;

      if (bodyData.amenities !== undefined) {
        const parsed = parseJsonField(bodyData.amenities, []);
        data.amenities = Array.isArray(parsed) ? parsed : [];
      }

      if (bodyData.rules !== undefined) {
        const parsed = parseJsonField(bodyData.rules, []);
        data.rules = Array.isArray(parsed) ? parsed : [];
      }

      if (bodyData.existingMedia !== undefined || (files && files.length > 0)) {
        data.media = media;
      }

      // Validate the DTO explicitly with transformation
      if (data.type !== undefined) {
        const dtoInstance = plainToInstance(UpdateRoomDto, data);
        const errors = await validate(dtoInstance);
        if (errors.length > 0) {
          const errorMessages = errors.map(e => 
            Object.values(e.constraints || {}).join(', ')
          ).join('; ');
          console.log("[UPDATE ROOM] Validation errors:", errorMessages);
          console.log("[UPDATE ROOM] DTO instance type value:", dtoInstance.type);
          throw new BadRequestException(errorMessages);
        }
      }

      return this.roomsService.update(id, data);
    }, "Room operation failed");
  }

  @Patch("rooms/:id")
  @ApiOperation({ summary: "Patch a room listing (Admin only) - for Mark Occupied flow" })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: false }))
  @UseInterceptors(FilesInterceptor("media"))
  async patchRoom(
    @Param("id") id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: Record<string, any>,
    @Request() _req: any,
  ) {
    // Reuse the same logic as PUT
    return this.executeAdminAction(async () => {
      const bodyData = body || {};

      const parseJsonField = (field: any, defaultValue: any = null): any => {
        if (field === undefined || field === null || field === "") {
          return defaultValue;
        }
        if (typeof field === "object") {
          return field;
        }
        try {
          return JSON.parse(field);
        } catch {
          return defaultValue;
        }
      };

      const media: Array<{ type: string; url: string }> = [];
      const existingMediaParsed = parseJsonField(bodyData.existingMedia, []);
      if (Array.isArray(existingMediaParsed)) {
        media.push(...existingMediaParsed);
      }

      if (files && files.length) {
        for (const file of files) {
          try {
            const result = await this.cloudinaryService.uploadImage(file, "iris-plaza/rooms");
            const type = file.mimetype.startsWith("image/")
              ? "image"
              : file.mimetype.startsWith("video/")
                ? "video"
                : "unknown";
            media.push({ type, url: result.secure_url });
          } catch (uploadError) {
            console.error("Cloudinary upload error:", uploadError);
          }
        }
      }

      const data: any = {};
      if (bodyData.name !== undefined) data.name = bodyData.name;
      if (bodyData.type !== undefined) data.type = bodyData.type;
      if (bodyData.floor !== undefined) data.floor = Number(bodyData.floor);
      if (bodyData.area !== undefined) data.area = Number(bodyData.area);
      if (bodyData.rent !== undefined) data.rent = Number(bodyData.rent);
      if (bodyData.deposit !== undefined)
        data.deposit = Number(bodyData.deposit);
      if (bodyData.description !== undefined)
        data.description = bodyData.description || null;
      if (bodyData.status !== undefined) data.status = bodyData.status;
      if (bodyData.isAvailable !== undefined) data.isAvailable = bodyData.isAvailable === true || bodyData.isAvailable === 'true';
      if (bodyData.occupiedUntil !== undefined) data.occupiedUntil = bodyData.occupiedUntil || null;
      if (bodyData.bookingSource !== undefined) data.bookingSource = bodyData.bookingSource;
      if (bodyData.brokerName !== undefined) data.brokerName = bodyData.brokerName || null;
      // Tenant info for Mark Occupied flow
      if (bodyData.tenantName !== undefined) data.tenantName = bodyData.tenantName;
      if (bodyData.tenantPhone !== undefined) data.tenantPhone = bodyData.tenantPhone;

      if (bodyData.amenities !== undefined) {
        const parsed = parseJsonField(bodyData.amenities, []);
        data.amenities = Array.isArray(parsed) ? parsed : [];
      }

      if (bodyData.rules !== undefined) {
        const parsed = parseJsonField(bodyData.rules, []);
        data.rules = Array.isArray(parsed) ? parsed : [];
      }

      if (bodyData.existingMedia !== undefined || (files && files.length > 0)) {
        data.media = media;
      }

      return this.roomsService.update(id, data);
    }, "Room operation failed");
  }

  @Delete("rooms/:id")
  @ApiOperation({ summary: "Delete a room listing (Admin only)" })
  async deleteRoom(@Param("id") id: string) {
    try {
      const result = await this.roomsService.delete(id);
      return { 
        message: "Room deleted successfully",
        room: result
      };
    } catch (error) {
      // Check if it's a foreign key constraint error
      if (error.code === 'P2003' || error.code === 'P2014') {
        throw new BadRequestException(
          "Cannot delete room because it has related records. The room has been archived instead."
        );
      }
      console.error("🔥 deleteRoom error:", error);
      if (error instanceof Error && error.stack) {
        console.error("🔥 deleteRoom stack:", error.stack);
      }
      throw error;
    }
  }

  @Post("upload/video")
  @ApiOperation({ summary: "Upload room tour video (Admin only)" })
  @UseInterceptors(
    FileInterceptor("video", {
      fileFilter: (_req, file, cb) => {
        const allowed = new Set([".mp4", ".mov", ".webm"]);
        const ext = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf("."));
        cb(
          allowed.has(ext)
            ? null
            : new BadRequestException("Only mp4, mov, webm videos are allowed"),
          allowed.has(ext),
        );
      },
      limits: { fileSize: 100 * 1024 * 1024 },
    }),
  )
  async uploadRoomVideo(
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.executeAdminAction(async () => {
      if (!file) {
        throw new BadRequestException("Video file is required");
      }
      
      // Upload to Cloudinary
      const result = await this.cloudinaryService.uploadImage(file, "iris-plaza/rooms");
      return {
        message: "Video uploaded successfully",
        videoUrl: result.secure_url,
      };
    }, "Room operation failed");
  }

  @Patch("tenants/:id/approve")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Approve a tenant account" })
  @ApiResponse({ status: 200, description: "Tenant approved successfully" })
  @ApiResponse({ status: 404, description: "User not found" })
  async approveTenant(@Param("id") userId: string) {
    return this.executeAdminAction(
      () => this.adminService.approveTenant(userId),
      "Failed to approve tenant",
    );
  }

  @Patch("tenants/:id/reject")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Reject a tenant account" })
  @ApiResponse({ status: 200, description: "Tenant rejected successfully" })
  @ApiResponse({ status: 404, description: "User not found" })
  async rejectTenant(@Param("id") userId: string) {
    return this.executeAdminAction(
      () => this.adminService.rejectTenant(userId),
      "Failed to reject tenant",
    );
  }

  @Patch("tenants/:id/suspend")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Suspend a tenant account" })
  @ApiResponse({ status: 200, description: "Tenant suspended successfully" })
  @ApiResponse({ status: 404, description: "User not found" })
  async suspendTenant(@Param("id") userId: string) {
    return this.executeAdminAction(
      () => this.adminService.suspendTenant(userId),
      "Failed to suspend tenant",
    );
  }

  @Get("charts/revenue")
  @ApiOperation({ summary: "Get monthly revenue data for charts" })
  @ApiResponse({ status: 200, description: "Monthly revenue data" })
  async getMonthlyRevenue() {
    return this.adminService.getMonthlyRevenue();
  }

  @Get("charts/occupancy")
  @ApiOperation({ summary: "Get occupancy data for charts" })
  @ApiResponse({ status: 200, description: "Occupancy data" })
  async getOccupancyData() {
    return this.adminService.getOccupancyData();
  }

  @Post("tenants/create-offline")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create an offline tenant (active or future booking)" })
  @ApiResponse({ status: 201, description: "Offline tenant created successfully" })
  @ApiResponse({ status: 400, description: "Bad request" })
  async createOfflineTenant(
    @Body()
    body: {
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
    },
  ) {
    return this.executeAdminAction(
      () => this.adminService.createOfflineTenant(body),
      "Failed to create offline tenant",
    );
  }
}
