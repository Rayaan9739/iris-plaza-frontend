import { Module } from "@nestjs/common";
import { BookingsService } from "./bookings.service";
import { BookingsController } from "./bookings.controller";
import { NotificationsModule } from "@/modules/notifications/notifications.module";
import { AgreementsModule } from "@/modules/agreements/agreements.module";
import { EventEmitterService } from "@/common/services/event-emitter.service";

@Module({
  imports: [NotificationsModule, AgreementsModule],
  controllers: [BookingsController],
  providers: [BookingsService, EventEmitterService],
  exports: [BookingsService, EventEmitterService],
})
export class BookingsModule {}
