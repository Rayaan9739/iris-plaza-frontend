import { Module } from "@nestjs/common";
import { MulterModule } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { AdminService } from "./admin.service";
import { AdminController } from "./admin.controller";
import { RoomsModule } from "@/modules/rooms/rooms.module";
import { BookingsModule } from "@/modules/bookings/bookings.module";
import { NotificationsModule } from "@/modules/notifications/notifications.module";
import { PaymentsModule } from "@/modules/payments/payments.module";
import { EventEmitterService } from "@/common/services/event-emitter.service";
import { CloudinaryService } from "@/common/services/cloudinary.service";

@Module({
  imports: [
    MulterModule.register({
      storage: memoryStorage(),
      limits: {
        fileSize: 100 * 1024 * 1024, // 100MB limit
      },
    }),
    RoomsModule, 
    BookingsModule, 
    NotificationsModule, 
    PaymentsModule
  ],
  controllers: [AdminController],
  providers: [AdminService, EventEmitterService, CloudinaryService],
  exports: [AdminService],
})
export class AdminModule {}
