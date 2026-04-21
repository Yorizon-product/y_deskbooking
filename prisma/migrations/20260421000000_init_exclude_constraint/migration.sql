-- Enable the extension that powers the range-exclusion constraint.
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Prevent overlapping confirmed bookings for the same desk.
-- This is enforced at the DB layer so application code alone cannot violate the invariant,
-- even under concurrent writes.
ALTER TABLE "Booking"
  ADD CONSTRAINT "Booking_no_overlap"
  EXCLUDE USING GIST (
    "deskId" WITH =,
    tstzrange("startAt", "endAt", '[)') WITH &&
  )
  WHERE (status = 'confirmed');

-- Per the desk-booking spec: one confirmed booking per user per local date.
-- Enforced as a partial unique index over (userId, date in UTC).
-- NB: date-boundary logic in the office TZ is enforced in app code;
-- this index just prevents the obvious same-user-same-day dup.
CREATE UNIQUE INDEX "Booking_one_per_user_per_day"
  ON "Booking" ("userId", (("startAt" AT TIME ZONE 'UTC')::date))
  WHERE status = 'confirmed';
