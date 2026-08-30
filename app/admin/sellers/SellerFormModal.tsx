"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useId, useState } from "react";
import { SELLER_LEGAL_FORMS } from "@/lib/sellerForms";
import type { Seller } from "@/lib/sellers";

export default function SellerFormModal({ seller }: { seller?: Seller }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [error, setError] = useState("");
  const [signatureImage, setSignatureImage] = useState<string | null>(seller?.signatureImage ?? null);
  const [stampImage, setStampImage] = useState<string | null>(seller?.stampImage ?? null);

  function readImageFile(file: File, onLoad: (dataUrl: string) => void) {
    if (file.size > 2_000_000) {
      setError("Файл слишком большой (максимум 2 МБ)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onLoad(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setError("");

    const form = new FormData(event.currentTarget);
    const payload = { ...Object.fromEntries(form.entries()), signatureImage, stampImage };

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

              <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-muted">
                Подписант (для счетов-фактур и УПД)
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="ФИО" name="signatoryName" defaultValue={seller?.signatoryName ?? ""} />
                <Field
                  label="Должность"
                  name="signatoryPosition"
                  defaultValue={seller?.signatoryPosition ?? "Директор"}
                />
              </div>

              <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-muted">
                Подпись и печать (для УПД)
              </p>
              <p className="text-xs text-muted">
                Загружаются раздельно — не всегда есть оба сразу, и на документе они стоят в разных местах.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row">
                <ImageUpload
                  label="Подпись"
                  value={signatureImage}
                  onChange={(v) => setSignatureImage(v)}
                  onError={setError}
                  readImageFile={readImageFile}
                />
                <ImageUpload
                  label="Печать (М.П.)"
                  value={stampImage}
                  onChange={(v) => setStampImage(v)}
                  onError={setError}
                  readImageFile={readImageFile}
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

function ImageUpload({
  label,
  value,
  onChange,
  onError,
  readImageFile,
}: {
  label: string;
  value: string | null;
  onChange: (v: string | null) => void;
  onError: (msg: string) => void;
  readImageFile: (file: File, onLoad: (dataUrl: string) => void) => void;
}) {
  const inputId = useId();
  return (
    <div className="flex flex-1 flex-col gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex items-center gap-3">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt={label} className="h-14 w-14 shrink-0 rounded border border-border bg-white object-contain p-1" />
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded border border-dashed border-border text-[10px] text-muted">
            нет файла
          </div>
        )}
        <div className="flex flex-col items-start gap-1">
          <input
            id={inputId}
            type="file"
            accept="image/png,image/jpeg"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              onError("");
              readImageFile(file, onChange);
            }}
          />
          <label
            htmlFor={inputId}
            className="inline-flex h-8 cursor-pointer items-center justify-center rounded-full bg-foreground px-3 text-xs font-medium text-background hover:bg-brand"
          >
            {value ? "Заменить файл" : "Загрузить файл"}
          </label>
          {value && (
            <button type="button" onClick={() => onChange(null)} className="text-xs text-red-600 hover:underline">
              Удалить
            </button>
          )}
        </div>
      </div>
    </div>
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
