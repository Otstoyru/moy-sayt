"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function SupplierFormModal({ sellers }: { sellers: { id: number; name: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setError("");

    const form = new FormData(event.currentTarget);
    const res = await fetch("/api/admin/suppliers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sellerId: Number(form.get("sellerId")), name: form.get("name") }),
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
        className="mt-4 inline-flex h-10 items-center justify-center rounded-full bg-foreground px-4 text-sm font-medium text-background hover:bg-brand"
      >
        + Поставщик
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-background p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold">Новый поставщик</h3>
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
                  placeholder="Производство, Поставщик из Торжка..."
                  className="h-11 rounded-md border border-border bg-surface px-3 outline-none focus:border-brand"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="sellerId" className="text-sm font-medium">
                  Юрлицо (кто должен)
                </label>
                <select id="sellerId" name="sellerId" required className="h-11 rounded-md border border-border bg-surface px-3 outline-none focus:border-brand">
                  {sellers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
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
