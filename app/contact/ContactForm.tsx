"use client";

import { FormEvent, useState } from "react";

type Status = "idle" | "submitting" | "success" | "error";

export default function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setError(null);

    const form = event.currentTarget;
    const data = {
      name: (form.elements.namedItem("name") as HTMLInputElement).value,
      email: (form.elements.namedItem("email") as HTMLInputElement).value,
      message: (form.elements.namedItem("message") as HTMLTextAreaElement).value,
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error("Request failed");
      }

      setStatus("success");
      form.reset();
    } catch {
      setStatus("error");
      setError("Не удалось отправить сообщение. Попробуйте позже.");
    }
  }

  if (status === "success") {
    return (
      <p className="rounded-lg border border-black/[.08] bg-white p-6 text-center text-zinc-700 dark:border-white/[.145] dark:bg-zinc-900 dark:text-zinc-300">
        Спасибо! Ваше сообщение отправлено.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Имя
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          className="rounded-md border border-black/[.08] bg-white px-3 py-2 text-zinc-950 outline-none focus:border-zinc-400 dark:border-white/[.145] dark:bg-zinc-900 dark:text-zinc-50"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="rounded-md border border-black/[.08] bg-white px-3 py-2 text-zinc-950 outline-none focus:border-zinc-400 dark:border-white/[.145] dark:bg-zinc-900 dark:text-zinc-50"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="message" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Сообщение
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          required
          className="resize-none rounded-md border border-black/[.08] bg-white px-3 py-2 text-zinc-950 outline-none focus:border-zinc-400 dark:border-white/[.145] dark:bg-zinc-900 dark:text-zinc-50"
        />
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="mt-2 inline-flex h-12 items-center justify-center rounded-full bg-foreground px-6 text-background transition-colors hover:bg-[#383838] disabled:opacity-60 dark:hover:bg-[#ccc]"
      >
        {status === "submitting" ? "Отправка..." : "Отправить"}
      </button>
    </form>
  );
}
