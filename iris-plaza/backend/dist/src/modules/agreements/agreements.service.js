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
var AgreementsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgreementsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const schedule_1 = require("@nestjs/schedule");
const cloudinary_service_1 = require("../../common/services/cloudinary.service");
const notifications_service_1 = require("../notifications/notifications.service");
const agreement_template_service_1 = require("../../../templates/agreement-template.service");
let AgreementsService = AgreementsService_1 = class AgreementsService {
    constructor(prisma, cloudinaryService, notificationsService) {
        this.prisma = prisma;
        this.cloudinaryService = cloudinaryService;
        this.notificationsService = notificationsService;
        this.logger = new common_1.Logger(AgreementsService_1.name);
    }
    toStartOfUtcDay(date) {
        return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    }
    async generateRentalAgreement(bookingId) {
        const booking = await this.prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                user: {
                    include: {
                        tenantProfile: true,
                    },
                },
                room: true,
            },
        });
        if (!booking) {
            throw new common_1.NotFoundException("Booking not found");
        }
        const existingAgreement = await this.prisma.agreement.findUnique({
            where: { bookingId },
        });
        if (existingAgreement) {
            console.log(`[Agreement] Existing agreement found for booking ${bookingId}, will regenerate with latest template`);
        }
        else {
            console.log(`[Agreement] No existing agreement for booking ${bookingId}, generating new agreement`);
        }
        const tenantProfile = booking.user.tenantProfile;
        const moveInDate = booking.moveInDate || booking.startDate || new Date();
        const moveOutDate = booking.moveOutDate || booking.endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
        const rentAmountWords = (0, agreement_template_service_1.numberToWords)(Number(booking.room.rent) || 0);
        const depositAmountWords = (0, agreement_template_service_1.numberToWords)(Number(booking.room.deposit) || 0);
        const agreementMonths = (0, agreement_template_service_1.calculateMonths)(moveInDate, moveOutDate);
        const templateData = {
            tenant_name: `${booking.user.firstName || ""} ${booking.user.lastName || ""}`.trim() || "N/A",
            relation: tenantProfile?.relation || "N/A",
            father_name: tenantProfile?.fatherName || "N/A",
            tenant_address: tenantProfile?.tenantAddress || booking.user?.address || "N/A",
            aadhaar_number: tenantProfile?.aadhaarNumber || "N/A",
            college_name: tenantProfile?.collegeName || "N/A",
            room_number: booking.room.name || "N/A",
            floor: String(booking.room?.floor ?? "N/A"),
            rent_amount: Number(booking.room.rent) || 0,
            rent_amount_words: rentAmountWords,
            deposit_amount: Number(booking.room.deposit) || 0,
            deposit_amount_words: depositAmountWords,
            start_date: (0, agreement_template_service_1.formatDate)(moveInDate),
            end_date: (0, agreement_template_service_1.formatDate)(moveOutDate),
            agreement_months: agreementMonths,
            agreement_date: (0, agreement_template_service_1.formatDate)(new Date()),
        };
        const docxBytes = await (0, agreement_template_service_1.generateAgreementDocx)(templateData);
        const fileName = `agreement_${bookingId}.docx`;
        let agreementUrl;
        try {
            const result = await this.cloudinaryService.uploadBuffer(docxBytes, fileName, "iris-plaza/agreement");
            agreementUrl = result.secure_url;
            console.log(`[Agreement] DOCX uploaded to Cloudinary: ${agreementUrl}`);
        }
        catch (error) {
            console.error("Failed to upload agreement to Cloudinary:", error);
            throw new Error("Failed to generate rental agreement");
        }
        console.log(`[Agreement] Updating agreement record in database for booking ${bookingId}`);
        const dbAgreementData = {
            bookingId,
            agreementUrl,
            status: "PENDING_SIGNATURE",
            startDate: booking.moveInDate || booking.startDate || new Date(),
            endDate: booking.moveOutDate || booking.endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            monthlyRent: booking.room.rent,
            securityDeposit: booking.room.deposit,
            updatedAt: new Date(),
        };
        if (existingAgreement) {
            await this.prisma.agreement.update({
                where: { bookingId },
                data: dbAgreementData,
            });
        }
        else {
            await this.prisma.agreement.create({
                data: dbAgreementData,
            });
        }
        const documentData = {
            userId: booking.userId,
            bookingId,
            name: "Rental Agreement",
            type: "AGREEMENT",
            fileUrl: agreementUrl,
            fileName: fileName,
            status: "SUBMITTED",
        };
        const existingDocument = await this.prisma.document.findUnique({
            where: { id: `agreement-${bookingId}` },
        });
        if (existingDocument) {
            await this.prisma.document.update({
                where: { id: `agreement-${bookingId}` },
                data: documentData,
            });
        }
        else {
            await this.prisma.document.create({
                data: {
                    id: `agreement-${bookingId}`,
                    ...documentData,
                },
            });
        }
        await this.notificationsService.create(booking.userId, {
            type: "PUSH",
            title: "Rental Agreement Ready",
            message: "Your rental agreement is ready for signature. Please sign it from your Documents page.",
        });
        return agreementUrl;
    }
    async findByBooking(bookingId) {
        console.log(`[Agreement] findByBooking called with bookingId: ${bookingId}`);
        const agreement = await this.prisma.agreement.findUnique({
            where: { bookingId },
            include: { booking: { include: { user: true, room: true } } },
        });
        console.log(`[Agreement] Found agreement: ${agreement ? agreement.id : 'null'} for booking ${bookingId}`);
        return agreement;
    }
    async findByBookingWithUser(bookingId) {
        return this.prisma.agreement.findUnique({
            where: { bookingId },
            include: {
                booking: {
                    include: { user: true }
                }
            },
        });
    }
    async findMyAgreement(userId) {
        return this.prisma.agreement.findFirst({
            where: {
                booking: {
                    userId: userId,
                    status: {
                        in: ["APPROVED", "APPROVED_PENDING_PAYMENT"]
                    },
                },
                status: "ACTIVE",
                endDate: {
                    gt: new Date()
                }
            },
            include: {
                booking: true,
            },
        });
    }
    async create(bookingId, data) {
        return this.prisma.agreement.create({
            data: {
                bookingId,
                ...data,
            },
        });
    }
    async signAsTenant(bookingId, signatureDataUrl) {
        const agreement = await this.prisma.agreement.findUnique({
            where: { bookingId },
            include: { booking: { include: { user: { include: { tenantProfile: true } }, room: true } } },
        });
        if (!agreement) {
            throw new common_1.NotFoundException("Agreement not found");
        }
        let tenantSignatureUrl;
        if (signatureDataUrl) {
            try {
                const base64Data = signatureDataUrl.replace(/^data:image\/\w+;base64,/, "");
                const signatureBuffer = Buffer.from(base64Data, 'base64');
                const result = await this.cloudinaryService.uploadBuffer(signatureBuffer, `tenant_signature_${bookingId}.png`, "iris-plaza/signatures");
                tenantSignatureUrl = result.secure_url;
                console.log(`[Agreement] Tenant signature uploaded: ${tenantSignatureUrl}`);
            }
            catch (error) {
                console.error("Failed to upload tenant signature:", error);
            }
        }
        const updatedAgreement = await this.prisma.agreement.findUnique({
            where: { bookingId },
        });
        const newStatus = (updatedAgreement?.adminSigned && tenantSignatureUrl)
            ? "ACTIVE"
            : "PENDING_SIGNATURE";
        if (newStatus === "ACTIVE") {
            await this.notificationsService.create(agreement.booking.userId, {
                type: "PUSH",
                title: "Rental Agreement Activated",
                message: "Your rental agreement has been fully executed. You can download it from the Documents section.",
            });
        }
        return this.prisma.agreement.update({
            where: { bookingId },
            data: {
                tenantSigned: true,
                tenantSignedAt: new Date(),
                status: newStatus,
            },
            include: { booking: { include: { user: true, room: true } } },
        });
    }
    async signAsAdmin(bookingId, signatureDataUrl) {
        const agreement = await this.prisma.agreement.findUnique({
            where: { bookingId },
            include: { booking: { include: { user: { include: { tenantProfile: true } }, room: true } } },
        });
        if (!agreement) {
            throw new common_1.NotFoundException("Agreement not found");
        }
        let adminSignatureUrl;
        if (signatureDataUrl) {
            try {
                const base64Data = signatureDataUrl.replace(/^data:image\/\w+;base64,/, "");
                const signatureBuffer = Buffer.from(base64Data, 'base64');
                const result = await this.cloudinaryService.uploadBuffer(signatureBuffer, `admin_signature_${bookingId}.png`, "iris-plaza/signatures");
                adminSignatureUrl = result.secure_url;
                console.log(`[Agreement] Admin signature uploaded: ${adminSignatureUrl}`);
            }
            catch (error) {
                console.error("Failed to upload admin signature:", error);
            }
        }
        const updatedAgreement = await this.prisma.agreement.findUnique({
            where: { bookingId },
        });
        const newStatus = (updatedAgreement?.tenantSigned && adminSignatureUrl)
            ? "ACTIVE"
            : "SIGNED";
        const updated = await this.prisma.agreement.update({
            where: { bookingId },
            data: {
                adminSigned: true,
                adminSignedAt: new Date(),
                status: newStatus,
            },
            include: { booking: { include: { user: true, room: true } } },
        });
        if (newStatus === "ACTIVE") {
            await this.notificationsService.create(updated.booking.userId, {
                type: "PUSH",
                title: "Rental Agreement Activated",
                message: "Your rental agreement has been fully executed. You can download it from the Documents section.",
            });
        }
        return updated;
    }
    async getAgreementUrl(bookingId) {
        const agreement = await this.prisma.agreement.findUnique({
            where: { bookingId },
        });
        return agreement?.agreementUrl || null;
    }
    async expireAgreements() {
        try {
            this.logger.log('Running scheduled task to expire agreements...');
            const normalizedTodayUtc = this.toStartOfUtcDay(new Date());
            const expiredAgreements = await this.prisma.agreement.findMany({
                where: {
                    status: "ACTIVE",
                    endDate: {
                        lt: normalizedTodayUtc
                    }
                },
                include: {
                    booking: true
                }
            });
            for (const agreement of expiredAgreements) {
                await this.prisma.agreement.update({
                    where: { id: agreement.id },
                    data: {
                        status: "EXPIRED"
                    }
                });
                await this.prisma.room.update({
                    where: { id: agreement.booking.roomId },
                    data: {
                        status: "AVAILABLE",
                        isAvailable: true,
                        occupiedFrom: null,
                        occupiedUntil: null
                    }
                });
            }
            this.logger.log(`Expired ${expiredAgreements.length} agreements`);
            return {
                expiredCount: expiredAgreements.length,
                agreements: expiredAgreements
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const isConnectionError = errorMessage.includes('P1001') ||
                errorMessage.includes('connection') ||
                errorMessage.includes('timeout');
            if (!isConnectionError) {
                this.logger.error('Error expiring agreements:', error);
            }
            return { expiredCount: 0, agreements: [] };
        }
    }
};
exports.AgreementsService = AgreementsService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_MIDNIGHT),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AgreementsService.prototype, "expireAgreements", null);
exports.AgreementsService = AgreementsService = AgreementsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        cloudinary_service_1.CloudinaryService,
        notifications_service_1.NotificationsService])
], AgreementsService);
//# sourceMappingURL=agreements.service.js.map