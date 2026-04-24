import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Decimal } from "@prisma/client/runtime/library";
import { PrismaService } from "@/prisma/prisma.service";
import { EventEmitterService } from "@/common/services/event-emitter.service";
import { NotificationsService } from "@/modules/notifications/notifications.service";
import { AgreementsService } from "@/modules/agreements/agreements.service";
import { CreatePaymentDto } from "./dto/create-payment.dto";
import { OcrService, ExtractedPaymentData } from "@/common/services/ocr.service";

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitterService,
    private notificationsService: NotificationsService,
    private agreementsService: AgreementsService,
    private ocrService: OcrService,
  ) {}

  private roomSafeSelect = {
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
    // Management fields
    managementRent: true,
    managementStatus: true,
    managementIsAvailable: true,
    managementOccupiedUntil: true,
    media: { orderBy: { createdAt: "asc" as const } },
  };

  private monthKey(date: Date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  }

  private parseMonthKey(month: string) {
    const [yearStr, monthStr] = String(month || "").split("-");
    const year = Number(yearStr);
    const monthNum = Number(monthStr);
    if (!Number.isFinite(year) || !Number.isFinite(monthNum)) {
      throw new BadRequestException("Invalid payment month");
    }
    return { year, month: monthNum };
  }

  private addMonths(date: Date, months: number) {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    return d;
  }

  private getDueDateForMonth(year: number, month: number, anchorDay: number) {
    const lastDay = new Date(year, month, 0).getDate();
    return new Date(year, month - 1, Math.min(anchorDay, lastDay));
  }

  private getFirstRentDueDate(moveInDate: Date) {
    const firstCycleMonth = this.addMonths(
      new Date(moveInDate.getFullYear(), moveInDate.getMonth(), 1),
      1,
    );
    return this.getDueDateForMonth(
      firstCycleMonth.getFullYear(),
      firstCycleMonth.getMonth() + 1,
      moveInDate.getDate(),
    );
  }

  private async getActiveApprovedBooking(userId: string) {
    return this.prisma.booking.findFirst({
      where: { userId, status: { in: ["APPROVED", "APPROVED_PENDING_PAYMENT"] } },
      include: { room: { select: this.roomSafeSelect } },
      orderBy: { createdAt: "desc" },
    });
  }

  private async notifyRentDue(userId: string, month: string, amount: number) {
    await this.notificationsService.create(userId, {
      type: "PUSH" as any,
      title: "Monthly Rent Due",
      message: `Rent for ${month} is due. Amount: ${amount}`,
    });
  }

  private async ensureRentEntriesForBooking(booking: any) {
    const moveInDate = booking.moveInDate ?? booking.startDate;
    if (!moveInDate) {
      return;
    }

    const now = new Date();
    const firstDue = this.getFirstRentDueDate(moveInDate);
    if (firstDue > now) {
      return;
    }

    const baseRent = Number((booking as any).rentAmount ?? booking.room?.rent ?? 0);
    let cursor = new Date(firstDue);

    while (cursor <= now) {
      const month = this.monthKey(cursor);
      const existing = await this.prisma.payment.findFirst({
        where: {
          userId: booking.userId,
          bookingId: booking.id,
          type: "RENT" as any,
          month,
        } as any,
      });

      if (!existing) {
        const previousMonth = this.monthKey(this.addMonths(cursor, -1));
        const previousPayment = await this.prisma.payment.findFirst({
          where: {
            userId: booking.userId,
            bookingId: booking.id,
            type: "RENT" as any,
            month: previousMonth,
          } as any,
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
            amount: new Decimal(expectedAmount),
            rentAmount: new Decimal(expectedAmount),
            paidAmount: new Decimal(0),
            amountPaid: new Decimal(0),
            pendingAmount: new Decimal(0),
            borrowedAmount: new Decimal(0),
            type: "RENT" as any,
            status: "PENDING" as any,
            paymentMethod: "ONLINE" as any,
            description: `Auto-generated rent for ${month}`,
          } as any,
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

  private async ensureCurrentWorkflow(userId: string) {
    const booking = await this.getActiveApprovedBooking(userId);
    if (!booking) {
      return null;
    }

    await this.ensureRentEntriesForBooking(booking);
    return booking;
  }

  private toPresentation(payment: any) {
    return {
      ...payment,
      tenantId: payment.tenantId ?? payment.userId,
      rentAmount: Number(payment.rentAmount ?? payment.amount ?? 0),
      paidAmount:
        payment.paidAmount === null || payment.paidAmount === undefined
          ? null
          : Number(payment.paidAmount),
      pendingAmount: Number(payment.pendingAmount ?? payment.borrowedAmount ?? 0),
      status: payment.status === "COMPLETED" ? "PAID" : payment.status,
    };
  }

  async findMyPayments(userId: string) {
    await this.ensureCurrentWorkflow(userId).catch(() => null);

    const payments = await this.prisma.payment.findMany({
      where: { 
        userId,
        booking: {
          status: {
            in: ["APPROVED", "APPROVED_PENDING_PAYMENT"] as any
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
      } as any,
      orderBy: { createdAt: "desc" },
    });

    return payments.map((p) => this.toPresentation(p));
  }

  async findOne(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: { user: true, booking: true, rentCycle: true },
    });
    if (!payment) throw new NotFoundException("Payment not found");
    return this.toPresentation(payment);
  }

  async create(userId: string, dto: CreatePaymentDto) {
    const month = this.monthKey(new Date());
    const created = await this.prisma.payment.create({
      data: {
        type: dto.type as any,
        amount: new Decimal(dto.amount),
        bookingId: dto.bookingId,
        rentCycleId: dto.rentCycleId,
        description: dto.description,
        userId,
        tenantId: userId,
        month,
        gateway: "RAZORPAY",
      } as any,
    });
    return this.toPresentation(created);
  }

  async updateStatus(id: string, status: string, gatewayPaymentId?: string) {
    const normalized = String(status || "").toUpperCase();
    return this.prisma.payment.update({
      where: { id },
      data: {
        status: normalized === "PAID" ? "COMPLETED" : (normalized as any),
        gatewayPaymentId,
      },
    });
  }

  async handleWebhook(data: any) {
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
      } as any,
      orderBy: { createdAt: "desc" },
    });

    return payments.map((p) => this.toPresentation(p));
  }

  private validateTransactionId(transactionId: string) {
    const valid = /^[A-Za-z0-9_-]{8,40}$/.test(String(transactionId || ""));
    if (!valid) {
      throw new BadRequestException("Invalid transaction id format");
    }
  }

  private validatePaymentDateWithinPeriod(month: string, transactionDate: Date) {
    const { year, month: monthNum } = this.parseMonthKey(month);
    
    // Allow current month and previous month
    const currentPeriodStart = new Date(year, monthNum - 1, 1, 0, 0, 0, 0);
    const currentPeriodEnd = new Date(year, monthNum, 0, 23, 59, 59, 999);
    
    const prevMonth = monthNum === 1 ? 12 : monthNum - 1;
    const prevYear = monthNum === 1 ? year - 1 : year;
    const prevPeriodStart = new Date(prevYear, prevMonth - 1, 1, 0, 0, 0, 0);
    const prevPeriodEnd = new Date(prevYear, prevMonth, 0, 23, 59, 59, 999);
    
    const inCurrentPeriod = transactionDate >= currentPeriodStart && transactionDate <= currentPeriodEnd;
    const inPrevPeriod = transactionDate >= prevPeriodStart && transactionDate <= prevPeriodEnd;
    
    if (!inCurrentPeriod && !inPrevPeriod) {
      throw new BadRequestException("Transaction date must be within current month or previous month");
    }
  }

  private async applyCarryForwardDelta(
    payment: any,
    previousPendingAmount: number,
    newPendingAmount: number,
  ) {
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
        type: "RENT" as any,
      } as any,
      orderBy: { createdAt: "desc" },
    });

    if (nextPayment) {
      const existingAmount = Number(nextPayment.amount ?? 0);
      const existingRentAmount = Number(nextPayment.rentAmount ?? nextPayment.amount ?? 0);
      await this.prisma.payment.update({
        where: { id: nextPayment.id },
        data: {
          amount: new Decimal(Math.max(0, existingAmount + delta)),
          rentAmount: new Decimal(Math.max(0, existingRentAmount + delta)),
          description: "Includes previous month pending balance",
        } as any,
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

    const baseRent = Number((booking as any).rentAmount ?? booking.room?.rent ?? 0);
    const nextAmount = Math.max(0, baseRent + newPendingAmount);
    await this.prisma.payment.create({
      data: {
        userId: payment.userId,
        tenantId: payment.userId,
        roomId: booking.roomId,
        bookingId: booking.id,
        month: nextMonth,
        amount: new Decimal(nextAmount),
        rentAmount: new Decimal(nextAmount),
        paidAmount: new Decimal(0),
        amountPaid: new Decimal(0),
        pendingAmount: new Decimal(0),
        borrowedAmount: new Decimal(0),
        type: "RENT" as any,
        status: "PENDING" as any,
        paymentMethod: "ONLINE" as any,
        description: "Includes previous month pending balance",
      } as any,
    });
  }

  private async settlePayment(
    payment: any,
    userId: string,
    amount: number,
    paymentMethod: "ONLINE" | "CASH",
    metadata?: {
      transactionId?: string;
      screenshotUrl?: string;
      transactionDate?: Date;
      description?: string;
    },
  ) {
    const expectedAmount = Number(payment.rentAmount ?? payment.amount ?? 0);
    const paidAmount = Math.max(0, Number(amount || 0));

    if (paidAmount <= 0) {
      throw new BadRequestException("Amount must be greater than zero");
    }

    if (paidAmount > expectedAmount) {
      throw new BadRequestException("Amount cannot exceed expected rent");
    }

    const previousPendingAmount = Number(payment.pendingAmount ?? 0);
    const newPendingAmount = Math.max(0, expectedAmount - paidAmount);
    const completed = newPendingAmount === 0;

    const updated = await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        paidAmount: new Decimal(paidAmount),
        amountPaid: new Decimal(paidAmount),
        pendingAmount: new Decimal(newPendingAmount),
        borrowedAmount: new Decimal(newPendingAmount),
        paymentMethod: paymentMethod as any,
        status: completed
          ? ("COMPLETED" as any)
          : paidAmount > 0
            ? ("PARTIAL" as any)
            : ("PENDING" as any),
        transactionId: metadata?.transactionId,
        screenshotUrl: metadata?.screenshotUrl,
        transactionDate: metadata?.transactionDate,
        description: metadata?.description ?? payment.description,
        gatewayPaymentId:
          paymentMethod === "ONLINE"
            ? `UPI-${metadata?.transactionId || Date.now()}`
            : `CASH-${Date.now()}`,
      } as any,
    });

    await this.applyCarryForwardDelta(payment, previousPendingAmount, newPendingAmount);

    if (completed && payment.bookingId) {
      // Check if this booking can be fully approved now
      await this.checkAndApproveBooking(payment.bookingId);
    }

    // Send notification to tenant
    if (completed) {
      await this.notificationsService.create(userId, {
        type: "PAYMENT" as any,
        title: "Payment Received",
        message: `Your payment of Rs ${paidAmount} has been received and verified. Thank you!`,
      });
    } else if (paidAmount > 0) {
      await this.notificationsService.create(userId, {
        type: "PAYMENT" as any,
        title: "Partial Payment Received",
        message: `Partial payment of Rs ${paidAmount} received. Pending: Rs ${newPendingAmount}`,
      });
    }

    this.eventEmitter.emitPaymentUpdated(
      userId,
      payment.id,
      completed ? "PAID" : "PENDING",
      {
        amount: paidAmount,
        pendingAmount: newPendingAmount,
        method: paymentMethod,
      },
    );
    this.eventEmitter.emitDashboardUpdate(userId, { paymentUpdated: true });

    return this.toPresentation(updated);
  }

  private async checkAndApproveBooking(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { user: true, room: true },
    });

    if (!booking || (booking.status as any) !== "APPROVED_PENDING_PAYMENT") {
      return;
    }

    // Check if initial mandatory payments (DEPOSIT and the FIRST month RENT) are COMPLETED
    const mandatoryPayments = await this.prisma.payment.findMany({
      where: {
        bookingId,
        type: { in: ["DEPOSIT", "RENT"] as any },
      },
      orderBy: { createdAt: "asc" },
    });

    // We consider the deposit and the first rent record as mandatory for move-in
    const deposit = mandatoryPayments.find(p => (p.type as any) === "DEPOSIT");
    const firstRent = mandatoryPayments.find(p => (p.type as any) === "RENT");

    const depositPaid = !deposit || deposit.status === "COMPLETED";
    const rentPaid = !firstRent || firstRent.status === "COMPLETED";

    if (depositPaid && rentPaid && (deposit || firstRent)) {
      // Transition booking to APPROVED
      await this.prisma.booking.update({
        where: { id: bookingId },
        data: { status: "APPROVED" as any },
      });

      // Set room status to OCCUPIED
      await this.prisma.room.update({
        where: { id: booking.roomId },
        data: {
          status: "OCCUPIED" as any,
          isAvailable: false,
          occupiedFrom: booking.moveInDate || booking.startDate,
          occupiedUntil: booking.moveOutDate || booking.checkoutDate || booking.endDate,
        },
      });

      // Activate User account
      await this.prisma.user.update({
        where: { id: booking.userId },
        data: { accountStatus: "ACTIVE" },
      });

      // Add status history
      await this.prisma.bookingStatusHistory.create({
        data: {
          bookingId,
          status: "APPROVED" as any,
          comment: "Booking fully approved after mandatory payments confirmed.",
        },
      });

      // Generate rental agreement after payment-based approval.
      // Keep this non-blocking so payment flow cannot fail due to document generation.
      console.log(`[Agreement] (Payments) Generating rental agreement for booking ${bookingId}...`);
      try {
        const agreementUrl = await this.agreementsService.generateRentalAgreement(bookingId);
        console.log(`[Agreement] (Payments) Rental agreement generated for booking ${bookingId}: ${agreementUrl}`);
      } catch (error: any) {
        console.error(
          `[Agreement] (Payments) Failed to generate rental agreement for booking ${bookingId}:`,
          error?.message || error,
        );
      }

      // Send notification
      await this.notificationsService.create(booking.userId, {
        type: "PUSH" as any,
        title: "Welcome Home!",
        message: "Your initial payments are confirmed. Your room is now ready for move-in.",
      });

      // Emit event
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

  async pay(userId: string, data: { paymentId: string; amount: number }) {
    if (!data || !data.paymentId) {
      throw new BadRequestException("paymentId is required");
    }
    const payment = await this.prisma.payment.findFirst({
      where: { id: data.paymentId, userId },
    });

    if (!payment) {
      throw new NotFoundException("Payment not found");
    }

    return this.settlePayment(payment, userId, data.amount, "ONLINE");
  }

  async submitOnlinePayment(
    userId: string,
    paymentId: string,
    data: {
      amount: number;
      transactionId: string;
      screenshotUrl: string;
      transactionDate?: string;
    },
  ) {
    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, userId },
    });

    if (!payment) {
      throw new NotFoundException("Payment not found");
    }

    this.validateTransactionId(data.transactionId);

    const transactionDate = data.transactionDate
      ? new Date(data.transactionDate)
      : new Date();
    if (Number.isNaN(transactionDate.getTime())) {
      throw new BadRequestException("Invalid transaction date");
    }

    this.validatePaymentDateWithinPeriod(payment.month, transactionDate);

    return this.settlePayment(payment, userId, data.amount, "ONLINE", {
      transactionId: data.transactionId,
      screenshotUrl: data.screenshotUrl,
      transactionDate,
    });
  }

  async submitCashPayment(
    userId: string,
    paymentId: string,
    data: { amount: number; description?: string },
  ) {
    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, userId },
    });

    if (!payment) {
      throw new NotFoundException("Payment not found");
    }
    const updated = await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        paymentMethod: "CASH" as any,
        status: "PENDING" as any,
        description:
          data.description ||
          "Cash payment selected by tenant. Awaiting admin confirmation.",
      } as any,
    });
    this.eventEmitter.emitDashboardUpdate(userId, { paymentUpdated: true });
    return this.toPresentation(updated);
  }

  async adminMarkCashPayment(
    paymentId: string,
    amountReceived: number,
    adminNote?: string,
    paymentMethod: "ONLINE" | "CASH" = "CASH",
  ) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException("Payment not found");
    }

    return this.settlePayment(payment, payment.userId, amountReceived, paymentMethod, {
      description: adminNote || `Payment verified by admin via ${paymentMethod}`,
    });
  }

  async getPaymentSummary(userId: string) {
    await this.ensureCurrentWorkflow(userId).catch(() => null);

    const now = new Date();
    const currentMonth = this.monthKey(now);
    const nextMonth = this.monthKey(this.addMonths(now, 1));

    const [currentPayment, nextPayment, depositDue] = await Promise.all([
      this.prisma.payment.findFirst({
        where: {
          userId,
          type: "RENT" as any,
          month: currentMonth,
        } as any,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.payment.findFirst({
        where: {
          userId,
          type: "RENT" as any,
          month: nextMonth,
        } as any,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.payment.findFirst({
        where: {
          userId,
          type: "DEPOSIT" as any,
          status: "PENDING" as any,
        } as any,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const approvedBooking = await this.getActiveApprovedBooking(userId);
    const baseRent = approvedBooking ? Number((approvedBooking as any).rentAmount ?? approvedBooking.room.rent ?? 0) : 0;

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

  async processPaymentScreenshot(
    userId: string,
    paymentId: string,
    file: Express.Multer.File,
  ) {
    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, userId },
    });

    if (!payment) {
      throw new NotFoundException("Payment record not found");
    }

    // Save file
    const fs = require('fs');
    const path = require('path');
    const fileName = `${paymentId}-${Date.now()}${path.extname(file.originalname)}`;
    const uploadPath = path.join('uploads', 'payments', fileName);

    // Ensure directory exists
    if (!fs.existsSync(path.join('uploads', 'payments'))) {
      fs.mkdirSync(path.join('uploads', 'payments'), { recursive: true });
    }

    fs.writeFileSync(uploadPath, file.buffer);
    const screenshotUrl = `/uploads/payments/${fileName}`;

    let extracted: ExtractedPaymentData;
    try {
      if (file.mimetype === "application/pdf") {
        extracted = await this.ocrService.extractFromPdf(file.buffer);
      } else if (file.mimetype.startsWith("image/")) {
        extracted = await this.ocrService.extractFromImage(file.buffer);
      } else {
        throw new BadRequestException("Unsupported file type");
      }
    } catch (err) {
      // Mark for manual review if OCR library fails
      await this.prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: "NEEDS_REVIEW" as any,
          screenshotUrl,
          description: `OCR processing failed: ${err.message}. Awaiting admin review.`,
        },
      });
      return { success: false, message: "OCR failed. Submitted for review.", screenshotUrl };
    }

    const { amount, transactionId, date, upiId } = extracted;

    // Check if key fields are missing
    if (!amount || !transactionId || !date) {
      await this.prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: "NEEDS_REVIEW" as any,
          screenshotUrl,
          description: `OCR partial extract. Missing: ${!amount ? 'Amount ' : ''}${!transactionId ? 'TxnID ' : ''}${!date ? 'Date' : ''}. Awaiting admin review.`,
          transactionId: transactionId || undefined,
          transactionDate: date || undefined,
          amountPaid: amount ? new Decimal(amount) : undefined,
        },
      });
      return {
        success: false,
        message: "OCR partial extraction. Submitted for review.",
        extracted,
        screenshotUrl
      };
    }

    // Validate Date (Current or Previous Month)
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const transMonth = date.getMonth();
    const transYear = date.getFullYear();

    const isCurrentMonth = transMonth === currentMonth && transYear === currentYear;
    const isPrevMonth = 
      (transMonth === currentMonth - 1 && transYear === currentYear) ||
      (currentMonth === 0 && transMonth === 11 && transYear === currentYear - 1);

    if (!isCurrentMonth && !isPrevMonth) {
      await this.prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: "NEEDS_REVIEW" as any,
          screenshotUrl,
          description: `Transaction date (${date.toDateString()}) is outside valid period. Awaiting admin review.`,
          transactionId,
          transactionDate: date,
          amountPaid: new Decimal(amount),
        },
      });
      return { success: false, message: "Transaction date invalid. Submitted for review.", date, screenshotUrl };
    }

    // Settle Payment
    return this.settlePayment(payment, userId, amount, "ONLINE", {
      transactionId,
      transactionDate: date,
      screenshotUrl,
      description: `Auto-verified via screenshot. Extracted UPI: ${upiId || "N/A"}`,
    });
  }

  async uploadScreenshot(paymentId: string, screenshotUrl: string, file?: Express.Multer.File) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new BadRequestException("Payment not found");
    }

    // If Cloudinary URL is provided, use it directly
    // Otherwise, fall back to local file handling (for backward compatibility)
    let finalScreenshotUrl = screenshotUrl;
    
    if (!screenshotUrl.startsWith('http')) {
      // Legacy local file handling
      if (!file) {
        throw new BadRequestException("File is required");
      }

      // Validate file type and size
      const allowedMimeTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
      if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new BadRequestException("Invalid file type. Only jpg, png, and pdf are allowed");
      }

      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        throw new BadRequestException("File too large. Maximum size is 10MB");
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

    // Use OCR to extract payment details from screenshot
    let extractedData: any = null;
    let paymentDate: Date | null = null;
    let amountPaid = 0;
    let transactionId: string | null = null;

    // Try OCR extraction only if we have the file buffer (not for Cloudinary uploads)
    try {
      const ocrService = new (require("../../common/services/ocr.service").OcrService)();
      
      if (file && file.mimetype === "application/pdf") {
        extractedData = await ocrService.extractFromPdf(file.buffer);
      } else if (file) {
        extractedData = await ocrService.extractFromImage(file.buffer);
      }

      if (extractedData) {
        transactionId = extractedData.transactionId || null;
        amountPaid = extractedData.amount || 0;
        paymentDate = extractedData.date || null;
      }
    } catch (ocrError) {
      console.error("OCR extraction failed:", ocrError);
      // Continue with manual verification
    }

    // Validate payment date
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
        throw new BadRequestException("Payment older than expected. Payment date must be from current or previous month");
      }
    }

    // Calculate remaining amount and status
    const rentAmount = Number(payment.rentAmount || payment.amount || 0);
    let remainingAmount = 0;
    let paymentStatus = "PENDING";

    if (amountPaid > 0) {
      if (amountPaid >= rentAmount) {
        // Full payment
        remainingAmount = 0;
        paymentStatus = "COMPLETED";
      } else {
        // Partial payment
        remainingAmount = rentAmount - amountPaid;
        paymentStatus = "PENDING"; // Will be marked as partial after admin verification
      }
    }

    // Update payment with extracted data
    const updatedPayment = await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        screenshotUrl: finalScreenshotUrl,
        transactionId,
        transactionDate: paymentDate,
        amountPaid: amountPaid > 0 ? amountPaid : undefined,
        pendingAmount: remainingAmount > 0 ? remainingAmount : undefined,
        borrowedAmount: remainingAmount > 0 ? remainingAmount : undefined,
        status: paymentStatus as any,
        description: extractedData 
          ? `Screenshot verified. Amount: ₹${amountPaid}, Txn: ${transactionId || "N/A"}`
          : "Screenshot uploaded. Awaiting verification.",
      },
    });

    return updatedPayment;
  }

  async getInvoice(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        user: true,
        booking: { include: { room: true } },
      },
    });

    if (!payment) {
      throw new NotFoundException("Payment not found");
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

  async approvePayment(paymentId: string, adminId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { user: true, booking: { include: { room: true } } },
    });

    if (!payment) {
      throw new NotFoundException("Payment not found");
    }

    const rentAmount = Number(payment.rentAmount || payment.amount || 0);
    const paidAmount = Number(payment.amountPaid || 0);
    let newStatus = "COMPLETED";
    let remainingAmount = 0;

    if (paidAmount < rentAmount) {
      newStatus = "PARTIAL";
      remainingAmount = rentAmount - paidAmount;
    } else {
      remainingAmount = 0;
    }

    const updatedPayment = await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: newStatus as any,
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

  async rejectPayment(paymentId: string, adminId: string, reason?: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException("Payment not found");
    }

    const updatedPayment = await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: "REJECTED" as any,
        description: reason || "Payment rejected by admin. Please upload a valid payment screenshot.",
      },
    });

    return {
      success: true,
      message: "Payment rejected. Please upload a valid payment screenshot.",
      payment: updatedPayment,
    };
  }
}
