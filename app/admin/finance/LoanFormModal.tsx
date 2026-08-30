"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { LOAN_DIRECTIONS } from "@/lib/financeCategories";

type SellerOption = { id: number; name: string };
type AccountOption = { id: number; sellerId: number; label: string };

export default function LoanFormModal({ sellers, accounts }: { sellers: SellerOption[]; accounts: AccountOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [sellerId, setSellerId] = useState<number | "">(sellers[0]?.id ?? "");
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [error, setError] = useState("");

  const accountsForSeller = useMemo(() => accounts.filter((a) => a.sellerId === sellerId), [accounts, sellerId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setError("");

    const form = new FormData(event.currentTarget);
    const res = await fetch("/api/admin/finance/loans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sellerId: Number(form.get("sellerId")),
        direction: form.get("direction"),
        counterparty: form.get("counterparty"),
        principal: Number(form.get("principal")),
        interestRate: form.get("interestRate") ? Number(form.get("interestRate")) : null,
        startedAt: form.get("startedAt"),
        dueAt: form.get("dueAt") || null,
        accountId: Number(form.get("accountId")),
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

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 inline-flex h-10 items-center justify-center rounded-full bg-foreground px-4 text-sm font-medium text-background hover:bg-brand"
      >
        + Займ
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-background p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold">Новый займ</h3>
              <button type="button" onClick={() => setOpen(false)} className="text-muted hover:text-brand">
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="sellerId" className="text-sm font-medium">
                  Юрлицо
                </label>
                <select
                  id="sellerId"
                  name="sellerId"
                  value={sellerId}
                  onChange={(e) => setSellerId(Number(e.target.value))}
                  className="h-11 rounded-md border border-border bg-surface px-3 outline-none focus:border-brand"
                >
                  {sellers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="direction" className="text-sm font-medium">
                  Направление
                </label>
                <select id="direction" name="direction" defaultValue="borrowed" className="h-11 rounded-md border border-border bg-surface px-3 outline-none focus:border-brand">
                  {LOAN_DIRECTIONS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="counterparty" className="text-sm font-medium">
                  Контрагент
                </label>
                <input id="counterparty" name="counterparty" required placeholder="Банк, физлицо, другое юрлицо" className="h-11 rounded-md border border-border bg-surface px-3 outline-none focus:border-brand" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="principal" className="text-sm font-medium">
                    Сумма, ₽
                  </label>
                  <input id="principal" name="principal" type="number" step="0.01" min="0.01" required className="h-11 rounded-md border border-border bg-surface px-3 outline-none focus:border-brand" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="interestRate" className="text-sm font-medium">
                    Ставка, % годовых
                  </label>
                  <input id="interestRate" name="interestRate" type="number" step="0.01" min="0" placeholder="пусто — без %" className="h-11 rounded-md border border-border bg-surface px-3 outline-none focus:border-brand" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="startedAt" className="text-sm font-medium">
                    Дата выдачи
                  </label>
                  <input id="startedAt" name="startedAt" type="date" required className="h-11 rounded-md border border-border bg-surface px-3 outline-none focus:border-brand" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="dueAt" className="text-sm font-medium">
                    Срок возврата
                  </label>
                  <input id="dueAt" name="dueAt" type="date" className="h-11 rounded-md border border-border bg-surface px-3 outline-none focus:border-brand" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="accountId" className="text-sm font-medium">
                  Счёт зачисления/списания
                </label>
                <select id="accountId" name="accountId" required className="h-11 rounded-md border border-border bg-surface px-3 outline-none focus:border-brand">
                  {accountsForSeller.length === 0 && <option value="">— нет счетов у этого юрлица —</option>}
                  {accountsForSeller.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.label}
                    </option>
                  ))}
                </select>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={status === "submitting" || accountsForSeller.length === 0}
                className="mt-2 inline-flex h-11 items-center justify-center rounded-full bg-foreground text-sm font-medium text-background hover:bg-brand disabled:opacity-60"
              >
                {status === "submitting" ? "Сохранение..." : "Сохранить"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
