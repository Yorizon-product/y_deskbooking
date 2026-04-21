"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { createFloor } from "@/app/admin/floors/actions";

export function NewFloorDialog() {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const result = await createFloor({ name });
    setSubmitting(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(`Added "${name}"`);
    setName("");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" /> New floor
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New floor</DialogTitle>
          <DialogDescription>Floors group desks for bookings and admin views.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="floor-name">Name</Label>
            <Input
              id="floor-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Floor 3"
              required
              autoFocus
              maxLength={60}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !name.trim()}>
              {submitting ? "Adding…" : "Add floor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
