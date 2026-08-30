"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ACCOUNT_KINDS } from "@/lib/financeCategories";

export default function AccountFormModal({ sellerId }: { sellerId: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setError("");

    const form = new FormData(event.currentTarget);
    const res = await fetch("/api/admin/finance/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sellerId, name: form.get("name"), kind: form.get("kind") }),
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
      <button type="button" onClick={() => setOpen(true)} className="text-sm font-medium text-brand hover:underline">
        + Счёт
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-background p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold">Новый счёт</h3>
              <button type="button" onClick={() => setOpen(false)} className="text-muted hover:text-brand">
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="name" className="text-sm font-medium">
                  Название
                </label>
                <input
                  id="name"
                  name="name"
                  required
                  placeholder="Счёт в Тинькофф №..., Наличная касса"
                  className="h-11 rounded-md border border-border bg-surface px-3 outline-none focus:border-brand"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="kind" className="text-sm font-medium">
                  Тип
                </label>
                <select
                  id="kind"
                  name="kind"
                  defaultValue="bank"
                  className="h-11 rounded-md border border-border bg-surface px-3 outline-none focus:border-brand"
                >
                  {ACCOUNT_KINDS.map((k) => (
                    <option key={k.value} value={k.value}>
                      {k.label}
                    </option>
                  ))}
                </select>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={status === "submitting"}
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
