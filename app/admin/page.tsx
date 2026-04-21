import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminDashboard() {
  const [activeDesks, floorCount, userCount] = await Promise.all([
    prisma.desk.count({ where: { active: true } }),
    prisma.floor.count({ where: { active: true } }),
    prisma.user.count(),
  ]);

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">Admin dashboard</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Utilisation widgets land with task group 6. For now: quick counts.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Active floors</CardDescription>
            <CardTitle className="text-3xl">{floorCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Active desks</CardDescription>
            <CardTitle className="text-3xl">{activeDesks}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Users</CardDescription>
            <CardTitle className="text-3xl">{userCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Next up</CardTitle>
          <CardDescription>Task groups 4 &amp; 6 wire the real management screens.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          &bull; Floors &amp; desks manager<br />
          &bull; Booking oversight + admin-cancel<br />
          &bull; Users &amp; role toggle
        </CardContent>
      </Card>
    </div>
  );
}
