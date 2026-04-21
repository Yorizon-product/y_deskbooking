import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function BookPage() {
  const floors = [
    { name: "Floor 1", desks: ["1-A", "1-B", "1-C", "1-D", "1-E", "1-F"] },
    { name: "Floor 2", desks: ["2-A", "2-B", "2-C", "2-D"] },
  ];

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            y_deskbooking
          </Link>
          <Button asChild variant="outline" size="sm">
            <Link href="/sign-in">Sign in</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Book a desk</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Preview layout &mdash; real availability lands with task 5.x.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">Morning</Button>
            <Button size="sm">All day</Button>
            <Button variant="outline" size="sm">Afternoon</Button>
          </div>
        </div>

        {floors.map((floor) => (
          <section key={floor.name} className="mb-10">
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
              {floor.name}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {floor.desks.map((d) => (
                <Card key={d}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Desk {d}</CardTitle>
                    <CardDescription>Monitor &middot; Standing-capable</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Button size="sm" className="w-full" disabled>
                      Book
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
