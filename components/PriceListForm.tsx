"use client";

import { FormEvent, useState } from "react";

type Status = "idle" | "submitting" | "success" | "error";

export default function PriceListForm() {
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");

    const form = event.currentTarget;
    const data = {
      name: (form.elements.namedItem("name") as HTMLInputElement).value,
      phone: (form.elements.namedItem("phone") as HTMLInputElement).value,
      company: (form.elements.namedItem("company") as HTMLInputElement).value,
    };

    try {
      const res = await fetch("/api/price-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Request failed");
      setStatus("success");
      form.reset();
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <p className="rounded-xl border border-border bg-surface p-6 text-center text-muted">
        Спасибо! Мы отправим прайс-лист на указанные контакты.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="company" className="text-sm font-medium">
          Компания
        </label>
        <input
          id="company"
          name="company"
          className="h-11 rounded-md border border-border bg-surface px-3 outline-none focus:border-brand"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-sm font-medium">
          Имя
        </label>
        <input
          id="name"
          name="name"
          required
          className="h-11 rounded-md border border-border bg-surface px-3 outline-none focus:border-brand"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="phone" className="text-sm font-medium">
          Телефон
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          required
          className="h-11 rounded-md border border-border bg-surface px-3 outline-none focus:border-brand"
        />
      </div>

      {status === "error" && (
        <p className="text-sm text-red-600">Не удалось отправить запрос. Попробуйте ещё раз.</p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="mt-2 inline-flex h-12 items-center justify-center rounded-full bg-foreground px-6 text-sm font-medium text-background transition-colors hover:bg-brand disabled:opacity-60"
      >
        {status === "submitting" ? "Отправка..." : "Запросить прайс-лист"}
      </button>
    </form>
  );
}
