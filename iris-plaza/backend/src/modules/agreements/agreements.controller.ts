import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Res,
  HttpStatus,
  Request,
} from "@nestjs/common";
import * as https from "https";
import * as fs from "fs";
import { Response } from "express";
import * as path from "path";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { AgreementsService } from "./agreements.service";
import { JwtAuthGuard } from "@/modules/auth/guards/jwt-auth.guard";
import { RolesGuard } from "@/common/guards/roles.guard";
import { Roles } from "@/common/decorators/roles.decorator";

@ApiTags("Agreements")
@Controller("agreements")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AgreementsController {
  constructor(private agreementsService: AgreementsService) {}

  @Get("my")
  @ApiOperation({ summary: "Get current user's agreement" })
  async getMyAgreement(@Request() req: any) {
    const userId = req.user?.id || req.user?.sub;
    if (!userId) {
      return { agreement: null };
    }
    const agreement = await this.agreementsService.findMyAgreement(userId);
    return { agreement };
  }

  @Get("booking/:bookingId")
  @ApiOperation({ summary: "Get agreement by booking ID" })
  async findByBooking(@Param("bookingId") bookingId: string) {
    console.log(`[Controller] GET /agreements/booking/${bookingId}`);
    return this.agreementsService.findByBooking(bookingId);
  }

  @Post("booking/:bookingId/sign")
  @ApiOperation({ summary: "Sign agreement as tenant" })
  async signAsTenant(
    @Param("bookingId") bookingId: string,
    @Body() body: { signature?: string },
  ) {
    return this.agreementsService.signAsTenant(bookingId, body.signature);
  }

  @Post("admin/booking/:bookingId/sign")
  @UseGuards(RolesGuard)
  @Roles("ADMIN")
  @ApiOperation({ summary: "Sign agreement as admin" })
  async signAsAdmin(
    @Param("bookingId") bookingId: string,
    @Body() body: { signature?: string },
  ) {
    return this.agreementsService.signAsAdmin(bookingId, body.signature);
  }

  @Get("booking/:bookingId/download")
  @ApiOperation({ summary: "Download agreement DOCX" })
  async downloadAgreement(
    @Param("bookingId") bookingId: string,
    @Res() res: Response,
  ) {
    const agreement = await this.agreementsService.findByBooking(bookingId);
    
    if (!agreement || !agreement.agreementUrl) {
      return res.status(HttpStatus.NOT_FOUND).json({ message: "Agreement not found" });
    }
    
    const isCloudinary = agreement.agreementUrl.startsWith("http");
    
    // Use application/vnd.openxmlformats-officedocument.wordprocessingml.document for DOCX
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
    } else {
      return res.status(HttpStatus.NOT_FOUND).json({ message: "File not found" });
    }
  }

  @Get("view/:bookingId")
  @ApiOperation({ summary: "View agreement in browser (view-only, no download)" })
  async viewAgreement(
    @Param("bookingId") bookingId: string,
    @Request() req: any,
    @Res() res: Response,
  ) {
    // Get the logged-in user ID from JWT
    const userId = req.user?.id || req.user?.sub;
    
    if (!userId) {
      return res.status(HttpStatus.UNAUTHORIZED).json({ message: "Unauthorized" });
    }
    
    // Verify ownership - the user must be the tenant who made the booking
    const agreement = await this.agreementsService.findByBookingWithUser(bookingId);
    
    if (!agreement || !agreement.agreementUrl) {
      return res.status(HttpStatus.NOT_FOUND).json({ message: "Agreement not found" });
    }
    
    // Check if the logged-in user is the tenant who owns this booking
    if (agreement.booking?.userId !== userId) {
      // Also check if user is admin
      const isAdmin = req.user?.role === 'ADMIN' || req.user?.roles?.includes('ADMIN');
      if (!isAdmin) {
        return res.status(HttpStatus.FORBIDDEN).json({ message: "You don't have permission to view this agreement" });
      }
    }
    
    const isCloudinary = agreement.agreementUrl.startsWith("http");

    // Set headers for DOCX viewing - browser may download instead of view
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Content-Disposition', 'attachment'); // Download instead of trying to view
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
    } else {
      return res.status(HttpStatus.NOT_FOUND).json({ message: "File not found" });
    }
  }
}
