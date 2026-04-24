import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { PaymentsService } from "./payments.service";
import { CreatePaymentDto } from "./dto/create-payment.dto";
import { OnlinePaymentDto, CashPaymentDto } from "./dto/pay-payment.dto";
import { JwtAuthGuard } from "@/modules/auth/guards/jwt-auth.guard";
import { RolesGuard } from "@/common/guards/roles.guard";
import { Roles } from "@/common/decorators/roles.decorator";
import { CloudinaryService } from "@/common/services/cloudinary.service";

@ApiTags("Payments")
@Controller("payments")
export class PaymentsController {
  constructor(
    private paymentsService: PaymentsService,
    private cloudinaryService: CloudinaryService,
  ) {}

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get my payments" })
  async getMyPayments(@Request() req: any) {
    return this.paymentsService.findMyPayments(req.user.userId);
  }

  @Get("my")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get my payments (alias)" })
  async getMyPaymentsAlias(@Request() req: any) {
    return this.paymentsService.findMyPayments(req.user.userId);
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get payment by ID" })
  async findOne(@Param("id") id: string) {
    return this.paymentsService.findOne(id);
  }

  @Get("invoice/:id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get payment invoice" })
  async getInvoice(@Param("id") id: string) {
    return this.paymentsService.getInvoice(id);
  }

  @Post("create")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a payment" })
  async create(@Request() req: any, @Body() dto: CreatePaymentDto) {
    return this.paymentsService.create(req.user.userId, dto);
  }

  @Post("pay")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Pay a tenant payment record" })
  async pay(
    @Request() req: any,
    @Body()
    body: {
      paymentId: string;
      amount: number;
    },
  ) {
    return this.paymentsService.pay(req.user.userId, body);
  }

  @Post(":paymentId/pay-online")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Submit online payment with screenshot verification",
  })
  async submitOnlinePayment(
    @Request() req: any,
    @Param("paymentId") paymentId: string,
    @Body() dto: OnlinePaymentDto,
  ) {
    return this.paymentsService.submitOnlinePayment(
      req.user.userId,
      paymentId,
      {
        amount: dto.amount,
        transactionId: dto.transactionId,
        screenshotUrl: dto.screenshotUrl,
        transactionDate: dto.transactionDate,
      },
    );
  }

  @Post(":paymentId/pay-cash")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Submit cash payment" })
  async submitCashPayment(
    @Request() req: any,
    @Param("paymentId") paymentId: string,
    @Body() dto: CashPaymentDto,
  ) {
    return this.paymentsService.submitCashPayment(req.user.userId, paymentId, {
      amount: dto.amount,
      description: dto.description,
    });
  }

  @Post("webhook")
  @ApiOperation({ summary: "Payment gateway webhook" })
  async handleWebhook(@Body() body: any) {
    return this.paymentsService.handleWebhook(body);
  }

  @Get("admin/all")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get all payments (Admin)" })
  async findAll() {
    return this.paymentsService.findAll();
  }

  @Patch("admin/:paymentId/mark-cash-paid")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Admin mark cash payment as received" })
  async adminMarkCashPaid(
    @Param("paymentId") paymentId: string,
    @Body() body: { amountReceived: number; note?: string },
  ) {
    return this.paymentsService.adminMarkCashPayment(
      paymentId,
      Number(body.amountReceived),
      body.note,
    );
  }

  @Patch("admin/:paymentId/approve")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Admin approve payment verification" })
  async approvePayment(
    @Param("paymentId") paymentId: string,
    @Request() req: any,
  ) {
    return this.paymentsService.approvePayment(paymentId, req.user.userId);
  }

  @Patch("admin/:paymentId/reject")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Admin reject payment verification" })
  async rejectPayment(
    @Param("paymentId") paymentId: string,
    @Body() body: { reason?: string },
    @Request() req: any,
  ) {
    return this.paymentsService.rejectPayment(paymentId, req.user.userId, body.reason);
  }

  @Get("summary")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get payment summary for tenant dashboard" })
  async getPaymentSummary(@Request() req: any) {
    return this.paymentsService.getPaymentSummary(req.user.userId);
  }

  @Post("upload-screenshot")
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor("file"))
  @ApiBearerAuth()
  @ApiOperation({ summary: "Upload payment screenshot for verification" })
  async uploadScreenshot(
    @UploadedFile() file: Express.Multer.File,
    @Body("paymentId") paymentId: string,
  ) {
    if (!file) {
      throw new BadRequestException("Screenshot file is required");
    }
    
    // Upload to Cloudinary
    const result = await this.cloudinaryService.uploadImage(file, "iris-plaza/payments");
    
    return this.paymentsService.uploadScreenshot(paymentId, result.secure_url, file);
  }
}
