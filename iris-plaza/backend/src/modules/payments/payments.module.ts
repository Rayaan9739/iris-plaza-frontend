import { Module } from "@nestjs/common";
import { PaymentsService } from "./payments.service";
import { PaymentsController } from "./payments.controller";
import { EventEmitterService } from "@/common/services/event-emitter.service";
import { NotificationsModule } from "@/modules/notifications/notifications.module";
import { AgreementsModule } from "@/modules/agreements/agreements.module";
import { OcrService } from "@/common/services/ocr.service";
import { CloudinaryService } from "@/common/services/cloudinary.service";

@Module({
  imports: [NotificationsModule, AgreementsModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, EventEmitterService, OcrService, CloudinaryService],
  exports: [PaymentsService, EventEmitterService, OcrService, CloudinaryService],
})
export class PaymentsModule {}
