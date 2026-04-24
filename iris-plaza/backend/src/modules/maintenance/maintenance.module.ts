import { Module } from "@nestjs/common";
import { MaintenanceService } from "./maintenance.service";
import { MaintenanceController } from "./maintenance.controller";
import { NotificationsModule } from "@/modules/notifications/notifications.module";
import { EventEmitterService } from "@/common/services/event-emitter.service";

@Module({
  imports: [NotificationsModule],
  controllers: [MaintenanceController],
  providers: [MaintenanceService, EventEmitterService],
  exports: [MaintenanceService],
})
export class MaintenanceModule {}
