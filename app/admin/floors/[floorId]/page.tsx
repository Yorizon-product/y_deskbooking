import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { prisma } from "@/lib/prisma";
import {
  DeskAttributesSchema,
  type DeskAttributes,
} from "@/lib/validators/inventory";
import { Button } from "@/components/ui/button";
import { DeskDialog } from "@/components/admin/desk-dialog";
import { DeskRow, type DeskRowData } from "@/components/admin/desk-row";

export const dynamic = "force-dynamic";

export default async function FloorDesksPage({
  params,
}: {
  params: Promise<{ floorId: string }>;
}) {
  const { floorId } = await params;
  const floor = await prisma.floor.findUnique({
    where: { id: floorId },
    include: {
      desks: { orderBy: { label: "asc" } },
    },
  });
  if (!floor || !floor.active) notFound();

  const desks: DeskRowData[] = floor.desks.map((d) => ({
    id: d.id,
    label: d.label,
    active: d.active,
    attributes: DeskAttributesSchema.catch({} as DeskAttributes).parse(d.attributes ?? {}),
  }));

  const activeCount = desks.filter((d) => d.active).length;

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
        <Link href="/admin/floors">
          <ChevronLeft className="h-4 w-4" /> All floors
        </Link>
      </Button>

      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{floor.name}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {activeCount} active of {desks.length} total desk{desks.length === 1 ? "" : "s"}
          </p>
        </div>
        <DeskDialog mode={{ kind: "create", floorId: floor.id }} />
      </div>

      {desks.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center">
          <p className="text-sm text-muted-foreground">
            No desks on this floor yet. Add the first one above.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Label</th>
                <th className="px-4 py-3 font-medium">Attributes</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Edit</th>
              </tr>
            </thead>
            <tbody>
              {desks.map((desk) => (
                <DeskRow key={desk.id} desk={desk} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
