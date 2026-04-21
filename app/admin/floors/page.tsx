import { prisma } from "@/lib/prisma";
import { FloorList, type FloorRow } from "@/components/admin/floor-list";
import { NewFloorDialog } from "@/components/admin/new-floor-dialog";

export const dynamic = "force-dynamic";

export default async function FloorsPage() {
  const floors = await prisma.floor.findMany({
    where: { active: true },
    orderBy: { displayOrder: "asc" },
    include: { _count: { select: { desks: { where: { active: true } } } } },
  });

  const rows: FloorRow[] = floors.map((f) => ({
    id: f.id,
    name: f.name,
    displayOrder: f.displayOrder,
    activeDeskCount: f._count.desks,
  }));

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Floors &amp; desks</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Drag to reorder. Click a floor to manage its desks.
          </p>
        </div>
        <NewFloorDialog />
      </div>

      <FloorList initial={rows} />
    </div>
  );
}
