"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cancelBooking } from "@/app/book/actions";

export function CancelBookingButton({ id, label }: { id: string; label: string }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  async function onCancel() {
    if (!confirm(`Cancel your booking for ${label}?`)) return;
    setPending(true);
    const result = await cancelBooking({ id });
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Booking cancelled");
    router.refresh();
  }

  return (
    <Button variant="outline" size="sm" onClick={onCancel} disabled={pending}>
      {pending ? "Cancelling…" : "Cancel"}
    </Button>
  );
}
