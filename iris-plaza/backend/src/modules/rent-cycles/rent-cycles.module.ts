import { Module } from "@nestjs/common";
import { RentCyclesService } from "./rent-cycles.service";
import { RentCyclesController } from "./rent-cycles.controller";
import { NotificationsModule } from "@/modules/notifications/notifications.module";

@Module({
  imports: [NotificationsModule],
  controllers: [RentCyclesController],
  providers: [RentCyclesService],
  exports: [RentCyclesService],
})
export class RentCyclesModule {}
