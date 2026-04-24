-- Add rentAmount to bookings table for tenant-specific pricing
ALTER TABLE "bookings" 
ADD COLUMN IF NOT EXISTS "rent_amount" DECIMAL(10,2);
