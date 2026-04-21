## Context

`desk-booking-tool` is a greenfield web application. The proposal identifies four capabilities (`user-auth`, `desk-inventory`, `desk-booking`, `admin-console`) and defers tech stack, data store, and visual design to this document. The product is employee-facing, so it must run well on desktop and mobile browsers, feel fast to interact with during daily booking flows, and stay accessible. The visual identity is pre-decided: the **Yorizon** theme on top of shadcn/ui — a dark olive + electric lime palette with cream light mode and near-black dark mode.

Stakeholders: employees (book a desk), office admins (manage inventory, review utilization), and a single-owner maintainer (us). No integration with an existing auth provider or HR system is required for v1.

## Goals / Non-Goals

**Goals:**
- Ship a working end-to-end booking flow (sign-in → pick date → pick desk → confirm → see booking) with conflict prevention.
- Use a single, modern full-stack TypeScript framework so the same repo owns UI, API, and DB access.
- Adopt a componentized UI built on shadcn/ui, themed with **Yorizon** (values below), supporting both light and dark modes out of the box.
- Keep the data model transactional so two people can't double-book a desk under concurrency.
- Keep the v1 deploy target simple (one-service-plus-DB) so ops is not a distraction.

**Non-Goals:**
- SSO / SAML / Microsoft Entra / Google Workspace integrations (future work).
- Multi-tenant / multi-company support — single organization only for v1.
- Recurring bookings, team bookings, desk swaps, waitlists, or check-in flows — parked for later.
- Native mobile apps — responsive web only.
- Real-time collaboration (live presence on the floor plan) — v1 uses simple fetch-on-load plus revalidation.

## Decisions

### 1. Framework: Next.js (App Router) + TypeScript

**Chose Next.js** over Remix, Astro, and a split SPA+API because:
- Server Components let us render the floor plan / booking list server-side with zero client JS for the read path, which keeps the UI feeling instant.
- Route Handlers (`app/api/**/route.ts`) give us a first-class API surface without a second server.
- It's the reference integration for shadcn/ui — the Yorizon tokens below drop straight into `app/globals.css`.
- It's a boring, well-documented choice, which matches the "single maintainer, ship it" posture.

Alternatives considered:
- **Remix** — equally capable, but shadcn/ui docs and community examples skew Next.
- **SvelteKit** — smaller, but shadcn-svelte is less mature; we'd lose the Yorizon theme ergonomics.
- **SPA + separate API** — two deploy targets, more moving parts, no SSR wins.

### 2. Data store: PostgreSQL via Prisma

**Chose Postgres** because bookings are a classic transactional workload — we need `SERIALIZABLE` / row-level locking to guarantee no two bookings overlap on the same desk. SQLite is tempting for simplicity but concurrent writes get ugly, and we want this to survive past the MVP.

**Chose Prisma** as the ORM because: typed schema, painless migrations, good DX. Drizzle is a reasonable alternative and would be chosen if we later need finer control over SQL; Prisma's tradeoff (generated client, no raw query composition) is acceptable at this scale.

Overlap prevention uses a Postgres `EXCLUDE` constraint on `(desk_id, tstzrange(start_at, end_at))` with `WHERE status = 'confirmed'`, enforced at the DB — not just in app code. This makes the invariant impossible to violate even under concurrent requests.

### 3. Authentication: Auth.js (NextAuth v5) with credential + email-magic-link providers

**Chose Auth.js** for v1 because it's the de-facto Next auth library, plays nicely with Prisma (official adapter), and lets us start with email magic-links (passwordless) to skip password UX entirely. Role (`user` / `admin`) is stored on the `User` row and surfaced on the session token, checked in a `middleware.ts` matcher for `/admin/**` and in server actions.

