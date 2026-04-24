-- Add management-specific fields to rooms table
ALTER TABLE "rooms" 
ADD COLUMN IF NOT EXISTS "management_rent" DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS "management_status" "RoomStatus" DEFAULT 'AVAILABLE',
ADD COLUMN IF NOT EXISTS "management_is_available" Boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS "management_occupied_until" TIMESTAMP(3);
