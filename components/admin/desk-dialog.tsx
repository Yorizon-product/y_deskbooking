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
import { Switch } from "@/components/ui/switch";

import { createDesk, updateDesk } from "@/app/admin/floors/[floorId]/actions";
import type { DeskAttributes } from "@/lib/validators/inventory";

type Mode =
  | { kind: "create"; floorId: string }
  | { kind: "edit"; deskId: string; initialLabel: string; initialAttributes: DeskAttributes };

export function DeskDialog({
  mode,
  trigger,
}: {
  mode: Mode;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const [label, setLabel] = React.useState(mode.kind === "edit" ? mode.initialLabel : "");
  const [attrs, setAttrs] = React.useState<DeskAttributes>(
    mode.kind === "edit" ? mode.initialAttributes : {}
  );
  const [submitting, setSubmitting] = React.useState(false);

  // Reset internal state when the dialog opens so stale values don't linger.
  React.useEffect(() => {
    if (open) {
      if (mode.kind === "edit") {
        setLabel(mode.initialLabel);
        setAttrs(mode.initialAttributes);
      } else {
        setLabel("");
        setAttrs({});
      }
    }
  }, [open, mode]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const result =
      mode.kind === "create"
        ? await createDesk({ floorId: mode.floorId, label, attributes: attrs })
        : await updateDesk({ id: mode.deskId, label, attributes: attrs });
    setSubmitting(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(mode.kind === "create" ? `Added desk ${label}` : "Desk updated");
    setOpen(false);
  }

  const toggle = (key: keyof DeskAttributes) => (checked: boolean) =>
    setAttrs((a) => ({ ...a, [key]: checked || undefined }));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <Plus className="h-4 w-4" /> New desk
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode.kind === "create" ? "New desk" : "Edit desk"}</DialogTitle>
          <DialogDescription>
            Labels must be unique per floor. Attributes are shown to bookers.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="desk-label">Label</Label>
            <Input
              id="desk-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="1-A"
              required
              autoFocus
              maxLength={24}
            />
          </div>
          <div className="space-y-3">
            <Label>Attributes</Label>
            <div className="space-y-3 rounded-md border border-border p-3">
              <AttrRow label="Has monitor" checked={!!attrs.monitor} onCheckedChange={toggle("monitor")} />
              <AttrRow label="Standing-capable" checked={!!attrs.standing} onCheckedChange={toggle("standing")} />
              <AttrRow label="Accessible" checked={!!attrs.accessible} onCheckedChange={toggle("accessible")} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !label.trim()}>
              {submitting ? "Saving…" : mode.kind === "create" ? "Add desk" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AttrRow({
  label,
  checked,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (c: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm">{label}</span>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
