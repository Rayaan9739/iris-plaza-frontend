import { Module } from "@nestjs/common";
import { DocumentsService } from "./documents.service";
import { DocumentsController } from "./documents.controller";
import { CloudinaryService } from "@/common/services/cloudinary.service";

@Module({
  controllers: [DocumentsController],
  providers: [DocumentsService, CloudinaryService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
