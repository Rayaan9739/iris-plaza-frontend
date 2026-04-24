"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminModule = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const admin_service_1 = require("./admin.service");
const admin_controller_1 = require("./admin.controller");
const rooms_module_1 = require("../rooms/rooms.module");
const bookings_module_1 = require("../bookings/bookings.module");
const notifications_module_1 = require("../notifications/notifications.module");
const payments_module_1 = require("../payments/payments.module");
const event_emitter_service_1 = require("../../common/services/event-emitter.service");
const cloudinary_service_1 = require("../../common/services/cloudinary.service");
let AdminModule = class AdminModule {
};
exports.AdminModule = AdminModule;
exports.AdminModule = AdminModule = __decorate([
    (0, common_1.Module)({
        imports: [
            platform_express_1.MulterModule.register({
                storage: (0, multer_1.memoryStorage)(),
                limits: {
                    fileSize: 100 * 1024 * 1024,
                },
            }),
            rooms_module_1.RoomsModule,
            bookings_module_1.BookingsModule,
            notifications_module_1.NotificationsModule,
            payments_module_1.PaymentsModule
        ],
        controllers: [admin_controller_1.AdminController],
        providers: [admin_service_1.AdminService, event_emitter_service_1.EventEmitterService, cloudinary_service_1.CloudinaryService],
        exports: [admin_service_1.AdminService],
    })
], AdminModule);
//# sourceMappingURL=admin.module.js.map