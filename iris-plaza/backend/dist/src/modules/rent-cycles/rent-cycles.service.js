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
exports.RentCyclesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
let RentCyclesService = class RentCyclesService {
    constructor(prisma, notificationsService) {
        this.prisma = prisma;
        this.notificationsService = notificationsService;
    }
    async findMyRentCycles(userId) {
        return this.prisma.rentCycle.findMany({
            where: { userId },
            include: { booking: { include: { room: true } }, payments: true },
            orderBy: { year: "desc", month: "desc" },
        });
    }
    async getCurrentCycle(userId) {
        const now = new Date();
        return this.prisma.rentCycle.findFirst({
            where: { userId, year: now.getFullYear(), month: now.getMonth() + 1 },
            include: { booking: { include: { room: true } }, payments: true },
        });
    }
    async findAll() {
        return this.prisma.rentCycle.findMany({
            include: {
                user: true,
                booking: { include: { room: true } },
                payments: true,
            },
            orderBy: { year: "desc", month: "desc" },
        });
    }
    async generateMonthlyRent() {
        const now = new Date();
        const bookings = await this.prisma.booking.findMany({
            where: { status: "APPROVED", endDate: null },
            include: { room: true },
        });
        for (const booking of bookings) {
            const existingCycle = await this.prisma.rentCycle.findFirst({
                where: {
                    bookingId: booking.id,
                    year: now.getFullYear(),
                    month: now.getMonth() + 1,
                },
            });
            if (!existingCycle) {
                const moveInDate = booking.moveInDate ?? booking.startDate;
                const anchorDay = moveInDate ? moveInDate.getDate() : 1;
                const monthLastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
                const dueDate = new Date(now.getFullYear(), now.getMonth(), Math.min(anchorDay, monthLastDay));
                await this.prisma.rentCycle.create({
                    data: {
                        userId: booking.userId,
                        bookingId: booking.id,
                        month: now.getMonth() + 1,
                        year: now.getFullYear(),
                        amount: booking.room.rent,
                        dueDate,
                        status: "PENDING",
                    },
                });
                await this.notificationsService.create(booking.userId, {
                    type: "PUSH",
                    title: "Monthly Rent Due",
                    message: `Rent for ${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")} is now due.`,
                });
            }
        }
    }
    async markAsPaid(id) {
        return this.prisma.rentCycle.update({
            where: { id },
            data: { status: "PAID", paidDate: new Date() },
        });
    }
};
exports.RentCyclesService = RentCyclesService;
exports.RentCyclesService = RentCyclesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService])
], RentCyclesService);
//# sourceMappingURL=rent-cycles.service.js.map