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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const DOCUMENT_TYPE_MAPPING = {
    "ID_CARD": "COLLEGE_ID",
    "PHOTO": "TENANT_PHOTO",
    "AADHAAR": "AADHAAR",
    "COLLEGE_ID": "COLLEGE_ID",
    "TENANT_PHOTO": "TENANT_PHOTO",
};
let DocumentsService = class DocumentsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    mapDocumentType(type) {
        const normalizedType = type?.toUpperCase();
        return DOCUMENT_TYPE_MAPPING[normalizedType] || type;
    }
    async findAll() {
        return this.prisma.document.findMany({
            include: { user: true, booking: { include: { room: true } } },
        });
    }
    async findMyDocuments(userId) {
        return this.prisma.document.findMany({
            where: { userId },
            include: { booking: true },
        });
    }
    async findOne(id) {
        const document = await this.prisma.document.findUnique({
            where: { id },
            include: { user: true, booking: true },
        });
        if (!document)
            throw new common_1.NotFoundException("Document not found");
        return document;
    }
    async create(actorUserId, data, actorRole) {
        const mappedType = this.mapDocumentType(data.type);
        const validTypes = ["AADHAAR", "COLLEGE_ID", "TENANT_PHOTO", "ID_CARD", "PROOF_OF_INCOME", "ADDRESS_PROOF", "PHOTO", "AGREEMENT", "OTHER"];
        if (!validTypes.includes(mappedType)) {
            throw new common_1.BadRequestException(`Invalid document type: ${data.type}`);
        }
        let targetUserId = actorUserId;
        if (actorRole === "ADMIN" && data.userId) {
            targetUserId = data.userId;
        }
        if (data.bookingId) {
            const booking = await this.prisma.booking.findUnique({
                where: { id: data.bookingId },
                select: { id: true, userId: true },
            });
            if (!booking) {
                throw new common_1.BadRequestException("Invalid bookingId");
            }
            if (actorRole === "ADMIN") {
                targetUserId = data.userId || booking.userId;
            }
            else if (booking.userId !== targetUserId) {
                throw new common_1.BadRequestException("You can only upload documents for your own booking");
            }
        }
        return this.prisma.document.create({
            data: {
                name: data.name,
                type: mappedType,
                fileUrl: data.fileUrl,
                fileName: data.fileName,
                fileSize: data.fileSize,
                mimeType: data.mimeType,
                bookingId: data.bookingId,
                userId: targetUserId,
                status: (data.status || "SUBMITTED"),
            },
        });
    }
    async updateStatus(id, status, rejectReason) {
        return this.prisma.document.update({
            where: { id },
            data: {
                status: status,
                rejectReason,
                reviewedAt: new Date(),
            },
        });
    }
    async findPendingDocuments() {
        return this.prisma.document.findMany({
            where: { status: "PENDING" },
            include: { user: true, booking: true },
        });
    }
};
exports.DocumentsService = DocumentsService;
exports.DocumentsService = DocumentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DocumentsService);
//# sourceMappingURL=documents.service.js.map