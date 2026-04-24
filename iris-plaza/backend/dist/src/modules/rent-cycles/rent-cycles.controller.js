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
exports.RentCyclesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const rent_cycles_service_1 = require("./rent-cycles.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
let RentCyclesController = class RentCyclesController {
    constructor(rentCyclesService) {
        this.rentCyclesService = rentCyclesService;
    }
    async getMyRentCycles(req) {
        return this.rentCyclesService.findMyRentCycles(req.user.userId);
    }
    async getCurrentCycle(req) {
        return this.rentCyclesService.getCurrentCycle(req.user.userId);
    }
    async payRent(id) {
        return this.rentCyclesService.markAsPaid(id);
    }
    async findAll() {
        return this.rentCyclesService.findAll();
    }
    async generateMonthlyRent() {
        return this.rentCyclesService.generateMonthlyRent();
    }
};
exports.RentCyclesController = RentCyclesController;
__decorate([
    (0, common_1.Get)("me"),
    (0, swagger_1.ApiOperation)({ summary: "Get my rent cycles" }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RentCyclesController.prototype, "getMyRentCycles", null);
__decorate([
    (0, common_1.Get)("current"),
    (0, swagger_1.ApiOperation)({ summary: "Get current month rent" }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RentCyclesController.prototype, "getCurrentCycle", null);
__decorate([
    (0, common_1.Post)(":id/pay"),
    (0, swagger_1.ApiOperation)({ summary: "Mark rent as paid" }),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RentCyclesController.prototype, "payRent", null);
__decorate([
    (0, common_1.Get)("admin/all"),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)("ADMIN"),
    (0, swagger_1.ApiOperation)({ summary: "Get all rent cycles (Admin)" }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RentCyclesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)("admin/generate"),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)("ADMIN"),
    (0, swagger_1.ApiOperation)({ summary: "Generate monthly rent cycles (Admin)" }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RentCyclesController.prototype, "generateMonthlyRent", null);
exports.RentCyclesController = RentCyclesController = __decorate([
    (0, swagger_1.ApiTags)("Rent"),
    (0, common_1.Controller)("rent"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [rent_cycles_service_1.RentCyclesService])
], RentCyclesController);
//# sourceMappingURL=rent-cycles.controller.js.map