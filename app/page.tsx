import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            y_deskbooking
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-16">
        <section className="mb-16 max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Hot-desking, without the spreadsheet
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
            Book a desk. That&apos;s the whole app.
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            Pick a date, pick a desk, see it on the floor grid. Admins manage the inventory. The database
            guarantees no two people ever get the same desk.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/book">Go to booking</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/sign-in">Sign in</Link>
            </Button>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Employee flow</CardTitle>
              <CardDescription>Sign in, pick a slot, book a desk. Cancel when plans change.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Morning, afternoon, or all-day. One booking per person per day.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Admin console</CardTitle>
              <CardDescription>Floors, desks, bookings, users &mdash; all in one place.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Promote teammates to admin. Cancel with a reason. See utilisation at a glance.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Never double-booked</CardTitle>
              <CardDescription>Guaranteed by a Postgres range-exclusion constraint.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Two requests for the same desk &mdash; one wins, one gets a clear conflict message. Always.
            </CardContent>
          </Card>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6 text-sm text-muted-foreground">
          <span>Yorizon theme &middot; shadcn/ui</span>
          <Link href="https://github.com/Yorizon-product/y_deskbooking" className="hover:text-foreground">
            GitHub
          </Link>
        </div>
      </footer>
    </div>
  );
}
