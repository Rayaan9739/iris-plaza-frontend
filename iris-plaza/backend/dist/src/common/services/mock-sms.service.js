"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var MockSmsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockSmsService = void 0;
const common_1 = require("@nestjs/common");
const sms_service_1 = require("./sms.service");
let MockSmsService = MockSmsService_1 = class MockSmsService extends sms_service_1.SmsService {
    constructor() {
        super(...arguments);
        this.logger = new common_1.Logger(MockSmsService_1.name);
    }
    async sendSms(message) {
        this.logger.log(`[MOCK SMS] To: ${message.to}, Body: ${message.body}`);
        return {
            success: true,
            messageId: `mock_${Date.now()}`,
        };
    }
};
exports.MockSmsService = MockSmsService;
exports.MockSmsService = MockSmsService = MockSmsService_1 = __decorate([
    (0, common_1.Injectable)()
], MockSmsService);
//# sourceMappingURL=mock-sms.service.js.map