import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { ScheduleModule } from "@nestjs/schedule";
import { EventEmitterModule } from "@nestjs/event-emitter";

import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { RoomsModule } from "./modules/rooms/rooms.module";
import { BookingsModule } from "./modules/bookings/bookings.module";
import { DocumentsModule } from "./modules/documents/documents.module";
import { AgreementsModule } from "./modules/agreements/agreements.module";
import { PaymentsModule } from "./modules/payments/payments.module";
import { RentCyclesModule } from "./modules/rent-cycles/rent-cycles.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { MaintenanceModule } from "./modules/maintenance/maintenance.module";
import { AdminModule } from "./modules/admin/admin.module";
import { CancellationRequestModule } from "./modules/cancellation-requests/cancellation-request.module";
import { ContactModule } from "./modules/contact/contact.module";
import { UploadsModule } from "./modules/uploads/uploads.module";
import { PrismaModule } from "./prisma/prisma.module";
import { HealthController } from "./health/health.controller";

@Module({
  imports: [
    // Config
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),

    // Throttler
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),

    // Schedule
    ScheduleModule.forRoot(),

    // Event Emitter
    EventEmitterModule.forRoot(),

    // Prisma
    PrismaModule,

    // App Modules
    AuthModule,
    UsersModule,
    RoomsModule,
    BookingsModule,
    DocumentsModule,
    AgreementsModule,
    PaymentsModule,
    RentCyclesModule,
    NotificationsModule,
    MaintenanceModule,
    AdminModule,
    CancellationRequestModule,
    ContactModule,
    UploadsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
