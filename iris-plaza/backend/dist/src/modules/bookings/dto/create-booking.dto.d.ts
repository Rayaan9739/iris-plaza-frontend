import { BookingSource } from "@prisma/client";
export declare class CreateBookingDto {
    userId?: string;
    roomId: string;
    moveInDate: string;
    moveOutDate: string;
    rent?: string;
    deposit?: string;
    source?: string;
    bookingSource?: BookingSource;
    brokerName?: string;
}
