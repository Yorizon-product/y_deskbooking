import { z } from "zod";

export const FloorCreateSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(60, "Name is too long"),
});

export const FloorRenameSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1, "Name is required").max(60, "Name is too long"),
});

export const FloorReorderSchema = z.object({
  orderedIds: z.array(z.string().min(1)).min(1),
});

export const FloorDeleteSchema = z.object({
  id: z.string().min(1),
});

export const DeskAttributesSchema = z
  .object({
    monitor: z.boolean().optional(),
    standing: z.boolean().optional(),
    accessible: z.boolean().optional(),
  })
  .strict();

export type DeskAttributes = z.infer<typeof DeskAttributesSchema>;

export const DeskCreateSchema = z.object({
  floorId: z.string().min(1),
  label: z.string().trim().min(1, "Label is required").max(24, "Label is too long"),
  attributes: DeskAttributesSchema.default({}),
});

export const DeskUpdateSchema = z.object({
  id: z.string().min(1),
  label: z.string().trim().min(1, "Label is required").max(24, "Label is too long"),
  attributes: DeskAttributesSchema.default({}),
});

export const DeskToggleActiveSchema = z.object({
  id: z.string().min(1),
  active: z.boolean(),
});
