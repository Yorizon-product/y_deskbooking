-- Preventing overlapping confirmed bookings at the DB layer.
--
-- Postgres marks `tstzrange(timestamptz, timestamptz)` STABLE, which blocks
-- its use directly in an index expression — even when wrapped in an
-- IMMUTABLE SQL function (Postgres now infers volatility from callees).
--
-- Robust workaround: materialise the range in a plain column populated by a
-- BEFORE INSERT/UPDATE trigger. The EXCLUDE constraint then indexes the
-- column directly, with no function in the index expression.
--
-- The `during` column is an internal implementation detail and is NOT
-- represented in prisma/schema.prisma: application code writes startAt/endAt,
-- the trigger populates `during`, Prisma never touches the column.

ALTER TABLE "Booking"
  ADD COLUMN "during" tstzrange;

CREATE OR REPLACE FUNCTION booking_set_during() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW."during" := tstzrange(NEW."startAt", NEW."endAt");
  RETURN NEW;
END;
$$;

CREATE TRIGGER booking_set_during_trg
  BEFORE INSERT OR UPDATE OF "startAt", "endAt" ON "Booking"
  FOR EACH ROW EXECUTE FUNCTION booking_set_during();

-- Backfill for any rows that already exist (empty today, but safe).
UPDATE "Booking" SET "during" = tstzrange("startAt", "endAt") WHERE "during" IS NULL;

-- Prevent overlapping confirmed bookings on the same desk.
ALTER TABLE "Booking"
  ADD CONSTRAINT "Booking_no_overlap"
  EXCLUDE USING GIST (
    "deskId" WITH =,
    "during" WITH &&
  )
  WHERE (status = 'confirmed');

-- NOTE: The "one confirmed booking per user per local date" rule is enforced
-- in application code, not by a partial unique index — the date-cast with
-- AT TIME ZONE is STABLE and cannot appear in an index expression. The
-- desk-level EXCLUDE above is the critical DB invariant.
