"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function MarkSoldButton({ orderId }: { orderId: number }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleClick() {
    if (!confirm("Отметить заказ оплаченным и продать? Будет закреплён номер УПД — его нельзя будет изменить.")) return;
    setPending(true);
    await fetch(`/api/admin/orders/${orderId}/mark-sold`, { method: "POST" });
    setPending(false);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="inline-flex h-9 items-center justify-center rounded-full bg-foreground px-4 text-sm font-medium text-background hover:bg-brand disabled:opacity-50"
    >
      {pending ? "..." : "Отметить оплату / Продано"}
    </button>
  );
}
