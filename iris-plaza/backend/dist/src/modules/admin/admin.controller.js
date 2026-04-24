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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
const platform_express_1 = require("@nestjs/platform-express");
const admin_service_1 = require("./admin.service");
const rooms_service_1 = require("../rooms/rooms.service");
const bookings_service_1 = require("../bookings/bookings.service");
const room_dto_1 = require("../rooms/dto/room.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const cloudinary_service_1 = require("../../common/services/cloudinary.service");
let AdminController = class AdminController {
    constructor(adminService, roomsService, bookingsService, cloudinaryService) {
        this.adminService = adminService;
        this.roomsService = roomsService;
        this.bookingsService = bookingsService;
        this.cloudinaryService = cloudinaryService;
    }
    async executeAdminAction(action, fallbackMessage) {
        try {
            return await action();
        }
        catch (error) {
            console.error("🔥 BACKEND ERROR:", error);
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw error;
        }
    }
    async getDashboard() {
        return this.executeAdminAction(() => this.adminService.getDashboardStats(), "Failed to fetch dashboard statistics");
    }
    async getStats() {
        return this.executeAdminAction(() => this.adminService.getDashboardStats(), "Failed to fetch dashboard statistics");
    }
    async getRooms() {
        return this.executeAdminAction(() => this.adminService.getAdminRooms(), "Failed to fetch rooms");
    }
    async getRoom(id) {
        return this.executeAdminAction(() => this.adminService.getAdminRoom(id), "Failed to fetch room");
    }
    async getAmenities() {
        return this.executeAdminAction(() => this.adminService.getAmenities(), "Failed to fetch amenities");
    }
    async createAmenity(body) {
        return this.executeAdminAction(() => this.adminService.createAmenity(String(body?.name || "")), "Failed to create amenity");
    }
    async deleteAmenity(id) {
        return this.executeAdminAction(() => this.adminService.deleteAmenity(id), "Failed to delete amenity");
    }
    async getBookings() {
        return this.executeAdminAction(() => this.adminService.getAdminBookings(), "Failed to fetch bookings");
    }
    async approveBooking(id) {
        return this.executeAdminAction(() => this.bookingsService.approve(id), "Failed to approve booking");
    }
    async rejectBooking(id) {
        return this.executeAdminAction(() => this.bookingsService.reject(id), "Failed to reject booking");
    }
    async getTenants() {
        return this.executeAdminAction(() => this.adminService.getAllTenants(), "Failed to fetch tenants");
    }
    async getTenantById(tenantId) {
        return this.executeAdminAction(() => this.adminService.getTenantById(tenantId), "Failed to fetch tenant details");
    }
    async removeTenant(userId) {
        return this.executeAdminAction(() => this.adminService.removeTenant(userId), "Failed to remove tenant");
    }
    async updateTenant(userId, body) {
        return this.executeAdminAction(() => this.adminService.updateTenant(userId, body), "Failed to update tenant");
    }
    async getPayments() {
        return this.executeAdminAction(() => this.adminService.getAdminPayments(), "Failed to fetch payments");
    }
    async markPaymentAsReceived(id, body) {
        return this.executeAdminAction(() => this.adminService.markPaymentAsPaid(id, body?.amountReceived, body?.note, body?.paymentMethod), "Failed to mark payment as received");
    }
    async getDocuments() {
        return this.executeAdminAction(() => this.adminService.getAdminDocuments(), "Failed to fetch documents");
    }
    async approveDocument(id) {
        return this.executeAdminAction(() => this.adminService.approveDocument(id), "Failed to approve document");
    }
    async rejectDocument(id) {
        return this.executeAdminAction(() => this.adminService.rejectDocument(id), "Failed to reject document");
    }
    async getMaintenanceRequests() {
        return this.executeAdminAction(() => this.adminService.getMaintenanceRequests(), "Failed to fetch maintenance requests");
    }
    async approveMaintenanceRequest(id) {
        return this.executeAdminAction(() => this.adminService.approveMaintenanceRequest(id), "Failed to approve maintenance request");
    }
    async rejectMaintenanceRequest(id) {
        return this.executeAdminAction(() => this.adminService.rejectMaintenanceRequest(id), "Failed to reject maintenance request");
    }
    async getPendingVerifications() {
        return this.executeAdminAction(() => this.adminService.getPendingVerifications(), "Failed to fetch pending verifications");
    }
    async createRoom(files, body, _req) {
        return this.executeAdminAction(async () => {
            console.log("FILES:", files);
            console.log("BODY:", body);
            console.log("[CREATE ROOM] Raw body keys:", Object.keys(body || {}));
            console.log("[CREATE ROOM] Files received:", files?.length || 0);
            console.log("[CREATE ROOM] body.type value:", body?.type, "- type:", typeof body?.type);
            console.log("[CREATE ROOM] Received room type:", body.type);
            console.log("[CREATE ROOM] Full body:", JSON.stringify(body));
            const parseJsonField = (field, defaultValue = null) => {
                if (field === undefined || field === null || field === "") {
                    return defaultValue;
                }
                if (typeof field === "object") {
                    return field;
                }
                try {
                    return JSON.parse(field);
                }
                catch {
                    return defaultValue;
                }
            };
            const media = [];
            const existingMediaParsed = parseJsonField(body.existingMedia, []);
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
                    }
                    catch (uploadError) {
                        console.error("Cloudinary upload error:", uploadError);
                    }
                }
            }
            const dto = {
                ...body,
                floor: Number(body.floor) || 0,
                area: Number(body.area) || 0,
                rent: Number(body.rent) || 0,
                deposit: Number(body.deposit) || 0,
                media,
            };
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
            const dtoInstance = (0, class_transformer_1.plainToInstance)(room_dto_1.CreateRoomDto, dto);
            const errors = await (0, class_validator_1.validate)(dtoInstance);
            if (errors.length > 0) {
                const errorMessages = errors.map(e => Object.values(e.constraints || {}).join(', ')).join('; ');
                console.log("[CREATE ROOM] Validation errors:", errorMessages);
                console.log("[CREATE ROOM] DTO instance type value:", dtoInstance.type);
                throw new common_1.BadRequestException(errorMessages);
            }
            return this.roomsService.create(dto);
        }, "Room operation failed");
    }
    async updateRoom(id, files, body, _req) {
        return this.executeAdminAction(async () => {
            console.log("FILES:", files);
            console.log("BODY:", body);
            console.log("[UPDATE ROOM] Raw body keys:", Object.keys(body || {}));
            console.log("[UPDATE ROOM] body.type value:", body?.type, "- type:", typeof body?.type);
            console.log("[UPDATE ROOM] Received room type:", body.type);
            console.log("[UPDATE ROOM] Full body:", JSON.stringify(body));
            const bodyData = body || {};
            const parseJsonField = (field, defaultValue = null) => {
                if (field === undefined || field === null || field === "") {
                    return defaultValue;
                }
                if (typeof field === "object") {
                    return field;
                }
                try {
                    return JSON.parse(field);
                }
                catch {
                    return defaultValue;
                }
            };
            const media = [];
            const existingMediaParsed = parseJsonField(bodyData.existingMedia, []);
            if (Array.isArray(existingMediaParsed)) {
                media.push(...existingMediaParsed);
            }
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
                    }
                    catch (uploadError) {
                        console.error("Cloudinary upload error:", uploadError);
                    }
                }
            }
            const data = {};
            if (bodyData.name !== undefined)
                data.name = bodyData.name;
            if (bodyData.type !== undefined)
                data.type = bodyData.type;
            if (bodyData.floor !== undefined)
                data.floor = Number(bodyData.floor);
            if (bodyData.area !== undefined)
                data.area = Number(bodyData.area);
            if (bodyData.rent !== undefined)
                data.rent = Number(bodyData.rent);
            if (bodyData.deposit !== undefined)
                data.deposit = Number(bodyData.deposit);
            if (bodyData.description !== undefined)
                data.description = bodyData.description || null;
            if (bodyData.status !== undefined)
                data.status = bodyData.status;
            if (bodyData.isAvailable !== undefined)
                data.isAvailable = bodyData.isAvailable === true || bodyData.isAvailable === 'true';
            if (bodyData.occupiedUntil !== undefined)
                data.occupiedUntil = bodyData.occupiedUntil || null;
            if (bodyData.bookingSource !== undefined)
                data.bookingSource = bodyData.bookingSource;
            if (bodyData.brokerName !== undefined)
                data.brokerName = bodyData.brokerName || null;
            if (bodyData.tenantName !== undefined)
                data.tenantName = bodyData.tenantName;
            if (bodyData.tenantPhone !== undefined)
                data.tenantPhone = bodyData.tenantPhone;
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
            if (data.type !== undefined) {
                const dtoInstance = (0, class_transformer_1.plainToInstance)(room_dto_1.UpdateRoomDto, data);
                const errors = await (0, class_validator_1.validate)(dtoInstance);
                if (errors.length > 0) {
                    const errorMessages = errors.map(e => Object.values(e.constraints || {}).join(', ')).join('; ');
                    console.log("[UPDATE ROOM] Validation errors:", errorMessages);
                    console.log("[UPDATE ROOM] DTO instance type value:", dtoInstance.type);
                    throw new common_1.BadRequestException(errorMessages);
                }
            }
            return this.roomsService.update(id, data);
        }, "Room operation failed");
    }
    async patchRoom(id, files, body, _req) {
        return this.executeAdminAction(async () => {
            const bodyData = body || {};
            const parseJsonField = (field, defaultValue = null) => {
                if (field === undefined || field === null || field === "") {
                    return defaultValue;
                }
                if (typeof field === "object") {
                    return field;
                }
                try {
                    return JSON.parse(field);
                }
                catch {
                    return defaultValue;
                }
            };
            const media = [];
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
                    }
                    catch (uploadError) {
                        console.error("Cloudinary upload error:", uploadError);
                    }
                }
            }
            const data = {};
            if (bodyData.name !== undefined)
                data.name = bodyData.name;
            if (bodyData.type !== undefined)
                data.type = bodyData.type;
            if (bodyData.floor !== undefined)
                data.floor = Number(bodyData.floor);
            if (bodyData.area !== undefined)
                data.area = Number(bodyData.area);
            if (bodyData.rent !== undefined)
                data.rent = Number(bodyData.rent);
            if (bodyData.deposit !== undefined)
                data.deposit = Number(bodyData.deposit);
            if (bodyData.description !== undefined)
                data.description = bodyData.description || null;
            if (bodyData.status !== undefined)
                data.status = bodyData.status;
            if (bodyData.isAvailable !== undefined)
                data.isAvailable = bodyData.isAvailable === true || bodyData.isAvailable === 'true';
            if (bodyData.occupiedUntil !== undefined)
                data.occupiedUntil = bodyData.occupiedUntil || null;
            if (bodyData.bookingSource !== undefined)
                data.bookingSource = bodyData.bookingSource;
            if (bodyData.brokerName !== undefined)
                data.brokerName = bodyData.brokerName || null;
            if (bodyData.tenantName !== undefined)
                data.tenantName = bodyData.tenantName;
            if (bodyData.tenantPhone !== undefined)
                data.tenantPhone = bodyData.tenantPhone;
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
    async deleteRoom(id) {
        try {
            const result = await this.roomsService.delete(id);
            return {
                message: "Room deleted successfully",
                room: result
            };
        }
        catch (error) {
            if (error.code === 'P2003' || error.code === 'P2014') {
                throw new common_1.BadRequestException("Cannot delete room because it has related records. The room has been archived instead.");
            }
            console.error("🔥 deleteRoom error:", error);
            if (error instanceof Error && error.stack) {
                console.error("🔥 deleteRoom stack:", error.stack);
            }
            throw error;
        }
    }
    async uploadRoomVideo(file) {
        return this.executeAdminAction(async () => {
            if (!file) {
                throw new common_1.BadRequestException("Video file is required");
            }
            const result = await this.cloudinaryService.uploadImage(file, "iris-plaza/rooms");
            return {
                message: "Video uploaded successfully",
                videoUrl: result.secure_url,
            };
        }, "Room operation failed");
    }
    async approveTenant(userId) {
        return this.executeAdminAction(() => this.adminService.approveTenant(userId), "Failed to approve tenant");
    }
    async rejectTenant(userId) {
        return this.executeAdminAction(() => this.adminService.rejectTenant(userId), "Failed to reject tenant");
    }
    async suspendTenant(userId) {
        return this.executeAdminAction(() => this.adminService.suspendTenant(userId), "Failed to suspend tenant");
    }
    async getMonthlyRevenue() {
        return this.adminService.getMonthlyRevenue();
    }
    async getOccupancyData() {
        return this.adminService.getOccupancyData();
    }
    async createOfflineTenant(body) {
        return this.executeAdminAction(() => this.adminService.createOfflineTenant(body), "Failed to create offline tenant");
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)("dashboard"),
    (0, swagger_1.ApiOperation)({ summary: "Get dashboard statistics" }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Get)("stats"),
    (0, swagger_1.ApiOperation)({ summary: "Get dashboard statistics (legacy alias)" }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)("rooms"),
    (0, swagger_1.ApiOperation)({ summary: "Get all rooms for admin" }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getRooms", null);
__decorate([
    (0, common_1.Get)("rooms/:id"),
    (0, swagger_1.ApiOperation)({ summary: "Get a room by ID for admin" }),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getRoom", null);
__decorate([
    (0, common_1.Get)("amenities"),
    (0, swagger_1.ApiOperation)({ summary: "Get all amenities" }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAmenities", null);
__decorate([
    (0, common_1.Post)("amenities"),
    (0, swagger_1.ApiOperation)({ summary: "Create a global amenity" }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createAmenity", null);
__decorate([
    (0, common_1.Delete)("amenities/:id"),
    (0, swagger_1.ApiOperation)({ summary: "Delete a global amenity" }),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteAmenity", null);
__decorate([
    (0, common_1.Get)("bookings"),
    (0, swagger_1.ApiOperation)({ summary: "Get all bookings for admin" }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getBookings", null);
__decorate([
    (0, common_1.Patch)("bookings/:id/approve"),
    (0, swagger_1.ApiOperation)({ summary: "Approve a booking (Admin)" }),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "approveBooking", null);
__decorate([
    (0, common_1.Patch)("bookings/:id/reject"),
    (0, swagger_1.ApiOperation)({ summary: "Reject a booking (Admin)" }),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "rejectBooking", null);
__decorate([
    (0, common_1.Get)("tenants"),
    (0, swagger_1.ApiOperation)({ summary: "Get all tenants with active bookings" }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getTenants", null);
__decorate([
    (0, common_1.Get)("tenants/:id"),
    (0, swagger_1.ApiOperation)({ summary: "Get tenant details by ID" }),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getTenantById", null);
__decorate([
    (0, common_1.Delete)("tenants/:id"),
    (0, swagger_1.ApiOperation)({ summary: "Remove tenant and free room" }),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "removeTenant", null);
__decorate([
    (0, common_1.Put)("tenants/:id"),
    (0, swagger_1.ApiOperation)({ summary: "Update tenant details and room assignment" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateTenant", null);
__decorate([
    (0, common_1.Get)("payments"),
    (0, swagger_1.ApiOperation)({ summary: "Get all payments for admin" }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getPayments", null);
__decorate([
    (0, common_1.Patch)("payments/:id/mark-paid"),
    (0, swagger_1.ApiOperation)({ summary: "Mark payment as received" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "markPaymentAsReceived", null);
__decorate([
    (0, common_1.Get)("documents"),
    (0, swagger_1.ApiOperation)({ summary: "Get all uploaded tenant documents" }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getDocuments", null);
__decorate([
    (0, common_1.Patch)("documents/:id/approve"),
    (0, swagger_1.ApiOperation)({ summary: "Approve a document" }),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "approveDocument", null);
__decorate([
    (0, common_1.Patch)("documents/:id/reject"),
    (0, swagger_1.ApiOperation)({ summary: "Reject a document" }),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "rejectDocument", null);
__decorate([
    (0, common_1.Get)("maintenance"),
    (0, swagger_1.ApiOperation)({ summary: "Get all maintenance requests" }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getMaintenanceRequests", null);
__decorate([
    (0, common_1.Patch)("maintenance/:id/approve"),
    (0, swagger_1.ApiOperation)({ summary: "Approve maintenance request" }),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "approveMaintenanceRequest", null);
__decorate([
    (0, common_1.Patch)("maintenance/:id/reject"),
    (0, swagger_1.ApiOperation)({ summary: "Reject maintenance request" }),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "rejectMaintenanceRequest", null);
__decorate([
    (0, common_1.Get)("verifications"),
    (0, swagger_1.ApiOperation)({
        summary: "Get pending verifications (documents, bookings, and tenant registrations)",
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getPendingVerifications", null);
__decorate([
    (0, common_1.Post)("rooms"),
    (0, swagger_1.ApiOperation)({ summary: "Create a room listing (Admin only)" }),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true, whitelist: false })),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)("media")),
    __param(0, (0, common_1.UploadedFiles)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createRoom", null);
__decorate([
    (0, common_1.Put)("rooms/:id"),
    (0, swagger_1.ApiOperation)({ summary: "Update a room listing (Admin only)" }),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true, whitelist: false })),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)("media")),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.UploadedFiles)()),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Array, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateRoom", null);
__decorate([
    (0, common_1.Patch)("rooms/:id"),
    (0, swagger_1.ApiOperation)({ summary: "Patch a room listing (Admin only) - for Mark Occupied flow" }),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true, whitelist: false })),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)("media")),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.UploadedFiles)()),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Array, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "patchRoom", null);
__decorate([
    (0, common_1.Delete)("rooms/:id"),
    (0, swagger_1.ApiOperation)({ summary: "Delete a room listing (Admin only)" }),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteRoom", null);
__decorate([
    (0, common_1.Post)("upload/video"),
    (0, swagger_1.ApiOperation)({ summary: "Upload room tour video (Admin only)" }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)("video", {
        fileFilter: (_req, file, cb) => {
            const allowed = new Set([".mp4", ".mov", ".webm"]);
            const ext = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf("."));
            cb(allowed.has(ext)
                ? null
                : new common_1.BadRequestException("Only mp4, mov, webm videos are allowed"), allowed.has(ext));
        },
        limits: { fileSize: 100 * 1024 * 1024 },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "uploadRoomVideo", null);
__decorate([
    (0, common_1.Patch)("tenants/:id/approve"),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: "Approve a tenant account" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Tenant approved successfully" }),
    (0, swagger_1.ApiResponse)({ status: 404, description: "User not found" }),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "approveTenant", null);
__decorate([
    (0, common_1.Patch)("tenants/:id/reject"),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: "Reject a tenant account" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Tenant rejected successfully" }),
    (0, swagger_1.ApiResponse)({ status: 404, description: "User not found" }),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "rejectTenant", null);
__decorate([
    (0, common_1.Patch)("tenants/:id/suspend"),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: "Suspend a tenant account" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Tenant suspended successfully" }),
    (0, swagger_1.ApiResponse)({ status: 404, description: "User not found" }),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "suspendTenant", null);
__decorate([
    (0, common_1.Get)("charts/revenue"),
    (0, swagger_1.ApiOperation)({ summary: "Get monthly revenue data for charts" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Monthly revenue data" }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getMonthlyRevenue", null);
__decorate([
    (0, common_1.Get)("charts/occupancy"),
    (0, swagger_1.ApiOperation)({ summary: "Get occupancy data for charts" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Occupancy data" }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getOccupancyData", null);
__decorate([
    (0, common_1.Post)("tenants/create-offline"),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: "Create an offline tenant (active or future booking)" }),
    (0, swagger_1.ApiResponse)({ status: 201, description: "Offline tenant created successfully" }),
    (0, swagger_1.ApiResponse)({ status: 400, description: "Bad request" }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createOfflineTenant", null);
exports.AdminController = AdminController = __decorate([
    (0, swagger_1.ApiTags)("Admin"),
    (0, common_1.Controller)("admin"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)("ADMIN"),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [admin_service_1.AdminService,
        rooms_service_1.RoomsService,
        bookings_service_1.BookingsService,
        cloudinary_service_1.CloudinaryService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map