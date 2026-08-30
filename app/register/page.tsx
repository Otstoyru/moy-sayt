"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ORG_FORMS } from "@/lib/orgForms";

export default function RegisterPage() {
  const router = useRouter();
  const [orgForm, setOrgForm] = useState("individual");
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setError("");

    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      router.push("/account");
      router.refresh();
      return;
    }

    const data = await res.json().catch(() => ({}));
    setError(data.error ?? "Не удалось зарегистрироваться");
    setStatus("error");
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-12">
      <h1 className="font-display text-3xl font-semibold">Регистрация</h1>
      <p className="mt-2 text-sm text-muted">
        Резервировать товар может только зарегистрированный покупатель. Данные
        ниже нужны для выставления счёта на оплату.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-6">
        <fieldset className="flex flex-col gap-4">
          <legend className="font-display text-lg font-semibold">Контакт и доступ</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Имя" name="name" required />
            <Field label="Телефон" name="phone" type="tel" required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email" name="email" type="email" required />
            <Field label="Пароль" name="password" type="password" required minLength={6} />
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-4">
          <legend className="font-display text-lg font-semibold">Реквизиты для счёта</legend>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="orgForm" className="text-sm font-medium">
              Организационно-правовая форма
            </label>
            <select
              id="orgForm"
              name="orgForm"
              value={orgForm}
              onChange={(e) => setOrgForm(e.target.value)}
              className="h-11 rounded-md border border-border bg-surface px-3 outline-none focus:border-brand"
            >
              {ORG_FORMS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          <Field
            label={orgForm === "individual" || orgForm === "self_employed" ? "ФИО" : "Название организации"}
            name="legalName"
            required
          />
          <Field label="Юридический адрес" name="legalAddress" required />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="ИНН" name="inn" required />
            <Field label="КПП" name="kpp" required={orgForm === "ooo"} />
          </div>

          <Field label="Расчётный счёт" name="bankAccount" required />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Банк" name="bankName" required />
            <Field label="БИК" name="bankBik" required />
          </div>
          <Field label="Корр. счёт" name="bankCorrAccount" />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="deliveryAddress" className="text-sm font-medium">
              Адрес доставки <span className="font-normal text-muted">(необязательно)</span>
            </label>
            <input
              id="deliveryAddress"
              name="deliveryAddress"
              className="h-11 rounded-md border border-border bg-surface px-3 outline-none focus:border-brand"
            />
            <p className="text-xs text-muted">
              По умолчанию — самовывоз со склада производителя. Доставка оплачивается
              отдельно, служба доставки выбирается при оформлении заказа.
            </p>
          </div>
        </fieldset>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={status === "submitting"}
          className="inline-flex h-12 items-center justify-center rounded-full bg-foreground text-sm font-medium text-background transition-colors hover:bg-brand disabled:opacity-60"
        >
          {status === "submitting" ? "Регистрация..." : "Зарегистрироваться"}
        </button>

        <p className="text-sm text-muted">
          Уже есть аккаунт?{" "}
          <Link href="/login" className="font-medium text-brand hover:underline">
            Войти
          </Link>
        </p>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  minLength,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-sm font-medium">
        {label}
        {!required && <span className="font-normal text-muted"> (необязательно)</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        minLength={minLength}
        className="h-11 rounded-md border border-border bg-surface px-3 outline-none focus:border-brand"
      />
    </div>
  );
}
