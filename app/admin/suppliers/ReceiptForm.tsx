"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type Line = { article: string; quantity: string; unitPrice: string };
const EMPTY_LINE: Line = { article: "", quantity: "", unitPrice: "" };

export default function ReceiptForm({
  suppliers,
  articles,
}: {
  suppliers: { id: number; name: string }[];
  articles: string[];
}) {
  const router = useRouter();
  const [lines, setLines] = useState<Line[]>([{ ...EMPTY_LINE }]);
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function updateLine(index: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  }

  function addLine() {
    setLines((prev) => [...prev, { ...EMPTY_LINE }]);
  }

  function removeLine(index: number) {
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setError("");
    setSuccess("");

    const form = new FormData(event.currentTarget);
    const items = lines
      .filter((l) => l.article.trim())
      .map((l) => ({ article: l.article.trim(), quantity: Number(l.quantity), unitPrice: Number(l.unitPrice) }));

    if (items.length === 0) {
      setError("Добавьте хотя бы одну позицию");
      setStatus("error");
      return;
    }

    const res = await fetch("/api/admin/suppliers/receipts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        supplierId: Number(form.get("supplierId")),
        items,
        documentNumber: form.get("documentNumber") || null,
        documentDate: form.get("documentDate") || null,
        description: form.get("description") || null,
      }),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(data.error ?? "Не удалось оприходовать накладную");
      setStatus("error");
      return;
    }

    setSuccess(`Оприходовано на сумму ${Number(data.amount).toLocaleString("ru-RU")} ₽, остатки увеличены.`);
    setStatus("idle");
    setLines([{ ...EMPTY_LINE }]);
    event.currentTarget.reset();
    router.refresh();
  }

  if (suppliers.length === 0) {
    return <p className="mt-4 text-sm text-muted">Сначала добавьте поставщика.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="supplierId" className="text-sm font-medium">
            Поставщик
          </label>
          <select id="supplierId" name="supplierId" required className="h-11 rounded-md border border-border bg-background px-3 outline-none focus:border-brand">
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="documentNumber" className="text-sm font-medium">
            № накладной
          </label>
          <input id="documentNumber" name="documentNumber" className="h-11 rounded-md border border-border bg-background px-3 outline-none focus:border-brand" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="documentDate" className="text-sm font-medium">
            Дата накладной
          </label>
          <input id="documentDate" name="documentDate" type="date" className="h-11 rounded-md border border-border bg-background px-3 outline-none focus:border-brand" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="description" className="text-sm font-medium">
            Комментарий
          </label>
          <input id="description" name="description" className="h-11 rounded-md border border-border bg-background px-3 outline-none focus:border-brand" />
        </div>
      </div>

      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-muted">Позиции</p>
      <datalist id="receipt-articles">
        {articles.map((a) => (
          <option key={a} value={a} />
        ))}
      </datalist>
      <div className="flex flex-col gap-2">
        {lines.map((line, i) => (
          <div key={i} className="grid grid-cols-[2fr_1fr_1fr_auto] gap-2">
            <input
              list="receipt-articles"
              placeholder="Артикул"
              value={line.article}
              onChange={(e) => updateLine(i, { article: e.target.value })}
              className="h-10 rounded-md border border-border bg-background px-2 text-sm outline-none focus:border-brand"
            />
            <input
              type="number"
              min="1"
              step="1"
              placeholder="Кол-во"
              value={line.quantity}
              onChange={(e) => updateLine(i, { quantity: e.target.value })}
              className="h-10 rounded-md border border-border bg-background px-2 text-sm outline-none focus:border-brand"
            />
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Цена, ₽"
              value={line.unitPrice}
              onChange={(e) => updateLine(i, { unitPrice: e.target.value })}
              className="h-10 rounded-md border border-border bg-background px-2 text-sm outline-none focus:border-brand"
            />
            <button
              type="button"
              onClick={() => removeLine(i)}
              disabled={lines.length === 1}
              className="text-sm text-red-600 hover:underline disabled:opacity-30"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <button type="button" onClick={addLine} className="w-fit text-sm font-medium text-brand hover:underline">
        + строка
      </button>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-700">{success}</p>}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="mt-1 inline-flex h-11 w-fit items-center justify-center rounded-full bg-foreground px-5 text-sm font-medium text-background hover:bg-brand disabled:opacity-60"
      >
        {status === "submitting" ? "Сохранение..." : "Оприходовать"}
      </button>
    </form>
  );
}
