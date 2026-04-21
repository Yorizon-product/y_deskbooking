import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Magic-link landing page. Email providers (Outlook SafeLinks, Gmail, Proofpoint,
 * Mimecast, …) pre-fetch GETs on every URL in an inbound email to scan for
 * phishing. If the email linked directly to `/api/auth/callback/resend`, the
 * scanner's GET would consume the single-use token before the human ever sees it.
 *
 * This page is inert — it reads the token from the query string and renders a
 * form that POSTs to `/sign-in/go/complete` when the user actually clicks.
 * Scanners don't submit POSTs, so the token survives until the human click.
 */
export default async function MagicLinkLandingPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; email?: string; callbackUrl?: string }>;
}) {
  const { token = "", email = "", callbackUrl = "/" } = await searchParams;
  const hasToken = !!token && !!email;

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Complete sign-in</CardTitle>
          <CardDescription>
            {hasToken ? (
              <>You requested a sign-in to y_deskbooking. Click below to finish.</>
            ) : (
              <>This link is missing information. Try requesting a new one.</>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hasToken ? (
            <form method="POST" action="/sign-in/go/complete" className="space-y-4">
              <input type="hidden" name="token" value={token} />
              <input type="hidden" name="email" value={email} />
              <input type="hidden" name="callbackUrl" value={callbackUrl} />
              <Button type="submit" size="lg" className="w-full">
                Sign in as {email}
              </Button>
              <p className="text-xs text-muted-foreground">
                This link is single-use and expires after a short time. If it fails, request a new one.
              </p>
            </form>
          ) : (
            <Button asChild className="w-full">
              <Link href="/sign-in">Request a new link</Link>
            </Button>
          )}
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground">
          <Link href="/sign-in" className="hover:text-foreground">
            &larr; Back to sign-in
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
