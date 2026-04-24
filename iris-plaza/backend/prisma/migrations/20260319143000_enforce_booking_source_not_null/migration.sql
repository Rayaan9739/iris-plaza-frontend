-- Backfill records created before bookingSource was enforced.
UPDATE "bookings"
SET "bookingSource" = 'WALK_IN'
WHERE "bookingSource" IS NULL;

-- Keep brokerName nullable, but clear it for walk-in rows.
UPDATE "bookings"
SET "brokerName" = NULL
WHERE "bookingSource" = 'WALK_IN';

-- Enforce non-null bookingSource going forward.
ALTER TABLE "bookings"
ALTER COLUMN "bookingSource" SET DEFAULT 'WALK_IN',
ALTER COLUMN "bookingSource" SET NOT NULL;
