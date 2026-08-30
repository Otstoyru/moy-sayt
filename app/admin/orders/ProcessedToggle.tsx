"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ProcessedToggle({ orderId, processed }: { orderId: number; processed: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleChange(checked: boolean) {
    setPending(true);
    await fetch(`/api/admin/orders/${orderId}/processed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ processed: checked }),
    });
    setPending(false);
    router.refresh();
  }

  return (
    <label className="flex items-center gap-1.5 text-sm text-muted">
      <input
        type="checkbox"
        defaultChecked={processed}
        disabled={pending}
        onChange={(e) => handleChange(e.target.checked)}
        className="h-4 w-4 rounded border-border accent-foreground"
      />
      Проведено
    </label>
  );
}
