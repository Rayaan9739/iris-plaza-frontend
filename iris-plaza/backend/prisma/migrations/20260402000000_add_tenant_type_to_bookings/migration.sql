-- CreateEnum
CREATE TYPE "TenantType" AS ENUM ('ACTIVE', 'FUTURE');

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN "tenantType" "TenantType" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN "expectedMoveIn" TIMESTAMP(3),
ADD COLUMN "bookingDate" TIMESTAMP(3);
