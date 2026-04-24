import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";

// Mapping from frontend types to correct DB DocumentType enum values
const DOCUMENT_TYPE_MAPPING: Record<string, string> = {
  // Frontend sends these incorrect types - map them to correct DB enum values
  "ID_CARD": "COLLEGE_ID",
  "PHOTO": "TENANT_PHOTO",
  // These are already correct
  "AADHAAR": "AADHAAR",
  "COLLEGE_ID": "COLLEGE_ID",
  "TENANT_PHOTO": "TENANT_PHOTO",
};

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Map frontend document type to correct DB DocumentType enum
   */
  private mapDocumentType(type: string): string {
    const normalizedType = type?.toUpperCase();
    return DOCUMENT_TYPE_MAPPING[normalizedType] || type;
  }

  async findAll() {
    return this.prisma.document.findMany({
      include: { user: true, booking: { include: { room: true } } },
    });
  }

  async findMyDocuments(userId: string) {
    return this.prisma.document.findMany({
      where: { userId },
      include: { booking: true },
    });
  }

  async findOne(id: string) {
    const document = await this.prisma.document.findUnique({
      where: { id },
      include: { user: true, booking: true },
    });
    if (!document) throw new NotFoundException("Document not found");
    return document;
  }

  async create(
    actorUserId: string,
    data: {
      name: string;
      type: string;
      fileUrl: string;
      fileName?: string;
      fileSize?: number;
      mimeType?: string;
      bookingId?: string;
      status?: string;
      userId?: string;
    },
    actorRole?: string,
  ) {
    // Map frontend type to correct DB DocumentType enum
    const mappedType = this.mapDocumentType(data.type);
    
    // Validate the mapped type is a valid DocumentType
    const validTypes = ["AADHAAR", "COLLEGE_ID", "TENANT_PHOTO", "ID_CARD", "PROOF_OF_INCOME", "ADDRESS_PROOF", "PHOTO", "AGREEMENT", "OTHER"];
    if (!validTypes.includes(mappedType)) {
      throw new BadRequestException(`Invalid document type: ${data.type}`);
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
        throw new BadRequestException("Invalid bookingId");
      }

      if (actorRole === "ADMIN") {
        targetUserId = data.userId || booking.userId;
      } else if (booking.userId !== targetUserId) {
        throw new BadRequestException("You can only upload documents for your own booking");
      }
    }

    return this.prisma.document.create({
      data: {
        name: data.name,
        type: mappedType as any,
        fileUrl: data.fileUrl,
        fileName: data.fileName,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
        bookingId: data.bookingId,
        userId: targetUserId,
        status: (data.status || "SUBMITTED") as any,
      },
    });
  }

  async updateStatus(id: string, status: string, rejectReason?: string) {
    return this.prisma.document.update({
      where: { id },
      data: {
        status: status as any,
        rejectReason,
        reviewedAt: new Date(),
      },
    });
  }

  async findPendingDocuments() {
    return this.prisma.document.findMany({
      where: { status: "PENDING" as any },
      include: { user: true, booking: true },
    });
  }
}
