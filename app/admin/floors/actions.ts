"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";
import {
  FloorCreateSchema,
  FloorRenameSchema,
  FloorReorderSchema,
  FloorDeleteSchema,
} from "@/lib/validators/inventory";

type ActionResult = { ok: true } | { ok: false; error: string };

export async function createFloor(input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = FloorCreateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const max = await prisma.floor.aggregate({
    where: { active: true },
    _max: { displayOrder: true },
  });
  await prisma.floor.create({
    data: { name: parsed.data.name, displayOrder: (max._max.displayOrder ?? 0) + 1 },
  });
  revalidatePath("/admin/floors");
  return { ok: true };
}

export async function renameFloor(input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = FloorRenameSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const existing = await prisma.floor.findUnique({ where: { id: parsed.data.id } });
  if (!existing || !existing.active) return { ok: false, error: "Floor not found" };

  await prisma.floor.update({
    where: { id: parsed.data.id },
    data: { name: parsed.data.name },
  });
  revalidatePath("/admin/floors");
  return { ok: true };
}

export async function reorderFloors(input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = FloorReorderSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  await prisma.$transaction(
    parsed.data.orderedIds.map((id, index) =>
      prisma.floor.update({
        where: { id },
        data: { displayOrder: index + 1 },
      })
    )
  );
  revalidatePath("/admin/floors");
  return { ok: true };
}

export async function deleteFloor(input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = FloorDeleteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const deskCount = await prisma.desk.count({
    where: { floorId: parsed.data.id, active: true },
  });
  if (deskCount > 0) {
    return {
      ok: false,
      error: "This floor still has active desks. Move or deactivate them first.",
    };
  }

  try {
    await prisma.floor.update({
      where: { id: parsed.data.id },
      data: { active: false },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return { ok: false, error: "Floor not found" };
    }
    throw e;
  }
  revalidatePath("/admin/floors");
  return { ok: true };
}
