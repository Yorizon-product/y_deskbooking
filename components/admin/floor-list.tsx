"use client";

import * as React from "react";
import Link from "next/link";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { deleteFloor, renameFloor, reorderFloors } from "@/app/admin/floors/actions";

export type FloorRow = {
  id: string;
  name: string;
  displayOrder: number;
  activeDeskCount: number;
};

export function FloorList({ initial }: { initial: FloorRow[] }) {
  const [floors, setFloors] = React.useState(initial);
  React.useEffect(() => setFloors(initial), [initial]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  async function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = floors.findIndex((f) => f.id === active.id);
    const newIndex = floors.findIndex((f) => f.id === over.id);
    const next = arrayMove(floors, oldIndex, newIndex);
    setFloors(next); // optimistic
    const result = await reorderFloors({ orderedIds: next.map((f) => f.id) });
    if (!result.ok) {
      toast.error(result.error);
      setFloors(floors); // rollback
    }
  }

  if (floors.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-10 text-center">
        <p className="text-sm text-muted-foreground">No floors yet. Add your first one above.</p>
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={floors.map((f) => f.id)} strategy={verticalListSortingStrategy}>
        <ul className="divide-y divide-border rounded-lg border border-border">
          {floors.map((floor) => (
            <FloorRowItem key={floor.id} floor={floor} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function FloorRowItem({ floor }: { floor: FloorRow }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: floor.id,
  });
  const [editing, setEditing] = React.useState(false);
  const [name, setName] = React.useState(floor.name);
  const [submitting, setSubmitting] = React.useState(false);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  async function saveName() {
    const trimmed = name.trim();
    if (!trimmed || trimmed === floor.name) {
      setEditing(false);
      setName(floor.name);
      return;
    }
    setSubmitting(true);
    const result = await renameFloor({ id: floor.id, name: trimmed });
    setSubmitting(false);
    if (!result.ok) {
      toast.error(result.error);
      setName(floor.name);
      setEditing(false);
      return;
    }
    toast.success("Floor renamed");
    setEditing(false);
  }

  async function onDelete() {
    if (floor.activeDeskCount > 0) {
      toast.error("Move or deactivate the desks on this floor first.");
      return;
    }
    if (!confirm(`Delete "${floor.name}"?`)) return;
    const result = await deleteFloor({ id: floor.id });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Floor deleted");
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 bg-background px-3 py-3 first:rounded-t-lg last:rounded-b-lg"
    >
      <button
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
        className="cursor-grab rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <div className="min-w-0 flex-1">
        {editing ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveName();
            }}
            className="flex gap-2"
          >
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              maxLength={60}
              className="h-8"
              disabled={submitting}
            />
            <Button type="submit" size="sm" disabled={submitting}>
              Save
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setEditing(false);
                setName(floor.name);
              }}
            >
              Cancel
            </Button>
          </form>
        ) : (
          <Link
            href={`/admin/floors/${floor.id}`}
            className="group flex items-center gap-3 truncate"
          >
            <span className="truncate font-medium group-hover:underline">{floor.name}</span>
            <Badge variant="muted">
              {floor.activeDeskCount} desk{floor.activeDeskCount === 1 ? "" : "s"}
            </Badge>
          </Link>
        )}
      </div>

      {!editing ? (
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" aria-label="Rename" onClick={() => setEditing(true)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            aria-label="Delete"
            onClick={onDelete}
            disabled={floor.activeDeskCount > 0}
            title={floor.activeDeskCount > 0 ? "Remove all desks first" : "Delete"}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ) : null}
    </li>
  );
}
