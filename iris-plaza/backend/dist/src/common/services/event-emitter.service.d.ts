import { EventEmitter2 } from "@nestjs/event-emitter";
export declare const DASHBOARD_UPDATE_EVENT = "tenant:dataUpdated";
export declare const PAYMENT_UPDATED_EVENT = "payment:updated";
export declare const BOOKING_UPDATED_EVENT = "booking:updated";
export declare const BOOKING_EXPIRED_EVENT = "booking:expired";
export declare const ROOM_UPDATED_EVENT = "room:updated";
export declare class EventEmitterService {
    private eventEmitter;
    constructor(eventEmitter: EventEmitter2);
    emitDashboardUpdate(userId: string, data?: any): void;
    emitPaymentUpdated(userId: string, paymentId: string, status: string, data?: any): void;
    emitBookingUpdated(userId: string, bookingId: string, status: string, data?: any): void;
    emitBookingExpired(userId: string, bookingId: string, data?: any): void;
    emitRoomUpdated(roomId: string, data?: any): void;
}
