/**
 * Dev-only: mint an Auth.js v5 session JWT for a given email so internal
 * tooling (e.g. screenshotting) can hit authed routes without consuming a
 * magic-link token from an email. Uses the app's own AUTH_SECRET, so it's
 * not a bypass — it's the same trust root the app validates against.
 *
 * Do NOT run this in CI for any target other than a local dev server.
 *
 *   set -a && . ./.env.local && set +a && \
 *   npx tsx scripts/mint-dev-session.ts [email]
 */
import { PrismaClient } from "@prisma/client";
import { encode } from "@auth/core/jwt";

async function main() {
  const email = process.argv[2] ?? process.env.SEED_ADMIN_EMAIL;
  if (!email) throw new Error("pass an email or set SEED_ADMIN_EMAIL");
  if (!process.env.AUTH_SECRET) throw new Error("AUTH_SECRET is required");

  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    const now = Math.floor(Date.now() / 1000);
    const jwt = await encode({
      token: {
        sub: user.id,
        id: user.id,
        email: user.email,
        name: user.name ?? user.email,
        role: user.role,
        iat: now,
        exp: now + 60 * 60 * 24 * 30,
      },
      secret: process.env.AUTH_SECRET,
      salt: "authjs.session-token",
    });
    process.stdout.write(jwt);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
