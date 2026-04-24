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
exports.AgreementsController = void 0;
const common_1 = require("@nestjs/common");
const https = require("https");
const fs = require("fs");
const path = require("path");
const swagger_1 = require("@nestjs/swagger");
const agreements_service_1 = require("./agreements.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
let AgreementsController = class AgreementsController {
    constructor(agreementsService) {
        this.agreementsService = agreementsService;
    }
    async getMyAgreement(req) {
        const userId = req.user?.id || req.user?.sub;
        if (!userId) {
            return { agreement: null };
        }
        const agreement = await this.agreementsService.findMyAgreement(userId);
        return { agreement };
    }
    async findByBooking(bookingId) {
        console.log(`[Controller] GET /agreements/booking/${bookingId}`);
        return this.agreementsService.findByBooking(bookingId);
    }
    async signAsTenant(bookingId, body) {
        return this.agreementsService.signAsTenant(bookingId, body.signature);
    }
    async signAsAdmin(bookingId, body) {
        return this.agreementsService.signAsAdmin(bookingId, body.signature);
    }
    async downloadAgreement(bookingId, res) {
        const agreement = await this.agreementsService.findByBooking(bookingId);
        if (!agreement || !agreement.agreementUrl) {
            return res.status(common_1.HttpStatus.NOT_FOUND).json({ message: "Agreement not found" });
        }
        const isCloudinary = agreement.agreementUrl.startsWith("http");
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename=agreement_${bookingId}.docx`);
        if (isCloudinary) {
            https.get(agreement.agreementUrl, (proxyRes) => {
                proxyRes.pipe(res);
            }).on("error", (err) => {
                console.error("Error proxying agreement from Cloudinary:", err);
                res.status(500).send("Error retrieving file");
            });
            return;
        }
        const filePath = agreement.agreementUrl.replace('/uploads/', '');
        const fullPath = path.join(process.cwd(), 'uploads', filePath);
        if (fs.existsSync(fullPath)) {
            return res.sendFile(fullPath);
        }
        else {
            return res.status(common_1.HttpStatus.NOT_FOUND).json({ message: "File not found" });
        }
    }
    async viewAgreement(bookingId, req, res) {
        const userId = req.user?.id || req.user?.sub;
        if (!userId) {
            return res.status(common_1.HttpStatus.UNAUTHORIZED).json({ message: "Unauthorized" });
        }
        const agreement = await this.agreementsService.findByBookingWithUser(bookingId);
        if (!agreement || !agreement.agreementUrl) {
            return res.status(common_1.HttpStatus.NOT_FOUND).json({ message: "Agreement not found" });
        }
        if (agreement.booking?.userId !== userId) {
            const isAdmin = req.user?.role === 'ADMIN' || req.user?.roles?.includes('ADMIN');
            if (!isAdmin) {
                return res.status(common_1.HttpStatus.FORBIDDEN).json({ message: "You don't have permission to view this agreement" });
            }
        }
        const isCloudinary = agreement.agreementUrl.startsWith("http");
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('Content-Disposition', 'attachment');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        if (isCloudinary) {
            https.get(agreement.agreementUrl, (proxyRes) => {
                proxyRes.pipe(res);
            }).on("error", (err) => {
                console.error("Error proxying agreement from Cloudinary:", err);
                res.status(500).send("Error retrieving file");
            });
            return;
        }
        const filePath = agreement.agreementUrl.replace('/uploads/', '');
        const fullPath = path.join(process.cwd(), 'uploads', filePath);
        if (fs.existsSync(fullPath)) {
            return res.sendFile(fullPath);
        }
        else {
            return res.status(common_1.HttpStatus.NOT_FOUND).json({ message: "File not found" });
        }
    }
};
exports.AgreementsController = AgreementsController;
__decorate([
    (0, common_1.Get)("my"),
    (0, swagger_1.ApiOperation)({ summary: "Get current user's agreement" }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AgreementsController.prototype, "getMyAgreement", null);
__decorate([
    (0, common_1.Get)("booking/:bookingId"),
    (0, swagger_1.ApiOperation)({ summary: "Get agreement by booking ID" }),
    __param(0, (0, common_1.Param)("bookingId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AgreementsController.prototype, "findByBooking", null);
__decorate([
    (0, common_1.Post)("booking/:bookingId/sign"),
    (0, swagger_1.ApiOperation)({ summary: "Sign agreement as tenant" }),
    __param(0, (0, common_1.Param)("bookingId")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AgreementsController.prototype, "signAsTenant", null);
__decorate([
    (0, common_1.Post)("admin/booking/:bookingId/sign"),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)("ADMIN"),
    (0, swagger_1.ApiOperation)({ summary: "Sign agreement as admin" }),
    __param(0, (0, common_1.Param)("bookingId")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AgreementsController.prototype, "signAsAdmin", null);
__decorate([
    (0, common_1.Get)("booking/:bookingId/download"),
    (0, swagger_1.ApiOperation)({ summary: "Download agreement DOCX" }),
    __param(0, (0, common_1.Param)("bookingId")),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AgreementsController.prototype, "downloadAgreement", null);
__decorate([
    (0, common_1.Get)("view/:bookingId"),
    (0, swagger_1.ApiOperation)({ summary: "View agreement in browser (view-only, no download)" }),
    __param(0, (0, common_1.Param)("bookingId")),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AgreementsController.prototype, "viewAgreement", null);
exports.AgreementsController = AgreementsController = __decorate([
    (0, swagger_1.ApiTags)("Agreements"),
    (0, common_1.Controller)("agreements"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [agreements_service_1.AgreementsService])
], AgreementsController);
//# sourceMappingURL=agreements.controller.js.map