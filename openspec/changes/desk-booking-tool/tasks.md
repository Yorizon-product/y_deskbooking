## 1. Project bootstrap

- [x] 1.1 Scaffold Next.js 15 + TS + App Router + Tailwind v4 manually (existing repo, no `create-next-app` overwrite)
- [x] 1.2 Initialize git, add `.gitignore` (Next defaults + `.env*.local`, `prisma/*.db`)
- [x] 1.3 Configure `components.json` for shadcn/ui new-york style, Yorizon via CSS variables
- [x] 1.4 Add initial shadcn components: `button`, `input`, `label`, `card` (remaining added on demand)
- [x] 1.5 Install `next-themes`, wire `<ThemeProvider>` in `app/layout.tsx`, add `<ThemeToggle>`
- [x] 1.6 Load Inter via `next/font/google` and assign it to `--font-sans`
- [x] 1.7 Paste the Yorizon `:root` and `.dark` token blocks from `design.md` into `app/globals.css`

## 2. Database & ORM

- [x] 2.1 Neon Postgres project provisioned (`neondb` in eu-central-1), `DATABASE_URL` (pooled) + `DIRECT_URL` added to `.env.local`
- [x] 2.2 Install `prisma@^6`, `@prisma/client@^6`, initialize `prisma/schema.prisma`
- [x] 2.3 Define models: `User`, `Floor`, `Desk`, `Booking` per `design.md` (plus Account / Session / VerificationToken for Auth.js)
- [x] 2.4 Migrations applied on Neon: `btree_gist` extension + EXCLUDE constraint `Booking_no_overlap` using a trigger-populated `during tstzrange` column (required because Postgres marks `tstzrange()` STABLE, blocking it from appearing in index expressions — even when wrapped). Overlap rejection verified by smoke test (`prisma/smoke-overlap.ts`). One-per-user-per-day rule moved to app code per migration comments.
- [x] 2.5 Singleton Prisma client in `lib/prisma.ts` (dev-safe, serverless-safe)
- [x] 2.6 `prisma/seed.ts` seeds admin + 2 floors + 10 desks; `npm run db:seed` wired up via `tsx`; ran successfully against Neon

## 3. Authentication (`user-auth` capability)

- [x] 3.1 Install `next-auth@beta`, `@auth/prisma-adapter`, `resend`
- [x] 3.2 `auth.ts` with Prisma adapter + Resend provider (domain `cdit-works.de`), JWT strategy, 30-day sessions
- [x] 3.3 `/sign-in` form submits to Auth.js, `/sign-in/check-email` confirmation page
- [x] 3.4 `middleware.ts` gates everything except `/`, `/sign-in`, `/sign-in/check-email`, `/forbidden` + Auth.js internals, preserves `?callbackUrl=`
- [x] 3.5 JWT + session callbacks carry `id` and `role`, refreshed via `update` trigger
- [x] 3.6 `<SignOutButton>` in header; admin layout + `/forbidden` landing page added
- [ ] 3.7 Write integration tests: link creation, first-time provisioning, expiry rejection, role gating

## 4. Admin inventory (`desk-inventory` + admin console pieces)

- [ ] 4.1 Create `app/admin/layout.tsx` that enforces `session.user.role === 'admin'` and renders an admin sidebar
- [ ] 4.2 Build `app/admin/floors/page.tsx`: list, create, rename, reorder (drag handles via `@dnd-kit/core`), soft-delete with empty-floor guard
- [ ] 4.3 Build `app/admin/desks/page.tsx`: table grouped by floor, per-row edit dialog for label + attributes, activate/deactivate toggle
- [ ] 4.4 Zod schemas + server actions for each mutation, surfaced via `useFormStatus` + `sonner` toasts
- [ ] 4.5 Tests: label-collision rejection, delete-floor-with-desks rejection, activation flow

## 5. Booking (`desk-booking` capability)

- [ ] 5.1 Create `app/book/page.tsx`: date picker (default today, +60 days max), slot tabs (morning/afternoon/all-day), grid of desks grouped by floor
- [ ] 5.2 Server-side availability query: for a given date, return each active desk with `{ morning, afternoon, allDay } ∈ { free, mine, taken }`
- [ ] 5.3 Booking server action: validate window, validate desk active, enforce one-booking-per-user-per-date, insert row (DB constraint catches concurrent conflicts)
- [ ] 5.4 Build `app/my-bookings/page.tsx`: upcoming + past sections, cancel button on upcoming items
- [ ] 5.5 Cancel server action: owner-or-admin check, reject past startAt, set `status=cancelled` + `cancelledAt`
- [ ] 5.6 Tests: happy-path book, overlap on same slot, all-day vs half-day conflict, second-booking-same-date block, cancel-past rejection, ownership rejection

## 6. Admin booking + utilization views (`admin-console` capability)

- [ ] 6.1 `app/admin/page.tsx` — dashboard: total active desks, desks booked today, 30-day bookings-per-floor bar chart (Recharts)
- [ ] 6.2 `app/admin/bookings/page.tsx` — filterable list (date range + user), admin-cancel with required reason
- [ ] 6.3 `app/admin/users/page.tsx` — list users, role toggle with "at least one admin" guard
- [ ] 6.4 Tests: admin-cancel audit trail written, last-admin demotion rejection

## 7. Polish & a11y

- [ ] 7.1 Sweep keyboard nav on the booking grid (arrow keys move, Space/Enter books)
- [ ] 7.2 Ensure every interactive element has a visible focus ring using `--ring`
- [ ] 7.3 Add `loading.tsx` and `error.tsx` boundaries for each route segment
- [ ] 7.4 Mobile pass at 360px width — floor grid collapses to one column; admin tables scroll horizontally
- [ ] 7.5 Swap mode-dependent hover surfaces to `secondary`/`muted` in `.dark` (lime is too loud for passive states)
- [ ] 7.6 Run Lighthouse: target ≥ 95 Performance / 100 Accessibility on `/book`

## 8. Deploy

- [ ] 8.1 Create a new Vercel project linked to the repo
- [ ] 8.2 Add env vars: `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `AUTH_RESEND_KEY`, `AUTH_URL`, `SEED_ADMIN_EMAIL`, office timezone
- [ ] 8.3 Set `postinstall` to `prisma generate` and add a deploy-time `prisma migrate deploy`
- [ ] 8.4 Verify preview deployment on a PR; smoke-test sign-in + book + cancel end-to-end
- [ ] 8.5 Promote to production; seed the first admin user; invite a real test booker

## 9. Documentation

- [ ] 9.1 Write `README.md`: project overview, stack, screenshots (light + dark), local dev steps, deploy steps
- [ ] 9.2 Capture screenshots: booking grid, admin floor manager, my-bookings, sign-in — light and dark
- [ ] 9.3 Add a `LICENSE` (MIT) and a `CONTRIBUTING.md` stub if this stays public
