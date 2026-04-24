"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const core_1 = require("@nestjs/core");
const schedule_1 = require("@nestjs/schedule");
const event_emitter_1 = require("@nestjs/event-emitter");
const auth_module_1 = require("./modules/auth/auth.module");
const users_module_1 = require("./modules/users/users.module");
const rooms_module_1 = require("./modules/rooms/rooms.module");
const bookings_module_1 = require("./modules/bookings/bookings.module");
const documents_module_1 = require("./modules/documents/documents.module");
const agreements_module_1 = require("./modules/agreements/agreements.module");
const payments_module_1 = require("./modules/payments/payments.module");
const rent_cycles_module_1 = require("./modules/rent-cycles/rent-cycles.module");
const notifications_module_1 = require("./modules/notifications/notifications.module");
const maintenance_module_1 = require("./modules/maintenance/maintenance.module");
const admin_module_1 = require("./modules/admin/admin.module");
const cancellation_request_module_1 = require("./modules/cancellation-requests/cancellation-request.module");
const contact_module_1 = require("./modules/contact/contact.module");
const uploads_module_1 = require("./modules/uploads/uploads.module");
const prisma_module_1 = require("./prisma/prisma.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: ".env",
            }),
            throttler_1.ThrottlerModule.forRoot([
                {
                    ttl: 60000,
                    limit: 100,
                },
            ]),
            schedule_1.ScheduleModule.forRoot(),
            event_emitter_1.EventEmitterModule.forRoot(),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            rooms_module_1.RoomsModule,
            bookings_module_1.BookingsModule,
            documents_module_1.DocumentsModule,
            agreements_module_1.AgreementsModule,
            payments_module_1.PaymentsModule,
            rent_cycles_module_1.RentCyclesModule,
            notifications_module_1.NotificationsModule,
            maintenance_module_1.MaintenanceModule,
            admin_module_1.AdminModule,
            cancellation_request_module_1.CancellationRequestModule,
            contact_module_1.ContactModule,
            uploads_module_1.UploadsModule,
        ],
        providers: [
            {
                provide: core_1.APP_GUARD,
                useClass: throttler_1.ThrottlerGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map