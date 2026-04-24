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
exports.PaymentsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const payments_service_1 = require("./payments.service");
const create_payment_dto_1 = require("./dto/create-payment.dto");
const pay_payment_dto_1 = require("./dto/pay-payment.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const cloudinary_service_1 = require("../../common/services/cloudinary.service");
let PaymentsController = class PaymentsController {
    constructor(paymentsService, cloudinaryService) {
        this.paymentsService = paymentsService;
        this.cloudinaryService = cloudinaryService;
    }
    async getMyPayments(req) {
        return this.paymentsService.findMyPayments(req.user.userId);
    }
    async getMyPaymentsAlias(req) {
        return this.paymentsService.findMyPayments(req.user.userId);
    }
    async findOne(id) {
        return this.paymentsService.findOne(id);
    }
    async getInvoice(id) {
        return this.paymentsService.getInvoice(id);
    }
    async create(req, dto) {
        return this.paymentsService.create(req.user.userId, dto);
    }
    async pay(req, body) {
        return this.paymentsService.pay(req.user.userId, body);
    }
    async submitOnlinePayment(req, paymentId, dto) {
        return this.paymentsService.submitOnlinePayment(req.user.userId, paymentId, {
            amount: dto.amount,
            transactionId: dto.transactionId,
            screenshotUrl: dto.screenshotUrl,
            transactionDate: dto.transactionDate,
        });
    }
    async submitCashPayment(req, paymentId, dto) {
        return this.paymentsService.submitCashPayment(req.user.userId, paymentId, {
            amount: dto.amount,
            description: dto.description,
        });
    }
    async handleWebhook(body) {
        return this.paymentsService.handleWebhook(body);
    }
    async findAll() {
        return this.paymentsService.findAll();
    }
    async adminMarkCashPaid(paymentId, body) {
        return this.paymentsService.adminMarkCashPayment(paymentId, Number(body.amountReceived), body.note);
    }
    async approvePayment(paymentId, req) {
        return this.paymentsService.approvePayment(paymentId, req.user.userId);
    }
    async rejectPayment(paymentId, body, req) {
        return this.paymentsService.rejectPayment(paymentId, req.user.userId, body.reason);
    }
    async getPaymentSummary(req) {
        return this.paymentsService.getPaymentSummary(req.user.userId);
    }
    async uploadScreenshot(file, paymentId) {
        if (!file) {
            throw new common_1.BadRequestException("Screenshot file is required");
        }
        const result = await this.cloudinaryService.uploadImage(file, "iris-plaza/payments");
        return this.paymentsService.uploadScreenshot(paymentId, result.secure_url, file);
    }
};
exports.PaymentsController = PaymentsController;
__decorate([
    (0, common_1.Get)("me"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Get my payments" }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "getMyPayments", null);
__decorate([
    (0, common_1.Get)("my"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Get my payments (alias)" }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "getMyPaymentsAlias", null);
__decorate([
    (0, common_1.Get)(":id"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Get payment by ID" }),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)("invoice/:id"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Get payment invoice" }),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "getInvoice", null);
__decorate([
    (0, common_1.Post)("create"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Create a payment" }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_payment_dto_1.CreatePaymentDto]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "create", null);
__decorate([
    (0, common_1.Post)("pay"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Pay a tenant payment record" }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "pay", null);
__decorate([
    (0, common_1.Post)(":paymentId/pay-online"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: "Submit online payment with screenshot verification",
    }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)("paymentId")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, pay_payment_dto_1.OnlinePaymentDto]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "submitOnlinePayment", null);
__decorate([
    (0, common_1.Post)(":paymentId/pay-cash"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Submit cash payment" }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)("paymentId")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, pay_payment_dto_1.CashPaymentDto]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "submitCashPayment", null);
__decorate([
    (0, common_1.Post)("webhook"),
    (0, swagger_1.ApiOperation)({ summary: "Payment gateway webhook" }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "handleWebhook", null);
__decorate([
    (0, common_1.Get)("admin/all"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)("ADMIN"),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Get all payments (Admin)" }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Patch)("admin/:paymentId/mark-cash-paid"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)("ADMIN"),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Admin mark cash payment as received" }),
    __param(0, (0, common_1.Param)("paymentId")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "adminMarkCashPaid", null);
__decorate([
    (0, common_1.Patch)("admin/:paymentId/approve"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)("ADMIN"),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Admin approve payment verification" }),
    __param(0, (0, common_1.Param)("paymentId")),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "approvePayment", null);
__decorate([
    (0, common_1.Patch)("admin/:paymentId/reject"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)("ADMIN"),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Admin reject payment verification" }),
    __param(0, (0, common_1.Param)("paymentId")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "rejectPayment", null);
__decorate([
    (0, common_1.Get)("summary"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Get payment summary for tenant dashboard" }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "getPaymentSummary", null);
__decorate([
    (0, common_1.Post)("upload-screenshot"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)("file")),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Upload payment screenshot for verification" }),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)("paymentId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "uploadScreenshot", null);
exports.PaymentsController = PaymentsController = __decorate([
    (0, swagger_1.ApiTags)("Payments"),
    (0, common_1.Controller)("payments"),
    __metadata("design:paramtypes", [payments_service_1.PaymentsService,
        cloudinary_service_1.CloudinaryService])
], PaymentsController);
//# sourceMappingURL=payments.controller.js.map