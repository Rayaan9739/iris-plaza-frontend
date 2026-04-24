-- CreateEnum
CREATE TYPE "BookingSource" AS ENUM ('WALK_IN', 'BROKER');

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "bookingSource" "BookingSource" DEFAULT 'WALK_IN',
ADD COLUMN     "brokerName" TEXT;
