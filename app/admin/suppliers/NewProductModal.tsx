"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type Category = { slug: string; name: string; groupSlug: string; groupName: string };
type Group = { slug: string; name: string };
type SellerOption = { id: number; name: string };

export default function NewProductModal({
  categories,
  groups,
  sellers,
}: {
  categories: Category[];
  groups: Group[];
  sellers: SellerOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [useNewCategory, setUseNewCategory] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setError("");

    const form = new FormData(event.currentTarget);
    const group = groups.find((g) => g.slug === form.get("groupSlug"));

    const res = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        article: form.get("article"),
        name: form.get("name"),
        productType: form.get("productType") || null,
        packageSize: Number(form.get("packageSize")),
        minPrice: Number(form.get("minPrice")),
        sellerId: form.get("sellerId") || null,
        categorySlug: useNewCategory ? null : form.get("categorySlug"),
        newCategoryName: useNewCategory ? form.get("newCategoryName") : null,
        groupSlug: useNewCategory ? group?.slug : null,
        groupName: useNewCategory ? group?.name : null,
      }),
    });

    if (res.ok) {
      setOpen(false);
      router.refresh();
      return;
    }
    const data = await res.json().catch(() => ({}));
    setError(data.error ?? "Не удалось создать товар");
    setStatus("error");
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="text-sm font-medium text-brand hover:underline">
        + Новый товар
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-background p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold">Новый товар</h3>
              <button type="button" onClick={() => setOpen(false)} className="text-muted hover:text-brand">
                ✕
              </button>
            </div>
            <p className="mt-1 text-xs text-muted">
              Для комплектующих (например, ручек) — тоже обычный товар, его можно продавать отдельно.
            </p>
            <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="article" className="text-sm font-medium">
                    Артикул
                  </label>
                  <input id="article" name="article" required className="h-11 rounded-md border border-border bg-surface px-3 outline-none focus:border-brand" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="productType" className="text-sm font-medium">
                    Тип
                  </label>
                  <input id="productType" name="productType" placeholder="Ручка, Щётка..." className="h-11 rounded-md border border-border bg-surface px-3 outline-none focus:border-brand" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="name" className="text-sm font-medium">
                  Название
                </label>
                <input id="name" name="name" required className="h-11 rounded-md border border-border bg-surface px-3 outline-none focus:border-brand" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Категория</label>
                {!useNewCategory ? (
                  <div className="flex items-center gap-2">
                    <select name="categorySlug" required className="h-11 flex-1 rounded-md border border-border bg-surface px-3 outline-none focus:border-brand">
                      {categories.map((c) => (
                        <option key={c.slug} value={c.slug}>
                          {c.groupName} / {c.name}
                        </option>
                      ))}
                    </select>
                    <button type="button" onClick={() => setUseNewCategory(true)} className="text-xs font-medium text-brand hover:underline">
                      новая
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <input name="newCategoryName" placeholder="Название новой категории" required className="h-11 flex-1 rounded-md border border-border bg-surface px-3 outline-none focus:border-brand" />
                      <button type="button" onClick={() => setUseNewCategory(false)} className="text-xs font-medium text-brand hover:underline">
                        выбрать
                      </button>
                    </div>
                    <select name="groupSlug" required className="h-11 rounded-md border border-border bg-surface px-3 outline-none focus:border-brand">
                      {groups.map((g) => (
                        <option key={g.slug} value={g.slug}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="packageSize" className="text-sm font-medium">
                    Упаковка, шт
                  </label>
                  <input id="packageSize" name="packageSize" type="number" min="1" step="1" required className="h-11 rounded-md border border-border bg-surface px-3 outline-none focus:border-brand" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="minPrice" className="text-sm font-medium">
                    Мин. цена, ₽
                  </label>
                  <input id="minPrice" name="minPrice" type="number" min="0" step="0.01" required className="h-11 rounded-md border border-border bg-surface px-3 outline-none focus:border-brand" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="sellerId" className="text-sm font-medium">
                  Юрлицо <span className="font-normal text-muted">(можно назначить позже в «Юрлица»)</span>
                </label>
                <select id="sellerId" name="sellerId" defaultValue="" className="h-11 rounded-md border border-border bg-surface px-3 outline-none focus:border-brand">
                  <option value="">— не назначено —</option>
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
                {status === "submitting" ? "Сохранение..." : "Создать товар"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
