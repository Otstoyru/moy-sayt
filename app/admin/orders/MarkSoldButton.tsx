"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type SellerGroup = {
  sellerId: number;
  sellerName: string;
  subtotal: number;
  accounts: { id: number; name: string }[];
};

export default function MarkSoldButton({ orderId, sellerGroups }: { orderId: number; sellerGroups: SellerGroup[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [accountsBySeller, setAccountsBySeller] = useState<Record<number, number>>(() =>
    Object.fromEntries(sellerGroups.filter((g) => g.accounts.length === 1).map((g) => [g.sellerId, g.accounts[0].id]))
  );

  const missingAccount = sellerGroups.some((g) => g.accounts.length > 0 && !accountsBySeller[g.sellerId]);
  const anySellerWithoutAccounts = sellerGroups.some((g) => g.accounts.length === 0);

  async function handleConfirm() {
    setPending(true);
    setError("");
    const res = await fetch(`/api/admin/orders/${orderId}/mark-sold`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountsBySeller }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Не удалось отметить заказ");
      setPending(false);
      return;
    }
    setPending(false);
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 items-center justify-center rounded-full bg-foreground px-4 text-sm font-medium text-background hover:bg-brand"
      >
        Отметить оплату / Продано
      </button>
    );
  }

  return (
    <div className="mt-2 w-full rounded-lg border border-border bg-background p-3">
      <p className="text-xs text-muted">
        На какой счёт/кассу пришла оплата? Будет закреплён номер УПД — его нельзя будет изменить.
      </p>
      <div className="mt-2 flex flex-col gap-2">
        {sellerGroups.map((g) => (
          <div key={g.sellerId} className="flex items-center justify-between gap-3">
            <span className="text-sm">
              {g.sellerName}: {g.subtotal.toLocaleString("ru-RU", { maximumFractionDigits: 0 })} ₽
            </span>
            {g.accounts.length === 0 ? (
              <span className="text-xs text-red-600">нет счетов — создайте в «Финансы»</span>
            ) : (
              <select
                value={accountsBySeller[g.sellerId] ?? ""}
                onChange={(e) => setAccountsBySeller((prev) => ({ ...prev, [g.sellerId]: Number(e.target.value) }))}
                className="h-9 rounded-md border border-border bg-surface px-2 text-sm outline-none focus:border-brand"
              >
                <option value="" disabled>
                  — счёт —
                </option>
                {g.accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        ))}
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={pending || missingAccount || anySellerWithoutAccounts}
          className="inline-flex h-9 items-center justify-center rounded-full bg-foreground px-4 text-sm font-medium text-background hover:bg-brand disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "..." : "Подтвердить"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-muted hover:text-brand"
        >
          Отмена
        </button>
      </div>
    </div>
  );
}
