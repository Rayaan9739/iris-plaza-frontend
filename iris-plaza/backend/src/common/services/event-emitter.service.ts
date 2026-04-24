import { Injectable } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";

export const DASHBOARD_UPDATE_EVENT = "tenant:dataUpdated";
export const PAYMENT_UPDATED_EVENT = "payment:updated";
export const BOOKING_UPDATED_EVENT = "booking:updated";
export const BOOKING_EXPIRED_EVENT = "booking:expired";
export const ROOM_UPDATED_EVENT = "room:updated";

@Injectable()
export class EventEmitterService {
  constructor(private eventEmitter: EventEmitter2) {}

  /**
   * Emit dashboard update event for specific tenant
   */
  emitDashboardUpdate(userId: string, data?: any) {
    this.eventEmitter.emit(DASHBOARD_UPDATE_EVENT, {
      userId,
      timestamp: new Date(),
      data,
    });
  }

  /**
   * Emit payment updated event
   */
  emitPaymentUpdated(
    userId: string,
    paymentId: string,
    status: string,
    data?: any,
  ) {
    this.eventEmitter.emit(PAYMENT_UPDATED_EVENT, {
      userId,
      paymentId,
      status,
      timestamp: new Date(),
      data,
    });
  }

  /**
   * Emit booking updated event
   */
  emitBookingUpdated(
    userId: string,
    bookingId: string,
    status: string,
    data?: any,
  ) {
    this.eventEmitter.emit(BOOKING_UPDATED_EVENT, {
      userId,
      bookingId,
      status,
      timestamp: new Date(),
      data,
    });
  }

  /**
   * Emit booking expired event
   */
  emitBookingExpired(userId: string, bookingId: string, data?: any) {
    this.eventEmitter.emit(BOOKING_EXPIRED_EVENT, {
      userId,
      bookingId,
      timestamp: new Date(),
      data,
    });
  }

  /**
   * Emit room updated event - used when room status changes (e.g., after booking approval)
   */
  emitRoomUpdated(roomId: string, data?: any) {
    this.eventEmitter.emit(ROOM_UPDATED_EVENT, {
      roomId,
      timestamp: new Date(),
      data,
    });
  }
}
