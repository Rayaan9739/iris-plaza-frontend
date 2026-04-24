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
exports.MaintenanceController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const maintenance_service_1 = require("./maintenance.service");
const create_maintenance_dto_1 = require("./dto/create-maintenance.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
let MaintenanceController = class MaintenanceController {
    constructor(maintenanceService) {
        this.maintenanceService = maintenanceService;
    }
    async getMyTickets(req) {
        return this.maintenanceService.findMyTickets(req.user.userId);
    }
    async getMyTicketsAlias(req) {
        return this.maintenanceService.findMyTickets(req.user.userId);
    }
    async create(req, dto) {
        if (!dto || !dto.category) {
            throw new common_1.BadRequestException("Invalid maintenance request data: category is required");
        }
        return this.maintenanceService.create(req.user.userId, dto);
    }
    async createRequestAlias(req, dto) {
        if (!dto || !dto.category) {
            throw new common_1.BadRequestException("Invalid maintenance request data: category is required");
        }
        return this.maintenanceService.create(req.user.userId, dto);
    }
    async findOne(id) {
        return this.maintenanceService.findOne(id);
    }
    async findAll() {
        return this.maintenanceService.findAll();
    }
    async updateStatus(id, body) {
        return this.maintenanceService.updateStatus(id, body.status, body.resolution);
    }
};
exports.MaintenanceController = MaintenanceController;
__decorate([
    (0, common_1.Get)("me"),
    (0, swagger_1.ApiOperation)({ summary: "Get my maintenance tickets" }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MaintenanceController.prototype, "getMyTickets", null);
__decorate([
    (0, common_1.Get)("my"),
    (0, swagger_1.ApiOperation)({ summary: "Get my maintenance tickets (alias)" }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MaintenanceController.prototype, "getMyTicketsAlias", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: "Create a maintenance ticket" }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_maintenance_dto_1.CreateMaintenanceDto]),
    __metadata("design:returntype", Promise)
], MaintenanceController.prototype, "create", null);
__decorate([
    (0, common_1.Post)("request"),
    (0, swagger_1.ApiOperation)({ summary: "Create a maintenance request (alias)" }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_maintenance_dto_1.CreateMaintenanceDto]),
    __metadata("design:returntype", Promise)
], MaintenanceController.prototype, "createRequestAlias", null);
__decorate([
    (0, common_1.Get)(":id"),
    (0, swagger_1.ApiOperation)({ summary: "Get ticket by ID" }),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MaintenanceController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)("admin/all"),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)("ADMIN"),
    (0, swagger_1.ApiOperation)({ summary: "Get all tickets (Admin)" }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MaintenanceController.prototype, "findAll", null);
__decorate([
    (0, common_1.Patch)("admin/:id/status"),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)("ADMIN"),
    (0, swagger_1.ApiOperation)({ summary: "Update ticket status (Admin)" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MaintenanceController.prototype, "updateStatus", null);
exports.MaintenanceController = MaintenanceController = __decorate([
    (0, swagger_1.ApiTags)("Maintenance"),
    (0, common_1.Controller)(["tickets", "maintenance"]),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [maintenance_service_1.MaintenanceService])
], MaintenanceController);
//# sourceMappingURL=maintenance.controller.js.map