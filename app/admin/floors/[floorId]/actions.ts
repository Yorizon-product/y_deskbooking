"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";
import {
  DeskCreateSchema,
  DeskUpdateSchema,
  DeskToggleActiveSchema,
} from "@/lib/validators/inventory";

type ActionResult = { ok: true } | { ok: false; error: string };

function revalidate(floorId: string) {
  revalidatePath(`/admin/floors/${floorId}`);
  revalidatePath("/admin/floors");
}

export async function createDesk(input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = DeskCreateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  try {
    await prisma.desk.create({
      data: {
        floorId: parsed.data.floorId,
        label: parsed.data.label,
        attributes: parsed.data.attributes as Prisma.InputJsonValue,
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, error: "A desk with this label already exists on this floor." };
    }
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003") {
      return { ok: false, error: "Floor not found" };
    }
    throw e;
  }
  revalidate(parsed.data.floorId);
  return { ok: true };
}

export async function updateDesk(input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = DeskUpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const existing = await prisma.desk.findUnique({ where: { id: parsed.data.id } });
  if (!existing) return { ok: false, error: "Desk not found" };

  try {
    await prisma.desk.update({
      where: { id: parsed.data.id },
      data: {
        label: parsed.data.label,
        attributes: parsed.data.attributes as Prisma.InputJsonValue,
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, error: "A desk with this label already exists on this floor." };
    }
    throw e;
  }
  revalidate(existing.floorId);
  return { ok: true };
}

export async function toggleDesk(input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = DeskToggleActiveSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const existing = await prisma.desk.findUnique({ where: { id: parsed.data.id } });
  if (!existing) return { ok: false, error: "Desk not found" };

  await prisma.desk.update({
    where: { id: parsed.data.id },
    data: { active: parsed.data.active },
  });
  revalidate(existing.floorId);
  return { ok: true };
}
