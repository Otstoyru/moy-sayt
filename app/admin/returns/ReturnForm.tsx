"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type Buyer = { id: number; name: string; email: string };

export default function ReturnForm({ buyers, articles }: { buyers: Buyer[]; articles: string[] }) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setError("");
    setSuccess("");

    const form = new FormData(event.currentTarget);
    const payload = {
      userId: Number(form.get("userId")),
      article: String(form.get("article") ?? "").trim(),
      quantity: Number(form.get("quantity")),
      buyerDocumentNumber: String(form.get("buyerDocumentNumber") ?? "").trim(),
      buyerDocumentDate: form.get("buyerDocumentDate") || null,
    };

    const res = await fetch("/api/admin/returns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(data.error ?? "Не удалось оформить возврат");
      setStatus("error");
      return;
    }

    setSuccess(`Возврат оформлен: ${payload.article} — ${payload.quantity} уп. Остаток на складе увеличен.`);
    setStatus("idle");
    event.currentTarget.reset();
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="userId" className="text-sm font-medium">
          Покупатель
        </label>
        <select
          id="userId"
          name="userId"
          required
          defaultValue=""
          className="h-11 rounded-md border border-border bg-background px-3 outline-none focus:border-brand"
        >
          <option value="" disabled>
            — выберите —
          </option>
          {buyers.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name} ({b.email})
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="article" className="text-sm font-medium">
            Артикул
          </label>
          <input
            id="article"
            name="article"
            list="return-articles"
            required
            className="h-11 rounded-md border border-border bg-background px-3 outline-none focus:border-brand"
          />
          <datalist id="return-articles">
            {articles.map((a) => (
              <option key={a} value={a} />
            ))}
          </datalist>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="quantity" className="text-sm font-medium">
            Количество, уп.
          </label>
          <input
            id="quantity"
            name="quantity"
            type="number"
            min="1"
            step="1"
            required
            className="h-11 rounded-md border border-border bg-background px-3 outline-none focus:border-brand"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="buyerDocumentNumber" className="text-sm font-medium">
            № накладной покупателя
          </label>
          <input
            id="buyerDocumentNumber"
            name="buyerDocumentNumber"
            required
            className="h-11 rounded-md border border-border bg-background px-3 outline-none focus:border-brand"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="buyerDocumentDate" className="text-sm font-medium">
            Дата накладной
          </label>
          <input
            id="buyerDocumentDate"
            name="buyerDocumentDate"
            type="date"
            className="h-11 rounded-md border border-border bg-background px-3 outline-none focus:border-brand"
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-700">{success}</p>}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="mt-1 inline-flex h-11 w-fit items-center justify-center rounded-full bg-foreground px-5 text-sm font-medium text-background hover:bg-brand disabled:opacity-60"
      >
        {status === "submitting" ? "Сохранение..." : "Оформить возврат"}
      </button>
    </form>
  );
}
