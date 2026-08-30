"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { TRANSACTION_CATEGORIES } from "@/lib/financeCategories";

export default function TransactionForm({ accounts }: { accounts: { id: number; label: string }[] }) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setError("");

    const form = new FormData(event.currentTarget);
    const sign = form.get("type") === "expense" ? -1 : 1;
    const amount = sign * Math.abs(Number(form.get("amount")));

    const res = await fetch("/api/admin/finance/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accountId: Number(form.get("accountId")),
        amount,
        category: form.get("category"),
        description: form.get("description") || null,
        occurredAt: form.get("occurredAt") || undefined,
      }),
    });

    if (res.ok) {
      setStatus("idle");
      event.currentTarget.reset();
      router.refresh();
      return;
    }
    const data = await res.json().catch(() => ({}));
    setError(data.error ?? "Не удалось сохранить");
    setStatus("error");
  }

  if (accounts.length === 0) {
    return <p className="mt-4 text-sm text-muted">Сначала добавьте хотя бы один счёт.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="accountId" className="text-sm font-medium">
            Счёт
          </label>
          <select id="accountId" name="accountId" required className="h-11 rounded-md border border-border bg-background px-3 outline-none focus:border-brand">
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="type" className="text-sm font-medium">
            Тип
          </label>
          <select id="type" name="type" defaultValue="income" className="h-11 rounded-md border border-border bg-background px-3 outline-none focus:border-brand">
            <option value="income">Приход</option>
            <option value="expense">Расход</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="amount" className="text-sm font-medium">
            Сумма, ₽
          </label>
          <input id="amount" name="amount" type="number" step="0.01" min="0.01" required className="h-11 rounded-md border border-border bg-background px-3 outline-none focus:border-brand" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="category" className="text-sm font-medium">
            Категория
          </label>
          <select id="category" name="category" required className="h-11 rounded-md border border-border bg-background px-3 outline-none focus:border-brand">
            {TRANSACTION_CATEGORIES.filter((c) => !c.value.startsWith("loan_") && c.value !== "sale").map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="description" className="text-sm font-medium">
            Описание
          </label>
          <input id="description" name="description" className="h-11 rounded-md border border-border bg-background px-3 outline-none focus:border-brand" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="occurredAt" className="text-sm font-medium">
            Дата
          </label>
          <input id="occurredAt" name="occurredAt" type="date" className="h-11 rounded-md border border-border bg-background px-3 outline-none focus:border-brand" />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="mt-1 inline-flex h-11 w-fit items-center justify-center rounded-full bg-foreground px-5 text-sm font-medium text-background hover:bg-brand disabled:opacity-60"
      >
        {status === "submitting" ? "Сохранение..." : "Добавить проводку"}
      </button>
    </form>
  );
}
