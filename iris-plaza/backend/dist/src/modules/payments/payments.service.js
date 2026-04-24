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
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const library_1 = require("@prisma/client/runtime/library");
const prisma_service_1 = require("../../prisma/prisma.service");
const event_emitter_service_1 = require("../../common/services/event-emitter.service");
const notifications_service_1 = require("../notifications/notifications.service");
const agreements_service_1 = require("../agreements/agreements.service");
const ocr_service_1 = require("../../common/services/ocr.service");
let PaymentsService = class PaymentsService {
    constructor(prisma, eventEmitter, notificationsService, agreementsService, ocrService) {
        this.prisma = prisma;
        this.eventEmitter = eventEmitter;
        this.notificationsService = notificationsService;
        this.agreementsService = agreementsService;
        this.ocrService = ocrService;
        this.roomSafeSelect = {
            id: true,
            name: true,
            type: true,
            description: true,
            floor: true,
            area: true,
            rent: true,
            deposit: true,
            status: true,
            isAvailable: true,
            occupiedFrom: true,
            occupiedUntil: true,
            videoUrl: true,
            createdAt: true,
            updatedAt: true,
            deletedAt: true,
            managementRent: true,
            managementStatus: true,
            managementIsAvailable: true,
            managementOccupiedUntil: true,
            media: { orderBy: { createdAt: "asc" } },
        };
    }
    monthKey(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    }
    parseMonthKey(month) {
        const [yearStr, monthStr] = String(month || "").split("-");
        const year = Number(yearStr);
        const monthNum = Number(monthStr);
        if (!Number.isFinite(year) || !Number.isFinite(monthNum)) {
            throw new common_1.BadRequestException("Invalid payment month");
        }
        return { year, month: monthNum };
    }
    addMonths(date, months) {
        const d = new Date(date);
        d.setMonth(d.getMonth() + months);
        return d;
    }
    getDueDateForMonth(year, month, anchorDay) {
        const lastDay = new Date(year, month, 0).getDate();
        return new Date(year, month - 1, Math.min(anchorDay, lastDay));
    }
    getFirstRentDueDate(moveInDate) {
        const firstCycleMonth = this.addMonths(new Date(moveInDate.getFullYear(), moveInDate.getMonth(), 1), 1);
        return this.getDueDateForMonth(firstCycleMonth.getFullYear(), firstCycleMonth.getMonth() + 1, moveInDate.getDate());
    }
    async getActiveApprovedBooking(userId) {
        return this.prisma.booking.findFirst({
            where: { userId, status: { in: ["APPROVED", "APPROVED_PENDING_PAYMENT"] } },
            include: { room: { select: this.roomSafeSelect } },
            orderBy: { createdAt: "desc" },
        });
    }
    async notifyRentDue(userId, month, amount) {
        await this.notificationsService.create(userId, {
            type: "PUSH",
            title: "Monthly Rent Due",
            message: `Rent for ${month} is due. Amount: ${amount}`,
        });
    }
    async ensureRentEntriesForBooking(booking) {
        const moveInDate = booking.moveInDate ?? booking.startDate;
        if (!moveInDate) {
            return;
        }
        const now = new Date();
        const firstDue = this.getFirstRentDueDate(moveInDate);
        if (firstDue > now) {
            return;
        }
        const baseRent = Number(booking.rentAmount ?? booking.room?.rent ?? 0);
        let cursor = new Date(firstDue);
        while (cursor <= now) {
            const month = this.monthKey(cursor);
            const existing = await this.prisma.payment.findFirst({
                where: {
                    userId: booking.userId,
                    bookingId: booking.id,
                    type: "RENT",
                    month,
                },
            });
            if (!existing) {
                const previousMonth = this.monthKey(this.addMonths(cursor, -1));
                const previousPayment = await this.prisma.payment.findFirst({
                    where: {
                        userId: booking.userId,
                        bookingId: booking.id,
                        type: "RENT",
                        month: previousMonth,
                    },
                    orderBy: { createdAt: "desc" },
                });
                const carryForward = Number(previousPayment?.pendingAmount ?? 0);
                const expectedAmount = baseRent + carryForward;
                await this.prisma.payment.create({
                    data: {
                        userId: booking.userId,
                        tenantId: booking.userId,
                        roomId: booking.roomId,
                        bookingId: booking.id,
                        month,
                        amount: new library_1.Decimal(expectedAmount),
                        rentAmount: new library_1.Decimal(expectedAmount),
                        paidAmount: new library_1.Decimal(0),
                        amountPaid: new library_1.Decimal(0),
                        pendingAmount: new library_1.Decimal(0),
                        borrowedAmount: new library_1.Decimal(0),
                        type: "RENT",
                        status: "PENDING",
                        paymentMethod: "ONLINE",
                        description: `Auto-generated rent for ${month}`,
                    },
                });
                await this.notifyRentDue(booking.userId, month, expectedAmount);
                this.eventEmitter.emitDashboardUpdate(booking.userId, {
                    monthlyRentDue: true,
                    month,
                });
            }
            cursor = this.addMonths(cursor, 1);
        }
    }
    async ensureCurrentWorkflow(userId) {
        const booking = await this.getActiveApprovedBooking(userId);
        if (!booking) {
            return null;
        }
        await this.ensureRentEntriesForBooking(booking);
        return booking;
    }
    toPresentation(payment) {
        return {
            ...payment,
            tenantId: payment.tenantId ?? payment.userId,
            rentAmount: Number(payment.rentAmount ?? payment.amount ?? 0),
            paidAmount: payment.paidAmount === null || payment.paidAmount === undefined
                ? null
                : Number(payment.paidAmount),
            pendingAmount: Number(payment.pendingAmount ?? payment.borrowedAmount ?? 0),
            status: payment.status === "COMPLETED" ? "PAID" : payment.status,
        };
    }
    async findMyPayments(userId) {
        await this.ensureCurrentWorkflow(userId).catch(() => null);
        const payments = await this.prisma.payment.findMany({
            where: {
                userId,
                booking: {
                    status: {
                        in: ["APPROVED", "APPROVED_PENDING_PAYMENT"]
                    }
                }
            },
            select: {
                id: true,
                userId: true,
                bookingId: true,
                rentCycleId: true,
                amount: true,
                rentAmount: true,
                paidAmount: true,
                pendingAmount: true,
                borrowedAmount: true,
                amountPaid: true,
                month: true,
                type: true,
                status: true,
                paymentMethod: true,
                screenshotUrl: true,
                transactionId: true,
                transactionDate: true,
                gateway: true,
                gatewayOrderId: true,
                gatewayPaymentId: true,
                gatewaySignature: true,
                description: true,
                invoiceUrl: true,
                createdAt: true,
                updatedAt: true,
                booking: { include: { room: { select: this.roomSafeSelect } } },
                rentCycle: true,
            },
            orderBy: { createdAt: "desc" },
        });
        return payments.map((p) => this.toPresentation(p));
    }
    async findOne(id) {
        const payment = await this.prisma.payment.findUnique({
            where: { id },
            include: { user: true, booking: true, rentCycle: true },
        });
        if (!payment)
            throw new common_1.NotFoundException("Payment not found");
        return this.toPresentation(payment);
    }
    async create(userId, dto) {
        const month = this.monthKey(new Date());
        const created = await this.prisma.payment.create({
            data: {
                type: dto.type,
                amount: new library_1.Decimal(dto.amount),
                bookingId: dto.bookingId,
                rentCycleId: dto.rentCycleId,
                description: dto.description,
                userId,
                tenantId: userId,
                month,
                gateway: "RAZORPAY",
            },
        });
        return this.toPresentation(created);
    }
    async updateStatus(id, status, gatewayPaymentId) {
        const normalized = String(status || "").toUpperCase();
        return this.prisma.payment.update({
            where: { id },
            data: {
                status: normalized === "PAID" ? "COMPLETED" : normalized,
                gatewayPaymentId,
            },
        });
    }
    async handleWebhook(data) {
        const { gatewayPaymentId, status } = data;
        const payment = await this.prisma.payment.findFirst({
            where: { gatewayPaymentId },
        });
        if (payment) {
            await this.prisma.payment.update({
                where: { id: payment.id },
                data: { status: status === "success" ? "COMPLETED" : "FAILED" },
            });
        }
    }
    async findAll() {
        const payments = await this.prisma.payment.findMany({
            select: {
                id: true,
                userId: true,
                bookingId: true,
                rentCycleId: true,
                amount: true,
                rentAmount: true,
                paidAmount: true,
                pendingAmount: true,
                borrowedAmount: true,
                amountPaid: true,
                month: true,
                type: true,
                status: true,
                paymentMethod: true,
                screenshotUrl: true,
                transactionId: true,
                transactionDate: true,
                gateway: true,
                gatewayOrderId: true,
                gatewayPaymentId: true,
                gatewaySignature: true,
                description: true,
                invoiceUrl: true,
                createdAt: true,
                updatedAt: true,
                user: true,
                booking: { include: { room: { select: this.roomSafeSelect } } },
                rentCycle: true,
            },
            orderBy: { createdAt: "desc" },
        });
        return payments.map((p) => this.toPresentation(p));
    }
    validateTransactionId(transactionId) {
        const valid = /^[A-Za-z0-9_-]{8,40}$/.test(String(transactionId || ""));
        if (!valid) {
            throw new common_1.BadRequestException("Invalid transaction id format");
        }
    }
    validatePaymentDateWithinPeriod(month, transactionDate) {
        const { year, month: monthNum } = this.parseMonthKey(month);
        const currentPeriodStart = new Date(year, monthNum - 1, 1, 0, 0, 0, 0);
        const currentPeriodEnd = new Date(year, monthNum, 0, 23, 59, 59, 999);
        const prevMonth = monthNum === 1 ? 12 : monthNum - 1;
        const prevYear = monthNum === 1 ? year - 1 : year;
        const prevPeriodStart = new Date(prevYear, prevMonth - 1, 1, 0, 0, 0, 0);
        const prevPeriodEnd = new Date(prevYear, prevMonth, 0, 23, 59, 59, 999);
        const inCurrentPeriod = transactionDate >= currentPeriodStart && transactionDate <= currentPeriodEnd;
        const inPrevPeriod = transactionDate >= prevPeriodStart && transactionDate <= prevPeriodEnd;
        if (!inCurrentPeriod && !inPrevPeriod) {
            throw new common_1.BadRequestException("Transaction date must be within current month or previous month");
        }
    }
    async applyCarryForwardDelta(payment, previousPendingAmount, newPendingAmount) {
        const delta = newPendingAmount - previousPendingAmount;
        if (delta === 0) {
            return;
        }
        const monthDate = new Date(`${payment.month}-01T00:00:00.000Z`);
        const nextMonth = this.monthKey(this.addMonths(monthDate, 1));
        const nextPayment = await this.prisma.payment.findFirst({
            where: {
                userId: payment.userId,
                bookingId: payment.bookingId,
                month: nextMonth,
                type: "RENT",
            },
            orderBy: { createdAt: "desc" },
        });
        if (nextPayment) {
            const existingAmount = Number(nextPayment.amount ?? 0);
            const existingRentAmount = Number(nextPayment.rentAmount ?? nextPayment.amount ?? 0);
            await this.prisma.payment.update({
                where: { id: nextPayment.id },
                data: {
                    amount: new library_1.Decimal(Math.max(0, existingAmount + delta)),
                    rentAmount: new library_1.Decimal(Math.max(0, existingRentAmount + delta)),
                    description: "Includes previous month pending balance",
                },
            });
            return;
        }
        const booking = await this.prisma.booking.findUnique({
            where: { id: payment.bookingId || "" },
            include: { room: true },
        });
        if (!booking) {
            return;
        }
        const baseRent = Number(booking.rentAmount ?? booking.room?.rent ?? 0);
        const nextAmount = Math.max(0, baseRent + newPendingAmount);
        await this.prisma.payment.create({
            data: {
                userId: payment.userId,
                tenantId: payment.userId,
                roomId: booking.roomId,
                bookingId: booking.id,
                month: nextMonth,
                amount: new library_1.Decimal(nextAmount),
                rentAmount: new library_1.Decimal(nextAmount),
                paidAmount: new library_1.Decimal(0),
                amountPaid: new library_1.Decimal(0),
                pendingAmount: new library_1.Decimal(0),
                borrowedAmount: new library_1.Decimal(0),
                type: "RENT",
                status: "PENDING",
                paymentMethod: "ONLINE",
                description: "Includes previous month pending balance",
            },
        });
    }
    async settlePayment(payment, userId, amount, paymentMethod, metadata) {
        const expectedAmount = Number(payment.rentAmount ?? payment.amount ?? 0);
        const paidAmount = Math.max(0, Number(amount || 0));
        if (paidAmount <= 0) {
            throw new common_1.BadRequestException("Amount must be greater than zero");
        }
        if (paidAmount > expectedAmount) {
            throw new common_1.BadRequestException("Amount cannot exceed expected rent");
        }
        const previousPendingAmount = Number(payment.pendingAmount ?? 0);
        const newPendingAmount = Math.max(0, expectedAmount - paidAmount);
        const completed = newPendingAmount === 0;
        const updated = await this.prisma.payment.update({
            where: { id: payment.id },
            data: {
                paidAmount: new library_1.Decimal(paidAmount),
                amountPaid: new library_1.Decimal(paidAmount),
                pendingAmount: new library_1.Decimal(newPendingAmount),
                borrowedAmount: new library_1.Decimal(newPendingAmount),
                paymentMethod: paymentMethod,
                status: completed
                    ? "COMPLETED"
                    : paidAmount > 0
                        ? "PARTIAL"
                        : "PENDING",
                transactionId: metadata?.transactionId,
                screenshotUrl: metadata?.screenshotUrl,
                transactionDate: metadata?.transactionDate,
                description: metadata?.description ?? payment.description,
                gatewayPaymentId: paymentMethod === "ONLINE"
                    ? `UPI-${metadata?.transactionId || Date.now()}`
                    : `CASH-${Date.now()}`,
            },
        });
        await this.applyCarryForwardDelta(payment, previousPendingAmount, newPendingAmount);
        if (completed && payment.bookingId) {
            await this.checkAndApproveBooking(payment.bookingId);
        }
        if (completed) {
            await this.notificationsService.create(userId, {
                type: "PAYMENT",
                title: "Payment Received",
                message: `Your payment of Rs ${paidAmount} has been received and verified. Thank you!`,
            });
        }
        else if (paidAmount > 0) {
            await this.notificationsService.create(userId, {
                type: "PAYMENT",
                title: "Partial Payment Received",
                message: `Partial payment of Rs ${paidAmount} received. Pending: Rs ${newPendingAmount}`,
            });
        }
        this.eventEmitter.emitPaymentUpdated(userId, payment.id, completed ? "PAID" : "PENDING", {
            amount: paidAmount,
            pendingAmount: newPendingAmount,
            method: paymentMethod,
        });
        this.eventEmitter.emitDashboardUpdate(userId, { paymentUpdated: true });
        return this.toPresentation(updated);
    }
    async checkAndApproveBooking(bookingId) {
        const booking = await this.prisma.booking.findUnique({
            where: { id: bookingId },
            include: { user: true, room: true },
        });
        if (!booking || booking.status !== "APPROVED_PENDING_PAYMENT") {
            return;
        }
        const mandatoryPayments = await this.prisma.payment.findMany({
            where: {
                bookingId,
                type: { in: ["DEPOSIT", "RENT"] },
            },
            orderBy: { createdAt: "asc" },
        });
        const deposit = mandatoryPayments.find(p => p.type === "DEPOSIT");
        const firstRent = mandatoryPayments.find(p => p.type === "RENT");
        const depositPaid = !deposit || deposit.status === "COMPLETED";
        const rentPaid = !firstRent || firstRent.status === "COMPLETED";
        if (depositPaid && rentPaid && (deposit || firstRent)) {
            await this.prisma.booking.update({
                where: { id: bookingId },
                data: { status: "APPROVED" },
            });
            await this.prisma.room.update({
                where: { id: booking.roomId },
                data: {
                    status: "OCCUPIED",
                    isAvailable: false,
                    occupiedFrom: booking.moveInDate || booking.startDate,
                    occupiedUntil: booking.moveOutDate || booking.checkoutDate || booking.endDate,
                },
            });
            await this.prisma.user.update({
                where: { id: booking.userId },
                data: { accountStatus: "ACTIVE" },
            });
            await this.prisma.bookingStatusHistory.create({
                data: {
                    bookingId,
                    status: "APPROVED",
                    comment: "Booking fully approved after mandatory payments confirmed.",
                },
            });
            console.log(`[Agreement] (Payments) Generating rental agreement for booking ${bookingId}...`);
            try {
                const agreementUrl = await this.agreementsService.generateRentalAgreement(bookingId);
                console.log(`[Agreement] (Payments) Rental agreement generated for booking ${bookingId}: ${agreementUrl}`);
            }
            catch (error) {
                console.error(`[Agreement] (Payments) Failed to generate rental agreement for booking ${bookingId}:`, error?.message || error);
            }
            await this.notificationsService.create(booking.userId, {
                type: "PUSH",
                title: "Welcome Home!",
                message: "Your initial payments are confirmed. Your room is now ready for move-in.",
            });
            this.eventEmitter.emitBookingUpdated(booking.userId, bookingId, "APPROVED", {
                roomId: booking.roomId,
                comment: "Mandatory payments settled.",
            });
            this.eventEmitter.emitDashboardUpdate(booking.userId, {
                bookingUpdated: true,
                status: "APPROVED",
            });
        }
    }
    async pay(userId, data) {
        if (!data || !data.paymentId) {
            throw new common_1.BadRequestException("paymentId is required");
        }
        const payment = await this.prisma.payment.findFirst({
            where: { id: data.paymentId, userId },
        });
        if (!payment) {
            throw new common_1.NotFoundException("Payment not found");
        }
        return this.settlePayment(payment, userId, data.amount, "ONLINE");
    }
    async submitOnlinePayment(userId, paymentId, data) {
        const payment = await this.prisma.payment.findFirst({
            where: { id: paymentId, userId },
        });
        if (!payment) {
            throw new common_1.NotFoundException("Payment not found");
        }
        this.validateTransactionId(data.transactionId);
        const transactionDate = data.transactionDate
            ? new Date(data.transactionDate)
            : new Date();
        if (Number.isNaN(transactionDate.getTime())) {
            throw new common_1.BadRequestException("Invalid transaction date");
        }
        this.validatePaymentDateWithinPeriod(payment.month, transactionDate);
        return this.settlePayment(payment, userId, data.amount, "ONLINE", {
            transactionId: data.transactionId,
            screenshotUrl: data.screenshotUrl,
            transactionDate,
        });
    }
    async submitCashPayment(userId, paymentId, data) {
        const payment = await this.prisma.payment.findFirst({
            where: { id: paymentId, userId },
        });
        if (!payment) {
            throw new common_1.NotFoundException("Payment not found");
        }
        const updated = await this.prisma.payment.update({
            where: { id: paymentId },
            data: {
                paymentMethod: "CASH",
                status: "PENDING",
                description: data.description ||
                    "Cash payment selected by tenant. Awaiting admin confirmation.",
            },
        });
        this.eventEmitter.emitDashboardUpdate(userId, { paymentUpdated: true });
        return this.toPresentation(updated);
    }
    async adminMarkCashPayment(paymentId, amountReceived, adminNote, paymentMethod = "CASH") {
        const payment = await this.prisma.payment.findUnique({
            where: { id: paymentId },
        });
        if (!payment) {
            throw new common_1.NotFoundException("Payment not found");
        }
        return this.settlePayment(payment, payment.userId, amountReceived, paymentMethod, {
            description: adminNote || `Payment verified by admin via ${paymentMethod}`,
        });
    }
    async getPaymentSummary(userId) {
        await this.ensureCurrentWorkflow(userId).catch(() => null);
        const now = new Date();
        const currentMonth = this.monthKey(now);
        const nextMonth = this.monthKey(this.addMonths(now, 1));
        const [currentPayment, nextPayment, depositDue] = await Promise.all([
            this.prisma.payment.findFirst({
                where: {
                    userId,
                    type: "RENT",
                    month: currentMonth,
                },
                orderBy: { createdAt: "desc" },
            }),
            this.prisma.payment.findFirst({
                where: {
                    userId,
                    type: "RENT",
                    month: nextMonth,
                },
                orderBy: { createdAt: "desc" },
            }),
            this.prisma.payment.findFirst({
                where: {
                    userId,
                    type: "DEPOSIT",
                    status: "PENDING",
                },
                orderBy: { createdAt: "desc" },
            }),
        ]);
        const approvedBooking = await this.getActiveApprovedBooking(userId);
        const baseRent = approvedBooking ? Number(approvedBooking.rentAmount ?? approvedBooking.room.rent ?? 0) : 0;
        const currentMonthRent = currentPayment
            ? Number(currentPayment.rentAmount ?? currentPayment.amount ?? 0)
            : baseRent;
        const pendingAmount = currentPayment
            ? Number(currentPayment.pendingAmount ?? currentPayment.borrowedAmount ?? 0)
            : 0;
        const nextMonthRent = nextPayment
            ? Number(nextPayment.rentAmount ?? nextPayment.amount ?? 0)
            : baseRent + pendingAmount;
        return {
            currentMonthRent,
            pendingAmount,
            nextMonthRent,
            baseRent,
            currentMonth,
            nextMonth,
            depositDue: depositDue
                ? {
                    paymentId: depositDue.id,
                    amount: Number(depositDue.rentAmount ?? depositDue.amount ?? 0),
                    status: "PENDING",
                }
                : null,
        };
    }
    async processPaymentScreenshot(userId, paymentId, file) {
        const payment = await this.prisma.payment.findFirst({
            where: { id: paymentId, userId },
        });
        if (!payment) {
            throw new common_1.NotFoundException("Payment record not found");
        }
        const fs = require('fs');
        const path = require('path');
        const fileName = `${paymentId}-${Date.now()}${path.extname(file.originalname)}`;
        const uploadPath = path.join('uploads', 'payments', fileName);
        if (!fs.existsSync(path.join('uploads', 'payments'))) {
            fs.mkdirSync(path.join('uploads', 'payments'), { recursive: true });
        }
        fs.writeFileSync(uploadPath, file.buffer);
        const screenshotUrl = `/uploads/payments/${fileName}`;
        let extracted;
        try {
            if (file.mimetype === "application/pdf") {
                extracted = await this.ocrService.extractFromPdf(file.buffer);
            }
            else if (file.mimetype.startsWith("image/")) {
                extracted = await this.ocrService.extractFromImage(file.buffer);
            }
            else {
                throw new common_1.BadRequestException("Unsupported file type");
            }
        }
        catch (err) {
            await this.prisma.payment.update({
                where: { id: paymentId },
                data: {
                    status: "NEEDS_REVIEW",
                    screenshotUrl,
                    description: `OCR processing failed: ${err.message}. Awaiting admin review.`,
                },
            });
            return { success: false, message: "OCR failed. Submitted for review.", screenshotUrl };
        }
        const { amount, transactionId, date, upiId } = extracted;
        if (!amount || !transactionId || !date) {
            await this.prisma.payment.update({
                where: { id: paymentId },
                data: {
                    status: "NEEDS_REVIEW",
                    screenshotUrl,
                    description: `OCR partial extract. Missing: ${!amount ? 'Amount ' : ''}${!transactionId ? 'TxnID ' : ''}${!date ? 'Date' : ''}. Awaiting admin review.`,
                    transactionId: transactionId || undefined,
                    transactionDate: date || undefined,
                    amountPaid: amount ? new library_1.Decimal(amount) : undefined,
                },
            });
            return {
                success: false,
                message: "OCR partial extraction. Submitted for review.",
                extracted,
                screenshotUrl
            };
        }
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const transMonth = date.getMonth();
        const transYear = date.getFullYear();
        const isCurrentMonth = transMonth === currentMonth && transYear === currentYear;
        const isPrevMonth = (transMonth === currentMonth - 1 && transYear === currentYear) ||
            (currentMonth === 0 && transMonth === 11 && transYear === currentYear - 1);
        if (!isCurrentMonth && !isPrevMonth) {
            await this.prisma.payment.update({
                where: { id: paymentId },
                data: {
                    status: "NEEDS_REVIEW",
                    screenshotUrl,
                    description: `Transaction date (${date.toDateString()}) is outside valid period. Awaiting admin review.`,
                    transactionId,
                    transactionDate: date,
                    amountPaid: new library_1.Decimal(amount),
                },
            });
            return { success: false, message: "Transaction date invalid. Submitted for review.", date, screenshotUrl };
        }
        return this.settlePayment(payment, userId, amount, "ONLINE", {
            transactionId,
            transactionDate: date,
            screenshotUrl,
            description: `Auto-verified via screenshot. Extracted UPI: ${upiId || "N/A"}`,
        });
    }
    async uploadScreenshot(paymentId, screenshotUrl, file) {
        const payment = await this.prisma.payment.findUnique({
            where: { id: paymentId },
        });
        if (!payment) {
            throw new common_1.BadRequestException("Payment not found");
        }
        let finalScreenshotUrl = screenshotUrl;
        if (!screenshotUrl.startsWith('http')) {
            if (!file) {
                throw new common_1.BadRequestException("File is required");
            }
            const allowedMimeTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
            if (!allowedMimeTypes.includes(file.mimetype)) {
                throw new common_1.BadRequestException("Invalid file type. Only jpg, png, and pdf are allowed");
            }
            const maxSize = 10 * 1024 * 1024;
            if (file.size > maxSize) {
                throw new common_1.BadRequestException("File too large. Maximum size is 10MB");
            }
            const fs = require("fs");
            const path = require("path");
            const fileName = `${paymentId}-${Date.now()}${path.extname(file.originalname)}`;
            const uploadDir = path.join(process.cwd(), "uploads", "payments");
            const uploadPath = path.join(uploadDir, fileName);
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }
            fs.writeFileSync(uploadPath, file.buffer);
            finalScreenshotUrl = `/uploads/payments/${fileName}`;
        }
        let extractedData = null;
        let paymentDate = null;
        let amountPaid = 0;
        let transactionId = null;
        try {
            const ocrService = new (require("../../common/services/ocr.service").OcrService)();
            if (file && file.mimetype === "application/pdf") {
                extractedData = await ocrService.extractFromPdf(file.buffer);
            }
            else if (file) {
                extractedData = await ocrService.extractFromImage(file.buffer);
            }
            if (extractedData) {
                transactionId = extractedData.transactionId || null;
                amountPaid = extractedData.amount || 0;
                paymentDate = extractedData.date || null;
            }
        }
        catch (ocrError) {
            console.error("OCR extraction failed:", ocrError);
        }
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const previousMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        if (paymentDate) {
            const paymentMonth = paymentDate.getMonth();
            const paymentYear = paymentDate.getFullYear();
            const isCurrentMonth = paymentMonth === currentMonth && paymentYear === currentYear;
            const isPreviousMonth = paymentMonth === previousMonth && paymentYear === previousMonthYear;
            if (!isCurrentMonth && !isPreviousMonth) {
                throw new common_1.BadRequestException("Payment older than expected. Payment date must be from current or previous month");
            }
        }
        const rentAmount = Number(payment.rentAmount || payment.amount || 0);
        let remainingAmount = 0;
        let paymentStatus = "PENDING";
        if (amountPaid > 0) {
            if (amountPaid >= rentAmount) {
                remainingAmount = 0;
                paymentStatus = "COMPLETED";
            }
            else {
                remainingAmount = rentAmount - amountPaid;
                paymentStatus = "PENDING";
            }
        }
        const updatedPayment = await this.prisma.payment.update({
            where: { id: paymentId },
            data: {
                screenshotUrl: finalScreenshotUrl,
                transactionId,
                transactionDate: paymentDate,
                amountPaid: amountPaid > 0 ? amountPaid : undefined,
                pendingAmount: remainingAmount > 0 ? remainingAmount : undefined,
                borrowedAmount: remainingAmount > 0 ? remainingAmount : undefined,
                status: paymentStatus,
                description: extractedData
                    ? `Screenshot verified. Amount: ₹${amountPaid}, Txn: ${transactionId || "N/A"}`
                    : "Screenshot uploaded. Awaiting verification.",
            },
        });
        return updatedPayment;
    }
    async getInvoice(id) {
        const payment = await this.prisma.payment.findUnique({
            where: { id },
            include: {
                user: true,
                booking: { include: { room: true } },
            },
        });
        if (!payment) {
            throw new common_1.NotFoundException("Payment not found");
        }
        return {
            invoiceId: payment.id,
            date: payment.createdAt,
            tenantName: `${payment.user.firstName} ${payment.user.lastName}`,
            amount: Number(payment.amount),
            status: payment.status,
            billingPeriod: payment.month,
            roomDetails: payment.booking?.room,
        };
    }
    async approvePayment(paymentId, adminId) {
        const payment = await this.prisma.payment.findUnique({
            where: { id: paymentId },
            include: { user: true, booking: { include: { room: true } } },
        });
        if (!payment) {
            throw new common_1.NotFoundException("Payment not found");
        }
        const rentAmount = Number(payment.rentAmount || payment.amount || 0);
        const paidAmount = Number(payment.amountPaid || 0);
        let newStatus = "COMPLETED";
        let remainingAmount = 0;
        if (paidAmount < rentAmount) {
            newStatus = "PARTIAL";
            remainingAmount = rentAmount - paidAmount;
        }
        else {
            remainingAmount = 0;
        }
        const updatedPayment = await this.prisma.payment.update({
            where: { id: paymentId },
            data: {
                status: newStatus,
                pendingAmount: remainingAmount,
                borrowedAmount: remainingAmount,
                description: `Payment verified by admin. Status: ${newStatus}`,
            },
        });
        return {
            success: true,
            message: "Payment verified successfully",
            payment: updatedPayment,
        };
    }
    async rejectPayment(paymentId, adminId, reason) {
        const payment = await this.prisma.payment.findUnique({
            where: { id: paymentId },
        });
        if (!payment) {
            throw new common_1.NotFoundException("Payment not found");
        }
        const updatedPayment = await this.prisma.payment.update({
            where: { id: paymentId },
            data: {
                status: "REJECTED",
                description: reason || "Payment rejected by admin. Please upload a valid payment screenshot.",
            },
        });
        return {
            success: true,
            message: "Payment rejected. Please upload a valid payment screenshot.",
            payment: updatedPayment,
        };
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        event_emitter_service_1.EventEmitterService,
        notifications_service_1.NotificationsService,
        agreements_service_1.AgreementsService,
        ocr_service_1.OcrService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map