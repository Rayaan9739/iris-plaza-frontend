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
  Query,
  Res,
} from "@nestjs/common";
import { Response } from "express";
import * as path from "path";
import * as fs from "fs";
import * as https from "https";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { FileInterceptor } from "@nestjs/platform-express";
import { DocumentsService } from "./documents.service";
import { JwtAuthGuard } from "@/modules/auth/guards/jwt-auth.guard";
import { RolesGuard } from "@/common/guards/roles.guard";
import { Roles } from "@/common/decorators/roles.decorator";
import { CloudinaryService } from "@/common/services/cloudinary.service";

@ApiTags("Documents")
@Controller("documents")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DocumentsController {
  constructor(
    private documentsService: DocumentsService,
    private cloudinaryService: CloudinaryService,
  ) {}

  @Get("me")
  @ApiOperation({ summary: "Get my documents" })
  async getMyDocuments(@Request() req: any) {
    return this.documentsService.findMyDocuments(req.user.userId);
  }

  @Get("my")
  @ApiOperation({ summary: "Get my documents (alias)" })
  async getMyDocumentsAlias(@Request() req: any) {
    return this.documentsService.findMyDocuments(req.user.userId);
  }

  @Get(":id/view")
  @ApiOperation({ summary: "Stream document file" })
  async viewDocument(
    @Param("id") id: string,
    @Request() req: any,
    @Res() res: Response,
  ) {
    const document = await this.documentsService.findOne(id);
    
    // Check ownership OR if admin
    if (document.userId !== req.user.userId && req.user.role !== 'ADMIN') {
      throw new BadRequestException("Unauthorized access to this document");
    }

    if (!document.fileUrl) {
      throw new BadRequestException("Document URL not found");
    }

    const fileName = document.fileName || `document_${id}`;
    res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
    res.setHeader("Content-Type", document.mimeType || "application/pdf");

    // Handle Cloudinary URL
    if (document.fileUrl.startsWith("http")) {
      https.get(document.fileUrl, (proxyRes) => {
        proxyRes.pipe(res);
      }).on("error", (err) => {
        console.error("Error proxying file from Cloudinary:", err);
        res.status(500).send("Error retrieving file");
      });
      return;
    }

    // Handle local file
    const filePath = path.isAbsolute(document.fileUrl) 
      ? document.fileUrl 
      : path.join(process.cwd(), document.fileUrl);
    
    if (fs.existsSync(filePath)) {
      fs.createReadStream(filePath).pipe(res);
    } else {
      throw new BadRequestException("File not found on server");
    }
  }

  @Get(":id")
  @ApiOperation({ summary: "Get document metadata by ID" })
  async findOne(@Param("id") id: string) {
    return this.documentsService.findOne(id);
  }

  @Post("upload/file")
  @ApiOperation({ summary: "Upload verification file" })
  @UseInterceptors(
    FileInterceptor("file", {
      fileFilter: (_req, file, cb) => {
        const allowed = new Set([".jpg", ".jpeg", ".png", ".pdf"]);
        const ext = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf("."));
        cb(
          allowed.has(ext)
            ? null
            : new BadRequestException("Only jpg, jpeg, png, pdf are allowed"),
          allowed.has(ext),
        );
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Query("documentType") documentType?: string,
  ) {
    if (!file) {
      throw new BadRequestException("File is required");
    }

    try {
      // Use uploadRaw for PDFs and other non-image files, uploadImage for images
      const isImage = file.mimetype.startsWith("image/");
      const result = isImage
        ? await this.cloudinaryService.uploadImage(file, "iris-plaza/documents")
        : await this.cloudinaryService.uploadRaw(file, "iris-plaza/documents");

      return {
        fileUrl: result.secure_url,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
      };
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      throw new BadRequestException("Failed to upload file to Cloudinary");
    }
  }

  @Post("upload")
  @ApiOperation({ summary: "Upload a document" })
  async create(
    @Request() req: any,
    @Body()
    body: {
      name: string;
      type: string;
      fileUrl: string;
      fileName?: string;
      fileSize?: number;
      mimeType?: string;
      bookingId?: string;
      userId?: string;
    },
  ) {
    return this.documentsService.create(req.user.userId, body, req.user.role);
  }

  // Admin endpoints
  @Get("admin/all")
  @UseGuards(RolesGuard)
  @Roles("ADMIN")
  @ApiOperation({ summary: "Get all documents (Admin)" })
  async findAll() {
    return this.documentsService.findAll();
  }

  @Get("admin/pending")
  @UseGuards(RolesGuard)
  @Roles("ADMIN")
  @ApiOperation({ summary: "Get pending documents (Admin)" })
  async findPending() {
    return this.documentsService.findPendingDocuments();
  }

  @Patch("admin/:id/status")
  @UseGuards(RolesGuard)
  @Roles("ADMIN")
  @ApiOperation({ summary: "Update document status (Admin)" })
  async updateStatus(
    @Param("id") id: string,
    @Body() body: { status: string; rejectReason?: string },
  ) {
    return this.documentsService.updateStatus(
      id,
      body.status,
      body.rejectReason,
    );
  }
}
