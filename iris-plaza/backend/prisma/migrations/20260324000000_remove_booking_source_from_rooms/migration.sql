-- Remove incorrectly placed bookingSource column from rooms table
-- bookingSource should only be in the bookings table
ALTER TABLE "rooms" DROP COLUMN IF EXISTS "bookingSource";