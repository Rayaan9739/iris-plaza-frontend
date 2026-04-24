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
exports.CancellationRequestController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const cancellation_request_service_1 = require("./cancellation-request.service");
const create_cancellation_request_dto_1 = require("./dto/create-cancellation-request.dto");
let CancellationRequestController = class CancellationRequestController {
    constructor(cancellationRequestService) {
        this.cancellationRequestService = cancellationRequestService;
    }
    async createCancellationRequest(dto, req) {
        return this.cancellationRequestService.create(dto, req.user.userId);
    }
    async getMyRequest(req) {
        const userId = req.user?.userId;
        if (!userId) {
            throw new common_1.BadRequestException("User not found in request");
        }
        const request = await this.cancellationRequestService.getMyRequest(userId);
        return {
            success: true,
            data: request,
        };
    }
    async getPendingRequests() {
        const requests = await this.cancellationRequestService.getPendingRequests();
        return {
            success: true,
            data: requests,
        };
    }
    async approveRequest(req, requestId) {
        const adminId = req.user?.userId;
        if (!adminId) {
            throw new common_1.BadRequestException("Admin user not found in request");
        }
        const updatedRequest = await this.cancellationRequestService.approveRequest(requestId, adminId);
        return {
            success: true,
            message: "Cancellation request approved",
            data: updatedRequest,
        };
    }
    async rejectRequest(req, requestId, body) {
        const adminId = req.user?.userId;
        if (!adminId) {
            throw new common_1.BadRequestException("Admin user not found in request");
        }
        const updatedRequest = await this.cancellationRequestService.rejectRequest(requestId, adminId, body.rejectionReason || "");
        return {
            success: true,
            message: "Cancellation request rejected",
            data: updatedRequest,
        };
    }
};
exports.CancellationRequestController = CancellationRequestController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_cancellation_request_dto_1.CancellationRequestDto, Object]),
    __metadata("design:returntype", Promise)
], CancellationRequestController.prototype, "createCancellationRequest", null);
__decorate([
    (0, common_1.Get)("my-request"),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CancellationRequestController.prototype, "getMyRequest", null);
__decorate([
    (0, common_1.Get)("pending"),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)("ADMIN"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CancellationRequestController.prototype, "getPendingRequests", null);
__decorate([
    (0, common_1.Patch)(":id/approve"),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)("ADMIN"),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CancellationRequestController.prototype, "approveRequest", null);
__decorate([
    (0, common_1.Patch)(":id/reject"),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)("ADMIN"),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], CancellationRequestController.prototype, "rejectRequest", null);
exports.CancellationRequestController = CancellationRequestController = __decorate([
    (0, common_1.Controller)("cancellation-request"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [cancellation_request_service_1.CancellationRequestService])
], CancellationRequestController);
//# sourceMappingURL=cancellation-request.controller.js.map