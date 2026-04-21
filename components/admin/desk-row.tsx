"use client";

import * as React from "react";
import { Pencil } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

import { DeskDialog } from "@/components/admin/desk-dialog";
import { toggleDesk } from "@/app/admin/floors/[floorId]/actions";
import type { DeskAttributes } from "@/lib/validators/inventory";

export type DeskRowData = {
  id: string;
  label: string;
  attributes: DeskAttributes;
  active: boolean;
};

export function DeskRow({ desk }: { desk: DeskRowData }) {
  const [pending, setPending] = React.useState(false);

  async function onToggle(active: boolean) {
    setPending(true);
    const result = await toggleDesk({ id: desk.id, active });
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(active ? `${desk.label} is live` : `${desk.label} is inactive`);
  }

  return (
    <tr className="border-b border-border last:border-b-0">
      <td className="px-4 py-3 font-medium">{desk.label}</td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1.5">
          {desk.attributes.monitor ? <Badge variant="secondary">Monitor</Badge> : null}
          {desk.attributes.standing ? <Badge variant="secondary">Standing</Badge> : null}
          {desk.attributes.accessible ? <Badge variant="secondary">Accessible</Badge> : null}
          {!desk.attributes.monitor && !desk.attributes.standing && !desk.attributes.accessible ? (
            <span className="text-xs text-muted-foreground">&mdash;</span>
          ) : null}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Switch
            checked={desk.active}
            onCheckedChange={onToggle}
            disabled={pending}
            aria-label={desk.active ? "Deactivate" : "Activate"}
          />
          <span className="text-xs text-muted-foreground">
            {desk.active ? "Active" : "Inactive"}
          </span>
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        <DeskDialog
          mode={{
            kind: "edit",
            deskId: desk.id,
            initialLabel: desk.label,
            initialAttributes: desk.attributes,
          }}
          trigger={
            <Button size="icon" variant="ghost" aria-label={`Edit desk ${desk.label}`}>
              <Pencil className="h-4 w-4" />
            </Button>
          }
        />
      </td>
    </tr>
  );
}
