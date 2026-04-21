import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Not authorised</CardTitle>
          <CardDescription>This area is admin-only.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          If you think this is wrong, ask an admin to promote your account.
        </CardContent>
        <CardContent>
          <Button asChild className="w-full" variant="outline">
            <Link href="/">Back home</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
