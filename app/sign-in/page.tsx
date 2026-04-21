import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignInPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>We&apos;ll email you a single-use link. No passwords.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Work email</Label>
              <Input id="email" name="email" type="email" placeholder="you@company.com" autoComplete="email" required />
            </div>
            <Button type="submit" className="w-full" disabled>
              Email me a link
            </Button>
            <p className="text-xs text-muted-foreground">
              Auth wiring lands in task 3.x &mdash; this form isn&apos;t live yet.
            </p>
          </form>
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            &larr; Back home
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
