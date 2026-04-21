import { NextResponse, type NextRequest } from "next/server";
import { encode } from "@auth/core/jwt";

import { prisma } from "@/lib/prisma";

/**
 * Dev-only: mint a session for the seeded admin and set the cookie, then
 * redirect to `?next=…`. Used by the webreel recording script so it can
 * drive authed routes without a magic-link round-trip.
 *
 * Guards:
 *   - Refuses unless NODE_ENV !== "production".
 *   - Refuses unless the incoming host is localhost / 127.0.0.1 / *.local.
 *   - Still requires the app's AUTH_SECRET, so this isn't a session-forgery
 *     primitive even if someone points it at prod — they'd need the secret.
 *
 * Vercel runs this in production with NODE_ENV === "production", so both
 * guards will fail and the handler returns 404.
 */
export async function GET(req: NextRequest) {
  const hostname = req.nextUrl.hostname;
  const isLocalHost =
    hostname === "localhost" || hostname === "127.0.0.1" || hostname.endsWith(".local");
  if (process.env.NODE_ENV === "production" || !isLocalHost) {
    return new NextResponse("Not found", { status: 404 });
  }

  if (!process.env.AUTH_SECRET) {
    return new NextResponse("AUTH_SECRET not set", { status: 500 });
  }

  const user = await prisma.user.findFirstOrThrow({ where: { role: "admin" } });
  const rawNext = req.nextUrl.searchParams.get("next") ?? "/";
  const next = rawNext.startsWith("/") ? rawNext : "/";

  const cookieName = "authjs.session-token";
  const now = Math.floor(Date.now() / 1000);
  const MAX_AGE = 60 * 60 * 24;
  const jwt = await encode({
    token: {
      sub: user.id,
      id: user.id,
      email: user.email,
      name: user.name ?? user.email,
      role: user.role,
      iat: now,
      exp: now + MAX_AGE,
      jti: crypto.randomUUID(),
    },
    secret: process.env.AUTH_SECRET,
    salt: cookieName,
  });

  const res = NextResponse.redirect(new URL(next, req.nextUrl.origin));
  res.cookies.set({
    name: cookieName,
    value: jwt,
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
  return res;
}
