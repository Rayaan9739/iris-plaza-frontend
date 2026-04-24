"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventEmitterService = exports.ROOM_UPDATED_EVENT = exports.BOOKING_EXPIRED_EVENT = exports.BOOKING_UPDATED_EVENT = exports.PAYMENT_UPDATED_EVENT = exports.DASHBOARD_UPDATE_EVENT = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
exports.DASHBOARD_UPDATE_EVENT = "tenant:dataUpdated";
exports.PAYMENT_UPDATED_EVENT = "payment:updated";
exports.BOOKING_UPDATED_EVENT = "booking:updated";
exports.BOOKING_EXPIRED_EVENT = "booking:expired";
exports.ROOM_UPDATED_EVENT = "room:updated";
let EventEmitterService = class EventEmitterService {
    constructor(eventEmitter) {
        this.eventEmitter = eventEmitter;
    }
    emitDashboardUpdate(userId, data) {
        this.eventEmitter.emit(exports.DASHBOARD_UPDATE_EVENT, {
            userId,
            timestamp: new Date(),
            data,
        });
    }
    emitPaymentUpdated(userId, paymentId, status, data) {
        this.eventEmitter.emit(exports.PAYMENT_UPDATED_EVENT, {
            userId,
            paymentId,
            status,
            timestamp: new Date(),
            data,
        });
    }
    emitBookingUpdated(userId, bookingId, status, data) {
        this.eventEmitter.emit(exports.BOOKING_UPDATED_EVENT, {
            userId,
            bookingId,
            status,
            timestamp: new Date(),
            data,
        });
    }
    emitBookingExpired(userId, bookingId, data) {
        this.eventEmitter.emit(exports.BOOKING_EXPIRED_EVENT, {
            userId,
            bookingId,
            timestamp: new Date(),
            data,
        });
    }
    emitRoomUpdated(roomId, data) {
        this.eventEmitter.emit(exports.ROOM_UPDATED_EVENT, {
            roomId,
            timestamp: new Date(),
            data,
        });
    }
};
exports.EventEmitterService = EventEmitterService;
exports.EventEmitterService = EventEmitterService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [event_emitter_1.EventEmitter2])
], EventEmitterService);
//# sourceMappingURL=event-emitter.service.js.map