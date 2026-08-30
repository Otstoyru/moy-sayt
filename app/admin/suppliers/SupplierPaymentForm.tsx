"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function SupplierPaymentForm({
  supplierId,
  accounts,
  remaining,
}: {
  supplierId: number;
  accounts: { id: number; name: string }[];
  remaining: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setError("");

    const form = new FormData(event.currentTarget);
    const res = await fetch(`/api/admin/suppliers/${supplierId}/payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accountId: Number(form.get("accountId")),
        amount: Number(form.get("amount")),
        occurredAt: form.get("occurredAt") || undefined,
      }),
    });

    if (res.ok) {
      setOpen(false);
      router.refresh();
      return;
    }
    const data = await res.json().catch(() => ({}));
    setError(data.error ?? "Не удалось сохранить");
    setStatus("error");
  }

  if (accounts.length === 0) {
    return <p className="mt-2 text-xs text-red-600">У этого юрлица нет счетов — оплатить не с чего.</p>;
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="mt-2 text-sm font-medium text-brand hover:underline">
        Оплатить
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 flex flex-col gap-2 rounded-lg border border-border bg-background p-3">
      <div className="grid grid-cols-2 gap-2">
        <input
          name="amount"
          type="number"
          step="0.01"
          min="0.01"
          defaultValue={remaining}
          required
          className="h-9 rounded-md border border-border bg-surface px-2 text-sm outline-none focus:border-brand"
        />
        <select name="accountId" required className="h-9 rounded-md border border-border bg-surface px-2 text-sm outline-none focus:border-brand">
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>
      <input name="occurredAt" type="date" className="h-9 rounded-md border border-border bg-surface px-2 text-sm outline-none focus:border-brand" />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={status === "submitting"}
          className="inline-flex h-8 items-center justify-center rounded-full bg-foreground px-3 text-xs font-medium text-background hover:bg-brand disabled:opacity-60"
        >
          {status === "submitting" ? "..." : "Подтвердить"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-muted hover:text-brand">
          Отмена
        </button>
      </div>
    </form>
  );
}
