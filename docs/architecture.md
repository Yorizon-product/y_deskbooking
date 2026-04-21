# Architecture notes

Companion to the short description in the README. This file captures the
decisions and the _why_ behind them — things a new contributor needs to
understand before editing the booking path or the data layer.

## Stack summary

| Concern | Choice | Why |
|---|---|---|
| Framework | Next.js 15 App Router + TypeScript | RSC read paths are instant, route handlers give us a first-class API without a second server, shadcn/ui is built for it. |
| UI | shadcn/ui (new-york) + Tailwind v4 | Components live in the repo so we own them; Tailwind v4's `@theme inline` works nicely with CSS variables. |
| Theme | **Yorizon** (tokens in `app/globals.css`) | Pre-decided identity, dark-olive + electric-lime, extracted directly from tweakcn's editor export. |
| Auth | Auth.js v5 + Prisma adapter + Resend magic-link | Passwordless, no SSO for v1 per the proposal's non-goals. |
| DB | Postgres (Neon) + Prisma 6 | Transactional booking needs real Postgres. Prisma gives us typed queries + migration discipline. Neon's branching and pooled endpoint fit Vercel well. |
| Ops | Vercel + Neon | Cheapest zero-ops option that gives us Postgres + preview URLs per PR. Dockerfile can be added later for self-host without a rewrite. |

## How overlap-free booking is guaranteed

The invariant: _two confirmed bookings cannot overlap in time on the same desk._
It's enforced at the database layer, not in app code, so no amount of racy
writes can violate it.

The implementation had a subtle wrinkle: Postgres marks `tstzrange()` as
`STABLE` (not `IMMUTABLE`), which blocks it from appearing directly in an
index expression — even when wrapped in a user-defined `IMMUTABLE` SQL
function (Postgres now infers volatility from callees).

The robust workaround is to **materialise the range in a plain column**,
populated by a `BEFORE INSERT/UPDATE` trigger, then put the `EXCLUDE USING
GIST` constraint on that column directly. No function call in the index
expression.

```sql
ALTER TABLE "Booking" ADD COLUMN "during" tstzrange;

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

ALTER TABLE "Booking"
  ADD CONSTRAINT "Booking_no_overlap"
  EXCLUDE USING GIST ("deskId" WITH =, "during" WITH &&)
  WHERE (status = 'confirmed');
```

The `during` column is **intentionally not modelled** in `schema.prisma` —
it's an implementation detail maintained by the trigger. Prisma never writes
or reads it.

The constraint is scoped by `WHERE (status = 'confirmed')`, so cancelling a
booking (which flips status to `cancelled`) immediately frees the slot.

Full migration: [`prisma/migrations/20260421104157_booking_no_overlap/migration.sql`](../prisma/migrations/20260421104157_booking_no_overlap/migration.sql).

### What about "one booking per user per local date"?

The desk-level EXCLUDE prevents _overlapping_ bookings, but it doesn't stop
one user from holding two non-overlapping bookings on different desks for
the same day. Per the spec, we want to block that too.

We'd love to enforce it with a partial unique index like:

```sql
CREATE UNIQUE INDEX ON "Booking" ("userId", (("startAt" AT TIME ZONE 'UTC')::date))
  WHERE status = 'confirmed';
```

…but `AT TIME ZONE` is `STABLE`, not `IMMUTABLE`, so Postgres rejects it in
an index expression. Rather than contort further, the rule is enforced in
`createBooking()` (app code) with a pre-insert check. This is racy only at
extreme concurrency levels and bounded to one user's own account; the real
correctness-critical invariant (desk overlap) is unaffected.

## Slot math

All timestamps are stored as UTC instants. Slot boundaries are defined in
the **office timezone** (`OFFICE_TZ`, default `Europe/Berlin`), then
`fromZonedTime`'d to UTC once at booking creation.

| Slot | Start | End |
|---|---|---|
| Morning | 08:00 | 12:00 |
| Afternoon | 12:00 | 18:00 |
| All-day | 08:00 | 18:00 |

All ranges are half-open `[startAt, endAt)`. Rendering for the user goes
the opposite direction — `toZonedTime` the stored UTC instant, format in
`OFFICE_TZ`.

Helpers live in [`lib/booking/slots.ts`](../lib/booking/slots.ts).

## Auth flow

- `auth.ts` configures NextAuth v5 with the Prisma adapter and a custom
  `sendVerificationRequest` that renders a Yorizon-branded HTML email
  (`lib/email/magic-link.ts`) and POSTs directly to Resend's `/emails` API.
- Session strategy is JWT (not DB) with a 30-day max age. The JWT callback
  copies `id` + `role` off the adapter's user object onto the token; the
  session callback surfaces them on `session.user`.
- The session `update` trigger refreshes `role` from the DB so admin
  promotion takes effect on the user's next request.
- `middleware.ts` does the coarse gate: public allow-list of
  `/`, `/sign-in`, `/sign-in/check-email`, `/forbidden`, Auth.js internals,
  and Next static assets. Everything else needs a session; `/admin/**`
  additionally needs `role === 'admin'`.
- `/admin/layout.tsx` double-checks role server-side so a stale JWT can't
  sneak a non-admin past the middleware.

## Validation layer

All server actions validate input with Zod:

- [`lib/validators/inventory.ts`](../lib/validators/inventory.ts) — floor + desk shapes, attribute schema
- [`lib/validators/booking.ts`](../lib/validators/booking.ts) — booking create + cancel

They return a typed `ActionResult = { ok: true } | { ok: false; error }` so
UIs can surface errors via `sonner` toasts without guessing.

## Open design questions

From the proposal's open questions list, with current direction:

- **Time model** — v1 ships with half-day presets (morning/afternoon/all-day). Free-form ranges are a later addition if requested.
- **Postgres host** — Neon. Done.
- **Admin bootstrap** — Seed script (`prisma/seed.ts`) reads `SEED_ADMIN_EMAIL`. Done.
- **Floor plan representation** — v1 ships a grid of desk cards. An SVG floor plan with hotspots is a future enhancement; the data model supports it already.
- **Multi-tenancy** — out of scope for v1. If needed later, `User` gets an `orgId`, and every query + unique-constraint tuple gains it.
