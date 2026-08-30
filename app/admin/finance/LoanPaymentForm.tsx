"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function LoanPaymentForm({ loanId, accounts }: { loanId: number; accounts: { id: number; name: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setError("");

    const form = new FormData(event.currentTarget);
    const res = await fetch(`/api/admin/finance/loans/${loanId}/payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accountId: Number(form.get("accountId")),
        amount: Number(form.get("amount")),
        kind: form.get("kind"),
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
    return <p className="mt-2 text-xs text-red-600">У этого юрлица нет счетов — платёж внести некуда.</p>;
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="mt-2 text-sm font-medium text-brand hover:underline">
        Внести платёж
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 flex flex-col gap-2 rounded-lg border border-border bg-background p-3">
      <div className="grid grid-cols-2 gap-2">
        <select name="kind" defaultValue="repayment" className="h-9 rounded-md border border-border bg-surface px-2 text-sm outline-none focus:border-brand">
          <option value="repayment">Погашение долга</option>
          <option value="interest">Проценты</option>
        </select>
        <input name="amount" type="number" step="0.01" min="0.01" required placeholder="Сумма, ₽" className="h-9 rounded-md border border-border bg-surface px-2 text-sm outline-none focus:border-brand" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <select name="accountId" required className="h-9 rounded-md border border-border bg-surface px-2 text-sm outline-none focus:border-brand">
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        <input name="occurredAt" type="date" className="h-9 rounded-md border border-border bg-surface px-2 text-sm outline-none focus:border-brand" />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={status === "submitting"}
          className="inline-flex h-8 items-center justify-center rounded-full bg-foreground px-3 text-xs font-medium text-background hover:bg-brand disabled:opacity-60"
        >
          {status === "submitting" ? "..." : "Сохранить"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-muted hover:text-brand">
          Отмена
        </button>
      </div>
    </form>
  );
}
