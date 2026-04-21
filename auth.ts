import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Resend from "next-auth/providers/resend";
import type { Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { renderMagicLinkHtml, renderMagicLinkText } from "@/lib/email/magic-link";

export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Resend({
      apiKey: process.env.AUTH_RESEND_KEY,
      from: process.env.AUTH_EMAIL_FROM,
      async sendVerificationRequest({ identifier: to, url, provider }) {
        // Auth.js hands us a URL like:
        //   https://app.example.com/api/auth/callback/resend?callbackUrl=…&token=…&email=…
        // That endpoint is GET-only and single-use. Corp mail scanners
        // (Outlook SafeLinks etc.) pre-fetch GET URLs to scan for phishing,
        // which consumes the token before the human clicks. We redirect the
        // email link to our own landing page, which POSTs to complete sign-in.
        const incoming = new URL(url);
        const token = incoming.searchParams.get("token") ?? "";
        const callbackUrl = incoming.searchParams.get("callbackUrl") ?? "/";
        const landing = new URL("/sign-in/go", incoming.origin);
        landing.searchParams.set("token", token);
        landing.searchParams.set("email", to);
        landing.searchParams.set("callbackUrl", callbackUrl);
        const linkUrl = landing.toString();
        const host = incoming.host;
        const appUrl = process.env.AUTH_URL ?? `https://${host}`;
        const html = renderMagicLinkHtml({ url: linkUrl, host, appUrl });
        const text = renderMagicLinkText({ url: linkUrl, host });

        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${provider.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: provider.from,
            to,
            subject: "Sign in to y_deskbooking",
            html,
            text,
          }),
          signal: AbortSignal.timeout(15_000),
        });

        if (!res.ok) {
          const body = await res.text().catch(() => "");
          throw new Error(`Resend send failed (${res.status}): ${body}`);
        }
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 /* 30 days */ },
  pages: {
    signIn: "/sign-in",
    verifyRequest: "/sign-in/check-email",
    error: "/sign-in",
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      // On sign-in, `user` is populated from the adapter (incl. `role`).
      if (user) {
        token.id = user.id;
        token.role = (user as { role: Role }).role;
      }
      // Refresh role if the session is updated (e.g. after admin promotion).
      if (trigger === "update" && token.id) {
        const fresh = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true },
        });
        if (fresh) token.role = fresh.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
      }
      return session;
    },
  },
});
