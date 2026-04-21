import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CommitBadge } from "@/components/commit-badge";
import { SignInForm } from "@/components/sign-in-form";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>We&apos;ll email you a single-use link. No passwords.</CardDescription>
        </CardHeader>
        <CardContent>
          <SignInForm callbackUrl={params.callbackUrl} />
          {params.error ? (
            <p className="mt-4 text-sm text-destructive">
              Sign-in failed. Try requesting a new link.
            </p>
          ) : null}
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            &larr; Back home
          </Link>
        </CardFooter>
      </Card>
      <CommitBadge />
    </div>
  );
}
