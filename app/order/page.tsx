"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useOrderList } from "@/components/OrderListProvider";

type Status = "idle" | "submitting" | "success" | "error";

export default function OrderPage() {
  const { items, removeItem, setQuantity, clear, totalPrice } = useOrderList();
  const [status, setStatus] = useState<Status>("idle");
  const [buyerType, setBuyerType] = useState<"retail" | "wholesale">("retail");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");

    const form = event.currentTarget;
    const data = {
      name: (form.elements.namedItem("name") as HTMLInputElement).value,
      phone: (form.elements.namedItem("phone") as HTMLInputElement).value,
      email: (form.elements.namedItem("email") as HTMLInputElement).value,
      comment: (form.elements.namedItem("comment") as HTMLTextAreaElement).value,
      buyerType,
      items: items.map((i) => ({
        article: i.article,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
      })),
      totalPrice,
    };

    try {
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Request failed");
      setStatus("success");
      clear();
      form.reset();
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="mx-auto w-full max-w-2xl px-6 py-20 text-center">
        <h1 className="font-display text-2xl font-semibold">
          Спасибо! Заявка отправлена
        </h1>
        <p className="mt-3 text-muted">
          Мы свяжемся с вами в ближайшее время, чтобы уточнить детали заказа.
        </p>
        <Link
          href="/catalog"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-foreground px-6 text-sm font-medium text-background hover:bg-brand"
        >
          Вернуться в каталог
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-12">
      <h1 className="font-display text-3xl font-semibold">Список к заказу</h1>

      {items.length === 0 ? (
        <div className="mt-10 rounded-xl border border-border bg-surface p-8 text-center text-muted">
          Список пуст.{" "}
          <Link href="/catalog" className="font-medium text-brand hover:underline">
            Перейти в каталог
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-8 divide-y divide-border rounded-xl border border-border bg-surface">
            {items.map((item) => (
              <div key={item.article} className="flex items-center gap-4 p-4">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-[#f1ece1]">
                  <Image src={item.image} alt={item.name} fill sizes="64px" className="object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-muted">Артикул {item.article}</p>
                </div>
                <input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) =>
                    setQuantity(item.article, parseInt(e.target.value, 10) || 1)
                  }
                  className="h-9 w-16 rounded-md border border-border px-2 text-center text-sm"
                />
                <p className="w-24 shrink-0 text-right text-sm font-medium">
                  {(item.price * item.quantity).toLocaleString("ru-RU")} ₽
                </p>
                <button
                  type="button"
                  onClick={() => removeItem(item.article)}
                  className="text-muted hover:text-brand"
                  aria-label="Удалить"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-end text-lg font-semibold">
            Итого: {totalPrice.toLocaleString("ru-RU")} ₽
          </div>

          <form onSubmit={handleSubmit} className="mt-10 flex flex-col gap-4">
            <h2 className="font-display text-xl font-semibold">
              Оформить заявку
            </h2>

            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="buyerType"
                  checked={buyerType === "retail"}
                  onChange={() => setBuyerType("retail")}
                />
                Розничный покупатель
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="buyerType"
                  checked={buyerType === "wholesale"}
                  onChange={() => setBuyerType("wholesale")}
                />
                Оптовый партнёр
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
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
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className="h-11 rounded-md border border-border bg-surface px-3 outline-none focus:border-brand"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="comment" className="text-sm font-medium">
                Комментарий
              </label>
              <textarea
                id="comment"
                name="comment"
                rows={4}
                className="resize-none rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-brand"
              />
            </div>

            {status === "error" && (
              <p className="text-sm text-red-600">
                Не удалось отправить заявку. Попробуйте ещё раз.
              </p>
            )}

            <button
              type="submit"
              disabled={status === "submitting"}
              className="mt-2 inline-flex h-12 items-center justify-center rounded-full bg-foreground px-6 text-sm font-medium text-background transition-colors hover:bg-brand disabled:opacity-60"
            >
              {status === "submitting" ? "Отправка..." : "Отправить заявку"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
