import { Injectable, NotFoundException, Logger } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { Cron, CronExpression } from "@nestjs/schedule";
import { CloudinaryService } from "@/common/services/cloudinary.service";
import { NotificationsService } from "@/modules/notifications/notifications.service";
import { AgreementData, generateAgreementDocx, formatDate, calculateMonths, numberToWords } from "../../../templates/agreement-template.service";

@Injectable()
export class AgreementsService {
  private readonly logger = new Logger(AgreementsService.name);

  constructor(
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService,
    private notificationsService: NotificationsService,
  ) {}

  private toStartOfUtcDay(date: Date) {
    return new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );
  }

  async generateRentalAgreement(bookingId: string): Promise<string> {
    // Get booking with all required data including tenant profile
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
      throw new NotFoundException("Booking not found");
    }

    // Check if agreement already exists (we'll regenerate anyway)
    const existingAgreement = await this.prisma.agreement.findUnique({
      where: { bookingId },
    });

    if (existingAgreement) {
      console.log(`[Agreement] Existing agreement found for booking ${bookingId}, will regenerate with latest template`);
    } else {
      console.log(`[Agreement] No existing agreement for booking ${bookingId}, generating new agreement`);
    }

    // Get tenant profile data
    const tenantProfile = booking.user.tenantProfile;
    
    // Get move-in and move-out dates from booking
    const moveInDate = booking.moveInDate || booking.startDate || new Date();
    const moveOutDate = booking.moveOutDate || booking.endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    
    // Calculate rent and deposit amounts in words
    const rentAmountWords = numberToWords(Number(booking.room.rent) || 0);
    const depositAmountWords = numberToWords(Number(booking.room.deposit) || 0);
    
    // Calculate agreement duration in months
    const agreementMonths = calculateMonths(moveInDate, moveOutDate);
    
    // Prepare agreement template data - matching placeholders in DOCX template
    const templateData: AgreementData = {
      tenant_name: `${booking.user.firstName || ""} ${booking.user.lastName || ""}`.trim() || "N/A",
      relation: (tenantProfile as any)?.relation || "N/A",
      father_name: (tenantProfile as any)?.fatherName || "N/A",
      tenant_address: (tenantProfile as any)?.tenantAddress || (booking.user as any)?.address || "N/A",
      aadhaar_number: (tenantProfile as any)?.aadhaarNumber || "N/A",
      college_name: (tenantProfile as any)?.collegeName || "N/A",
      room_number: booking.room.name || "N/A",
      floor: String((booking.room as any)?.floor ?? "N/A"),
      rent_amount: Number(booking.room.rent) || 0,
      rent_amount_words: rentAmountWords,
      deposit_amount: Number(booking.room.deposit) || 0,
      deposit_amount_words: depositAmountWords,
      start_date: formatDate(moveInDate),
      end_date: formatDate(moveOutDate),
      agreement_months: agreementMonths,
      agreement_date: formatDate(new Date()),
    };
    
    // Generate DOCX from template
    const docxBytes = await generateAgreementDocx(templateData);
    
    // Upload DOCX to Cloudinary as raw file
    const fileName = `agreement_${bookingId}.docx`;
    let agreementUrl: string;
    
    try {
      const result = await this.cloudinaryService.uploadBuffer(docxBytes, fileName, "iris-plaza/agreement");
      agreementUrl = result.secure_url;
      console.log(`[Agreement] DOCX uploaded to Cloudinary: ${agreementUrl}`);
    } catch (error) {
      console.error("Failed to upload agreement to Cloudinary:", error);
      throw new Error("Failed to generate rental agreement");
    }
    
    console.log(`[Agreement] Updating agreement record in database for booking ${bookingId}`);
    
    const dbAgreementData = {
      bookingId,
      agreementUrl,
      status: "PENDING_SIGNATURE" as any, // Set to PENDING_SIGNATURE when generated
      startDate: booking.moveInDate || booking.startDate || new Date(),
      endDate: booking.moveOutDate || booking.endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      monthlyRent: booking.room.rent,
      securityDeposit: booking.room.deposit,
      updatedAt: new Date(), // Force update timestamp
    };

    if (existingAgreement) {
      await this.prisma.agreement.update({
        where: { bookingId },
        data: dbAgreementData,
      });
    } else {
      await this.prisma.agreement.create({
        data: dbAgreementData,
      });
    }

    // Also store as a document for unified document system
    const documentData = {
      userId: booking.userId,
      bookingId,
      name: "Rental Agreement",
      type: "AGREEMENT" as any,
      fileUrl: agreementUrl,
      fileName: fileName,
      status: "SUBMITTED" as any,
    };
    
    // Check if document already exists
    const existingDocument = await this.prisma.document.findUnique({
      where: { id: `agreement-${bookingId}` },
    });
    
    if (existingDocument) {
      await this.prisma.document.update({
        where: { id: `agreement-${bookingId}` },
        data: documentData,
      });
    } else {
      await this.prisma.document.create({
        data: {
          id: `agreement-${bookingId}`,
          ...documentData,
        },
      });
    }

    // Send notification to tenant that agreement is ready for signature
    await this.notificationsService.create(booking.userId, {
      type: "PUSH" as any,
      title: "Rental Agreement Ready",
      message: "Your rental agreement is ready for signature. Please sign it from your Documents page.",
    });

    return agreementUrl;
  }

  async findByBooking(bookingId: string) {
    console.log(`[Agreement] findByBooking called with bookingId: ${bookingId}`);
    const agreement = await this.prisma.agreement.findUnique({
      where: { bookingId },
      include: { booking: { include: { user: true, room: true } } },
    });
    console.log(`[Agreement] Found agreement: ${agreement ? agreement.id : 'null'} for booking ${bookingId}`);
    return agreement;
  }

  async findByBookingWithUser(bookingId: string) {
    // This method returns the agreement with booking and user info for ownership verification
    return this.prisma.agreement.findUnique({
      where: { bookingId },
      include: { 
        booking: { 
          include: { user: true } 
        } 
      },
    });
  }

  async findMyAgreement(userId: string) {
    // Find agreement for the current user's approved booking that's still active
    return this.prisma.agreement.findFirst({
      where: {
        booking: {
          userId: userId, // Use booking's userId
          status: {
            in: ["APPROVED", "APPROVED_PENDING_PAYMENT"]
          },
        },
        status: "ACTIVE" as any, // Must be ACTIVE
        endDate: {
          gt: new Date() // Must not be expired
        }
      },
      include: {
        booking: true,
      },
    });
  }

  async create(
    bookingId: string,
    data: {
      startDate: Date;
      endDate: Date;
      monthlyRent: number;
      securityDeposit: number;
    },
  ) {
    return this.prisma.agreement.create({
      data: {
        bookingId,
        ...data,
      },
    });
  }

  async signAsTenant(bookingId: string, signatureDataUrl?: string) {
    const agreement = await this.prisma.agreement.findUnique({
      where: { bookingId },
      include: { booking: { include: { user: { include: { tenantProfile: true } }, room: true } } },
    });

    if (!agreement) {
      throw new NotFoundException("Agreement not found");
    }

    // Upload signature image to Cloudinary if provided
    // Note: Signatures are stored separately, NOT embedded in the agreement document
    let tenantSignatureUrl: string | undefined;
    if (signatureDataUrl) {
      try {
        // Convert data URL to buffer
        const base64Data = signatureDataUrl.replace(/^data:image\/\w+;base64,/, "");
        const signatureBuffer = Buffer.from(base64Data, 'base64');
        
        const result = await this.cloudinaryService.uploadBuffer(
          signatureBuffer, 
          `tenant_signature_${bookingId}.png`, 
          "iris-plaza/signatures"
        );
        tenantSignatureUrl = result.secure_url;
        console.log(`[Agreement] Tenant signature uploaded: ${tenantSignatureUrl}`);
      } catch (error) {
        console.error("Failed to upload tenant signature:", error);
      }
    }

    // DO NOT regenerate the agreement document
    // The original DOCX remains unchanged, signatures are stored separately

    // Check if both signatures exist to activate agreement
    const updatedAgreement = await this.prisma.agreement.findUnique({
      where: { bookingId },
    });

    const newStatus = (updatedAgreement?.adminSigned && tenantSignatureUrl) 
      ? "ACTIVE" as any 
      : "PENDING_SIGNATURE" as any;

    // Send notification
    if (newStatus === "ACTIVE") {
      await this.notificationsService.create(agreement.booking.userId, {
        type: "PUSH" as any,
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

  async signAsAdmin(bookingId: string, signatureDataUrl?: string) {
    const agreement = await this.prisma.agreement.findUnique({
      where: { bookingId },
      include: { booking: { include: { user: { include: { tenantProfile: true } }, room: true } } },
    });

    if (!agreement) {
      throw new NotFoundException("Agreement not found");
    }

    // Upload signature image to Cloudinary if provided
    // Note: Signatures are stored separately, NOT embedded in the agreement document
    let adminSignatureUrl: string | undefined;
    if (signatureDataUrl) {
      try {
        // Convert data URL to buffer
        const base64Data = signatureDataUrl.replace(/^data:image\/\w+;base64,/, "");
        const signatureBuffer = Buffer.from(base64Data, 'base64');
        
        const result = await this.cloudinaryService.uploadBuffer(
          signatureBuffer, 
          `admin_signature_${bookingId}.png`, 
          "iris-plaza/signatures"
        );
        adminSignatureUrl = result.secure_url;
        console.log(`[Agreement] Admin signature uploaded: ${adminSignatureUrl}`);
      } catch (error) {
        console.error("Failed to upload admin signature:", error);
      }
    }

    // DO NOT regenerate the agreement document
    // The original DOCX remains unchanged, signatures are stored separately

    // Check if both signatures exist to activate agreement
    const updatedAgreement = await this.prisma.agreement.findUnique({
      where: { bookingId },
    });

    const newStatus = (updatedAgreement?.tenantSigned && adminSignatureUrl) 
      ? "ACTIVE" as any 
      : "SIGNED" as any;

    const updated = await this.prisma.agreement.update({
      where: { bookingId },
      data: {
        adminSigned: true,
        adminSignedAt: new Date(),
        status: newStatus,
      },
      include: { booking: { include: { user: true, room: true } } },
    });

    // Send notification to tenant if agreement is now active
    if (newStatus === "ACTIVE") {
      await this.notificationsService.create(updated.booking.userId, {
        type: "PUSH" as any,
        title: "Rental Agreement Activated",
        message: "Your rental agreement has been fully executed. You can download it from the Documents section.",
      });
    }

    return updated;
  }

  async getAgreementUrl(bookingId: string): Promise<string | null> {
    const agreement = await this.prisma.agreement.findUnique({
      where: { bookingId },
    });
    return agreement?.agreementUrl || null;
  }

  // Expire agreements that have passed their end date and update room status
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async expireAgreements() {
    try {
      this.logger.log('Running scheduled task to expire agreements...');
      const normalizedTodayUtc = this.toStartOfUtcDay(new Date());
      
      // Find active agreements that have expired
      const expiredAgreements = await this.prisma.agreement.findMany({
        where: {
          status: "ACTIVE" as any,
          endDate: {
            lt: normalizedTodayUtc
          }
        },
        include: {
          booking: true
        }
      });
      
      // Update each expired agreement and release the room
      for (const agreement of expiredAgreements) {
        // Update agreement status to EXPIRED
        await this.prisma.agreement.update({
          where: { id: agreement.id },
          data: {
            status: "EXPIRED" as any
          }
        });
        
        // Release the room
        await this.prisma.room.update({
          where: { id: agreement.booking.roomId },
          data: {
            status: "AVAILABLE" as any,
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
    } catch (error) {
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
}
