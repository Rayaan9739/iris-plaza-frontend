"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RentCyclesModule = void 0;
const common_1 = require("@nestjs/common");
const rent_cycles_service_1 = require("./rent-cycles.service");
const rent_cycles_controller_1 = require("./rent-cycles.controller");
const notifications_module_1 = require("../notifications/notifications.module");
let RentCyclesModule = class RentCyclesModule {
};
exports.RentCyclesModule = RentCyclesModule;
exports.RentCyclesModule = RentCyclesModule = __decorate([
    (0, common_1.Module)({
        imports: [notifications_module_1.NotificationsModule],
        controllers: [rent_cycles_controller_1.RentCyclesController],
        providers: [rent_cycles_service_1.RentCyclesService],
        exports: [rent_cycles_service_1.RentCyclesService],
    })
], RentCyclesModule);
//# sourceMappingURL=rent-cycles.module.js.map