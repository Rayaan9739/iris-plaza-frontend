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
exports.ContactService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
const client_1 = require("@prisma/client");
let ContactService = class ContactService {
    constructor(prisma, notificationsService) {
        this.prisma = prisma;
        this.notificationsService = notificationsService;
    }
    async createMessage(dto) {
        const adminUsers = await this.prisma.user.findMany({
            where: {
                role: 'ADMIN',
            },
        });
        const notificationPromises = adminUsers.map((admin) => this.notificationsService.create(admin.id, {
            type: client_1.NotificationType.ANNOUNCEMENT,
            title: `New Contact Form: ${dto.subject}`,
            message: `Name: ${dto.name}\nEmail: ${dto.email}\nPhone: ${dto.phone || 'Not provided'}\n\nMessage:\n${dto.message}`,
        }));
        await Promise.all(notificationPromises);
        return {
            success: true,
            message: 'Thank you for contacting us! We will get back to you soon.',
        };
    }
};
exports.ContactService = ContactService;
exports.ContactService = ContactService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService])
], ContactService);
//# sourceMappingURL=contact.service.js.map