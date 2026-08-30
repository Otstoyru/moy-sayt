"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { SELLER_LEGAL_FORMS } from "@/lib/sellers";
import type { Seller } from "@/lib/sellers";

export default function SellerFormModal({ seller }: { seller?: Seller }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setError("");

    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());

    const res = await fetch(seller ? `/api/admin/sellers/${seller.id}` : "/api/admin/sellers", {
      method: seller ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
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
        className={
          seller
            ? "text-sm font-medium text-brand hover:underline"
            : "inline-flex h-10 items-center justify-center rounded-full bg-foreground px-5 text-sm font-medium text-background hover:bg-brand"
        }
      >
        {seller ? "Редактировать" : "Добавить фирму"}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-background p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl font-semibold">
                {seller ? "Редактировать юрлицо" : "Добавить фирму"}
              </h3>
              <button type="button" onClick={() => setOpen(false)} className="text-muted hover:text-brand">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
              <Field label="Название (короткое)" name="shortName" defaultValue={seller?.shortName} required />
              <Field label="Полное название" name="fullName" defaultValue={seller?.fullName} required />

              <div className="flex flex-col gap-1.5">
                <label htmlFor="legalForm" className="text-sm font-medium">
                  Форма
                </label>
                <select
                  id="legalForm"
                  name="legalForm"
                  defaultValue={seller?.legalForm ?? "ooo"}
                  className="h-11 rounded-md border border-border bg-surface px-3 outline-none focus:border-brand"
                >
                  {SELLER_LEGAL_FORMS.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>

              <Field label="Юридический адрес" name="legalAddress" defaultValue={seller?.legalAddress} required />

              <div className="grid grid-cols-2 gap-3">
                <Field label="ИНН" name="inn" defaultValue={seller?.inn} required />
                <Field label="КПП" name="kpp" defaultValue={seller?.kpp ?? ""} />
              </div>
              <Field label="ОГРН / ОГРНИП" name="ogrn" defaultValue={seller?.ogrn ?? ""} />

              <div className="grid grid-cols-2 gap-3">
                <Field label="Телефон" name="phone" defaultValue={seller?.phone ?? ""} />
                <Field label="Email" name="email" defaultValue={seller?.email ?? ""} />
              </div>

              <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-muted">
                Банковские реквизиты
              </p>
              <Field label="Расчётный счёт" name="bankAccount" defaultValue={seller?.bankAccount ?? ""} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Банк" name="bankName" defaultValue={seller?.bankName ?? ""} />
                <Field label="БИК" name="bankBik" defaultValue={seller?.bankBik ?? ""} />
              </div>
              <Field label="Корр. счёт" name="bankCorrAccount" defaultValue={seller?.bankCorrAccount ?? ""} />

              <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-muted">
                Налогообложение
              </p>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="vatRate" className="text-sm font-medium">
                  Ставка НДС, % <span className="font-normal text-muted">(пусто — не облагается, УСН/НПД)</span>
                </label>
                <input
                  id="vatRate"
                  name="vatRate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  defaultValue={seller?.vatRate ?? ""}
                  className="h-11 rounded-md border border-border bg-surface px-3 outline-none focus:border-brand"
                />
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

function Field({
  label,
  name,
  defaultValue,
  required,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={name}
        name={name}
        defaultValue={defaultValue}
        required={required}
        className="h-11 rounded-md border border-border bg-surface px-3 outline-none focus:border-brand"
      />
    </div>
  );
}