Alternatives: Lucia (lower-level, more code), Clerk (hosted, but we've said single-tenant self-hosted), roll-your-own (no).

### 4. UI: shadcn/ui + Tailwind v4, themed with **Yorizon**

shadcn/ui components are copied into the repo (not a library dep), so we own them and can restyle freely. Yorizon is applied as CSS custom properties at the `:root` and `.dark` scopes per shadcn convention. The full token set — colors, radius, typography, shadows — is embedded below so this doc is self-contained and doesn't depend on the online editor.

#### Yorizon theme tokens

Drop this into `app/globals.css` (after the Tailwind directives):

```css
:root {
  --background: hsl(60 33.3333% 97.0588%);
  --foreground: hsl(75 16.6667% 9.4118%);
  --card: hsl(0 0% 100%);
  --card-foreground: hsl(75 16.6667% 9.4118%);
  --popover: hsl(0 0% 100%);
  --popover-foreground: hsl(75 16.6667% 9.4118%);
  --primary: hsl(68.8889 25.7143% 20.5882%);          /* dark olive */
  --primary-foreground: hsl(68.3843 99.1342% 54.7059%); /* electric lime */
  --secondary: hsl(66.6667 24.3243% 92.7451%);
  --secondary-foreground: hsl(68.8889 25.7143% 20.5882%);
  --muted: hsl(66.6667 24.3243% 92.7451%);
  --muted-foreground: hsl(69 10% 39.2157%);
  --accent: hsl(68.3843 99.1342% 54.7059%);           /* electric lime */
  --accent-foreground: hsl(68.8889 25.7143% 20.5882%);
  --destructive: hsl(0 72.2222% 50.5882%);
  --destructive-foreground: hsl(0 0% 100%);
  --border: hsl(64.6154 14.6067% 82.5490%);
  --input: hsl(64.6154 14.6067% 82.5490%);
  --ring: hsl(68.8889 25.7143% 20.5882%);

  --chart-1: hsl(68.8889 25.7143% 20.5882%);
  --chart-2: hsl(68.3843 99.1342% 54.7059%);
  --chart-3: hsl(69 10% 39.2157%);
  --chart-4: hsl(70.7143 13.8614% 60.3922%);
  --chart-5: hsl(75 16.6667% 9.4118%);

  --sidebar: hsl(60 23.0769% 94.9020%);
  --sidebar-foreground: hsl(75 16.6667% 9.4118%);
  --sidebar-primary: hsl(68.8889 25.7143% 20.5882%);
  --sidebar-primary-foreground: hsl(68.3843 99.1342% 54.7059%);
  --sidebar-accent: hsl(68 26.3158% 88.8235%);
  --sidebar-accent-foreground: hsl(68.8889 25.7143% 20.5882%);
  --sidebar-border: hsl(64.6154 14.6067% 82.5490%);
  --sidebar-ring: hsl(68.8889 25.7143% 20.5882%);

  --radius: 0.5rem;

  --font-sans: Inter, sans-serif;
  --font-serif: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;

  --tracking-normal: 0em;
  --spacing: 0.25rem;

  --shadow-2xs: 0 1px 3px 0px hsl(68.8889 25.7143% 20.5882% / 0.04);
  --shadow-xs:  0 1px 3px 0px hsl(68.8889 25.7143% 20.5882% / 0.04);
  --shadow-sm:  0 1px 3px 0px hsl(68.8889 25.7143% 20.5882% / 0.08), 0 1px 2px -1px hsl(68.8889 25.7143% 20.5882% / 0.08);
  --shadow:     0 1px 3px 0px hsl(68.8889 25.7143% 20.5882% / 0.08), 0 1px 2px -1px hsl(68.8889 25.7143% 20.5882% / 0.08);
  --shadow-md:  0 1px 3px 0px hsl(68.8889 25.7143% 20.5882% / 0.08), 0 2px 4px -1px hsl(68.8889 25.7143% 20.5882% / 0.08);
  --shadow-lg:  0 1px 3px 0px hsl(68.8889 25.7143% 20.5882% / 0.08), 0 4px 6px -1px hsl(68.8889 25.7143% 20.5882% / 0.08);
  --shadow-xl:  0 1px 3px 0px hsl(68.8889 25.7143% 20.5882% / 0.08), 0 8px 10px -1px hsl(68.8889 25.7143% 20.5882% / 0.08);
  --shadow-2xl: 0 1px 3px 0px hsl(68.8889 25.7143% 20.5882% / 0.20);
}

.dark {
  --background: hsl(90 5.8824% 6.6667%);
  --foreground: hsl(68.5714 14.8936% 90.7843%);
  --card: hsl(75 16.6667% 9.4118%);
  --card-foreground: hsl(68.5714 14.8936% 90.7843%);
  --popover: hsl(75 16.6667% 9.4118%);
  --popover-foreground: hsl(68.5714 14.8936% 90.7843%);
  --primary: hsl(68.3843 99.1342% 54.7059%);          /* electric lime becomes the loud one in dark */
  --primary-foreground: hsl(75 16.6667% 9.4118%);
  --secondary: hsl(75 11.1111% 14.1176%);
  --secondary-foreground: hsl(68.5714 14.8936% 90.7843%);
  --muted: hsl(75 11.1111% 14.1176%);
  --muted-foreground: hsl(69.4737 8.8372% 57.8431%);
  --accent: hsl(68.8889 25.7143% 20.5882%);
  --accent-foreground: hsl(68.3843 99.1342% 54.7059%);
  --destructive: hsl(0 84.2365% 60.1961%);
  --destructive-foreground: hsl(0 0% 100%);
  --border: hsl(75 12.5% 18.8235%);
  --input: hsl(75 12.5% 18.8235%);
  --ring: hsl(68.3843 99.1342% 54.7059%);

  --chart-1: hsl(68.3843 99.1342% 54.7059%);
  --chart-2: hsl(68.8889 25.7143% 20.5882%);
  --chart-3: hsl(69.4737 8.8372% 57.8431%);
  --chart-4: hsl(69 10% 39.2157%);
  --chart-5: hsl(68.5714 14.8936% 90.7843%);

  --sidebar: hsl(90 5.8824% 6.6667%);
  --sidebar-foreground: hsl(68.5714 14.8936% 90.7843%);
  --sidebar-primary: hsl(68.3843 99.1342% 54.7059%);
  --sidebar-primary-foreground: hsl(75 16.6667% 9.4118%);
  --sidebar-accent: hsl(75 11.1111% 14.1176%);
  --sidebar-accent-foreground: hsl(68.5714 14.8936% 90.7843%);
  --sidebar-border: hsl(75 12.5% 18.8235%);
  --sidebar-ring: hsl(68.3843 99.1342% 54.7059%);

  --shadow-2xs: 0 1px 3px 0px hsl(0 0% 0% / 0.15);
  --shadow-xs:  0 1px 3px 0px hsl(0 0% 0% / 0.15);
  --shadow-sm:  0 1px 3px 0px hsl(0 0% 0% / 0.30), 0 1px 2px -1px hsl(0 0% 0% / 0.30);
  --shadow:     0 1px 3px 0px hsl(0 0% 0% / 0.30), 0 1px 2px -1px hsl(0 0% 0% / 0.30);
  --shadow-md:  0 1px 3px 0px hsl(0 0% 0% / 0.30), 0 2px 4px -1px hsl(0 0% 0% / 0.30);
  --shadow-lg:  0 1px 3px 0px hsl(0 0% 0% / 0.30), 0 4px 6px -1px hsl(0 0% 0% / 0.30);
  --shadow-xl:  0 1px 3px 0px hsl(0 0% 0% / 0.30), 0 8px 10px -1px hsl(0 0% 0% / 0.30);
  --shadow-2xl: 0 1px 3px 0px hsl(0 0% 0% / 0.75);
}
```

Notes on applying the theme:
- Use `next-themes` for light/dark toggling; it toggles the `.dark` class on `<html>`, which matches the scopes above.
- Load **Inter** via `next/font/google` and assign it to `--font-sans` so server-rendered pages don't swap fonts.
- The `--primary` / `--accent` swap between modes is intentional — the Yorizon identity flips which of (olive, lime) carries the loud role. Don't "fix" this in components.
- Use `primary` for destinations users should be pulled toward (Book, Save, primary nav active state). Reserve `destructive` for cancellation / delete. Use `accent` for subtle surfaces like hover backgrounds — it's the louder color in dark mode, so on `.dark` a hover state should use `secondary` or `muted` instead to avoid flashbangs. Component variants in `ui/button.tsx` etc. should encode this.

### 5. State & data fetching

- **Server:** React Server Components + server actions for mutations. The booking form submits via a server action that runs the Prisma transaction.
- **Client:** TanStack Query only where we genuinely need client-side revalidation (e.g. the live availability grid when the user changes date). Everywhere else, the RSC render is enough.
- **Forms:** `react-hook-form` + `zod` resolver for validation, matching shadcn/ui's form conventions. Zod schemas are shared between client and server actions.

### 6. Domain model (v1)

```
User       (id, email, name, role: 'user' | 'admin', createdAt)
Floor      (id, name, displayOrder)
Desk       (id, floorId, label, attributes: jsonb, active: bool)
Booking    (id, deskId, userId, startAt, endAt, status: 'confirmed' | 'cancelled' | 'completed', createdAt, cancelledAt?)
```

Invariants enforced in the DB:
- Postgres range-exclusion on `Booking` prevents overlapping `confirmed` bookings for the same desk.
- `Booking.endAt > Booking.startAt` — check constraint.
- `Desk.active = false` desks are filtered out of availability queries but remain for historical booking integrity.

### 7. Deploy target

Vercel for the Next app + a managed Postgres (Neon or Supabase Postgres — decided in `tasks.md`). This is the cheapest zero-ops option that gives us proper Postgres and preview deploys per branch. A Dockerfile is included so self-hosting later is a small lift, not a rewrite.

## Risks / Trade-offs

- **[Auth.js + Postgres adapter setup friction]** → Cover it in `tasks.md` with a step-by-step; use the official template as a starting point rather than wiring from scratch.
- **[Prisma on serverless can exhaust connections]** → Use `Prisma Accelerate` or the Neon serverless driver. Decide in tasks based on chosen DB host.
- **[Exclusion constraint requires `btree_gist` extension]** → Add a migration to `CREATE EXTENSION IF NOT EXISTS btree_gist;` before the table migration; document in runbook.
- **[Yorizon's electric lime primary in dark mode is visually loud]** → Use it sparingly (one CTA per view). Enforce via button variant usage guidelines in component review.
- **[Magic-link email deliverability]** → Use a transactional provider (Resend) with a verified domain; document DNS setup. Also ship a credential-login fallback in admin accounts so we're never locked out.
- **[No SSO]** → Acceptable for v1 per non-goals, but flag to any pilot customer up front.
- **[Single-region Postgres on a global web host]** → Keep the DB region co-located with Vercel's functions region for the deployment. Revisit if latency matters.

## Migration Plan

Greenfield — no existing data or services to migrate. Deployment is a standard first-release:
1. Provision DB, run initial Prisma migrations (including `btree_gist` + exclusion constraint).
2. Seed a first admin user via a one-off script.
3. Ship to `preview`, smoke-test the booking flow end-to-end.
4. Promote to production.

Rollback strategy: Vercel previous-deployment rollback is a click; schema changes after v1 go through additive-then-destructive migrations so rollback doesn't require schema revert.

## Open Questions

- **Time model:** Are v1 bookings per-day (all-day reservation, simpler UX, fewer conflicts) or per time-window (half-day / custom range)? Half-day is a common sweet spot; default to half-day with `morning` / `afternoon` / `all-day` presets unless the user says otherwise.
- **Postgres host:** Neon (better serverless story, branching for previews) vs Supabase Postgres (bundles auth, but we're not using it). Leaning Neon.
- **Admin bootstrap:** CLI seed script vs an env-var-gated "first sign-in becomes admin" rule. Leaning seed script.
- **Floor plan representation:** Grid-of-desk-cards (v1, trivial) vs uploaded SVG floor plan with hotspots (later). Decide which to ship in v1 before tasks.
- **Timezone:** Single office timezone (stored in an env var), or per-user? v1 assumes single office timezone; all `DateTime` stored as UTC and rendered in that TZ.
