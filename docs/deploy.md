# Deploy to Vercel + Neon

Target: a single Vercel project linked to this repo, backed by the Neon
Postgres project that already holds our schema. Preview URLs per PR,
production at whatever domain you point at the project.

## Prerequisites

- The Neon project from `.env.local` is up and has both migrations applied.
  (Confirm with `npx prisma migrate status`.)
- A Vercel account with permission to deploy to the target team/org.
- Resend is verified for the sending domain in `AUTH_EMAIL_FROM`
  (`cdit-works.de` for this project).

## Steps

### 1. Provision the project

Link the repo with the Vercel CLI:

```bash
vercel link
# Follow prompts; scope to the correct team, accept default project name.
```

Or via dashboard: **New project → import `Yorizon-product/y_deskbooking`**.

### 2. Environment variables

In the Vercel project's **Settings → Environment Variables**, add each of
these. Mirror `.env.local`; generate fresh secrets where noted.

| Var | Production | Preview |
|---|---|---|
| `DATABASE_URL` | Neon pooled connection | Same (or a Neon branch) |
| `DIRECT_URL` | Neon direct connection | Same (or a Neon branch) |
| `AUTH_SECRET` | `openssl rand -base64 32` — new for prod | can be same as prod |
| `AUTH_URL` | Your production URL (e.g. `https://y-deskbooking.vercel.app`) | leave unset; Vercel sets `NEXTAUTH_URL` automatically for previews, but set `AUTH_TRUST_HOST=true` so Auth.js accepts the dynamic host |
| `AUTH_TRUST_HOST` | `true` | `true` |
| `AUTH_RESEND_KEY` | Resend production key | Dev key is fine |
| `AUTH_EMAIL_FROM` | `noreply@cdit-works.de` | Same |
| `SEED_ADMIN_EMAIL` | `k.romkes@gmail.com` | Same |
| `OFFICE_TZ` | `Europe/Berlin` | Same |

> Treat `DATABASE_URL` / `DIRECT_URL` / `AUTH_SECRET` / `AUTH_RESEND_KEY`
> as secrets. Don't log, echo, or commit them.

### 3. Build + migrate on deploy

Vercel's default build for Next works. Add a `postinstall` hook — or the
equivalent build command override — so migrations run before the app boots:

```jsonc
// package.json
{
  "scripts": {
    "postinstall": "prisma generate",
    "vercel-build": "prisma migrate deploy && next build"
  }
}
```

Then in Vercel: **Settings → General → Build & Development Settings → Build
Command** → set to `npm run vercel-build`.

> Why not run migrations in a separate step? Vercel builds don't have a
> safe out-of-band migration runner, and the schema is additive at this
> stage — `migrate deploy` is idempotent and quick.

### 4. First deploy

Push a commit or trigger from the dashboard. You'll get a preview URL.
Smoke test:

1. Open the preview URL → home page renders with the Yorizon theme.
2. Go to `/sign-in`, submit your email.
3. Click the magic link in your inbox. Should land on `/book`.
4. Book a desk. Cancel it. Book again.
5. If your seeded admin email matches `SEED_ADMIN_EMAIL`, go to `/admin/floors` and try CRUD on floors + desks.

### 5. Promote to production

Either click **Promote to production** on the preview deployment or push
to `main`. The production URL is whatever domain you've assigned.

## Rollback strategy

- **App-level:** Vercel's previous-deployment rollback is one click in the
  dashboard.
- **Schema:** Migrations are additive-first, so rolling the app back to a
  previous deployment doesn't require a schema revert. If you ever need
  destructive migrations, gate them behind a feature flag and ship the
  removal in a follow-up deploy once nothing references the field.
- **Auth:** Rotating `AUTH_SECRET` invalidates every active session. Do
  this immediately if the secret leaks.

## Self-host alternative

If Vercel becomes undesirable later, add a `Dockerfile` that runs
`next build` + `next start`, ship the container to any container host,
and point it at Postgres. The schema, Auth.js, and Resend flow are all
portable — no Vercel-specific hooks are used.
