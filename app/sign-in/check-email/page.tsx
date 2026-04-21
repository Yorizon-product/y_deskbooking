import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function CheckEmailPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Check your inbox</CardTitle>
          <CardDescription>
            We&apos;ve sent a sign-in link to your email. It expires in 24 hours and can only be used
            once.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          You can close this tab — the link opens a fresh session on whatever device you click it from.
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground">
          <Link href="/sign-in" className="hover:text-foreground">
            &larr; Didn&apos;t get it? Try again
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
