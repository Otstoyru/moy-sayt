"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setError("");

    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const next = new URLSearchParams(window.location.search).get("next") || "/account";
      router.push(next);
      router.refresh();
      return;
    }

    const data = await res.json().catch(() => ({}));
    setError(data.error ?? "Не удалось войти");
    setStatus("error");
  }

  return (
    <div className="mx-auto w-full max-w-sm px-6 py-16">
      <h1 className="font-display text-3xl font-semibold">Вход</h1>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="h-11 rounded-md border border-border bg-surface px-3 outline-none focus:border-brand"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-medium">
            Пароль
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="h-11 rounded-md border border-border bg-surface px-3 outline-none focus:border-brand"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={status === "submitting"}
          className="mt-2 inline-flex h-12 items-center justify-center rounded-full bg-foreground text-sm font-medium text-background transition-colors hover:bg-brand disabled:opacity-60"
        >
          {status === "submitting" ? "Вход..." : "Войти"}
        </button>

        <p className="text-sm text-muted">
          Ещё нет аккаунта?{" "}
          <Link href="/register" className="font-medium text-brand hover:underline">
            Зарегистрироваться
          </Link>
        </p>
      </form>
    </div>
  );
}
