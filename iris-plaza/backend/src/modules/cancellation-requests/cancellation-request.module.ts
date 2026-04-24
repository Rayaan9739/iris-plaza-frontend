import { Module } from "@nestjs/common";
import { CancellationRequestService } from "./cancellation-request.service";
import { CancellationRequestController } from "./cancellation-request.controller";
import { PrismaModule } from "../../prisma/prisma.module";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [CancellationRequestController],
  providers: [CancellationRequestService],
  exports: [CancellationRequestService],
})
export class CancellationRequestModule {}
