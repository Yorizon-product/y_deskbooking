import { NextResponse, type NextRequest } from "next/server";
import { encode } from "@auth/core/jwt";

import { prisma } from "@/lib/prisma";

/**
 * Match Auth.js v5's token-hashing scheme so we can look up the row it created.
 * Auth.js stores sha256(`${rawToken}${secret}`) in VerificationToken.token, not
 * the raw value — see @auth/core's handleLogin email flow.
 */
async function hashEmailToken(rawToken: string, secret: string): Promise<string> {
  const data = new TextEncoder().encode(`${rawToken}${secret}`);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * POST-only handler that finalises a magic-link sign-in.
 *
 * Why this exists: corp email gateways (Outlook SafeLinks and friends)
 * pre-fetch every GET URL in inbound mail to scan for phishing. If the
 * magic-link email pointed at Auth.js's GET callback, the scanner's
 * fetch would consume the single-use token before the human clicked.
 *
 * The landing page at `/sign-in/go` hosts a form that POSTs here on
 * user-initiated click. POSTs are not pre-fetched by scanners, so the
 * token reaches this handler uneaten. We then replicate the bits of
 * Auth.js's email-token flow we need:
 *   - atomically consume the VerificationToken row (Prisma `delete`)
 *   - upsert the User (auto-provisioning on first sign-in)
 *   - mint a JWT session cookie with the same secret + salt Auth.js uses,
 *     so all downstream code (middleware, `auth()` in RSC) accepts it
 *     transparently.
 */
export async function POST(req: NextRequest) {
  const form = await req.formData();
  const token = String(form.get("token") ?? "").trim();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const rawCallback = String(form.get("callbackUrl") ?? "/");

  const origin = req.nextUrl.origin;
  const signInFail = new URL("/sign-in?error=Verification", origin);
  if (!token || !email) return NextResponse.redirect(signInFail);

  // Auth.js stores the hash of (rawToken + secret); the email carries the raw.
  const hashedToken = await hashEmailToken(token, process.env.AUTH_SECRET!);

  // Atomic fetch + delete: the token is single-use even under retries.
  let vt;
  try {
    vt = await prisma.verificationToken.delete({
      where: { identifier_token: { identifier: email, token: hashedToken } },
    });
  } catch {
    return NextResponse.redirect(signInFail);
  }

  if (vt.expires.getTime() < Date.now()) {
    return NextResponse.redirect(signInFail);
  }

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, role: "user" },
  });

  // Mint the session JWT with the exact shape Auth.js expects so the
  // middleware's `auth()` check recognises it.
  const useSecureCookies =
    req.nextUrl.protocol === "https:" ||
    req.headers.get("x-forwarded-proto") === "https";
  const cookieName = useSecureCookies
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";
  const now = Math.floor(Date.now() / 1000);
  const MAX_AGE = 60 * 60 * 24 * 30; // 30 days
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
    secret: process.env.AUTH_SECRET!,
    salt: cookieName,
  });

  // Safe-redirect: only same-origin callback URLs are accepted.
  let callbackUrl: URL;
  try {
    callbackUrl = new URL(rawCallback, origin);
    if (callbackUrl.origin !== origin) callbackUrl = new URL("/", origin);
  } catch {
    callbackUrl = new URL("/", origin);
  }

  const res = NextResponse.redirect(callbackUrl);
  res.cookies.set({
    name: cookieName,
    value: jwt,
    httpOnly: true,
    secure: useSecureCookies,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
  return res;
}

// Refuse GET so scanners that try to pre-fetch this endpoint get a clean 405
// instead of accidentally doing anything.
export function GET() {
  return new NextResponse("Method Not Allowed", { status: 405 });
}
