"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Category, Group } from "@/lib/categories";
import type { Seller } from "@/lib/sellers";

type ProductRow = {
  article: string;
  name: string;
  categorySlug: string;
  sellerId: number | null;
};

export default function CategorySellerTable({
  groups,
  categories,
  sellers,
  sellerByCategory,
  products,
}: {
  groups: Group[];
  categories: Category[];
  sellers: Seller[];
  sellerByCategory: Record<string, number | null>;
  products: ProductRow[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  async function saveCategory(slug: string) {
    const sellerId = selected[slug] ?? sellerByCategory[slug];
    if (!sellerId) return;
    setPending(slug);
    await fetch(`/api/admin/categories/${slug}/seller`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sellerId }),
    });
    setPending(null);
    router.refresh();
  }

  async function saveProduct(article: string, sellerId: number) {
    setPending(article);
    await fetch(`/api/admin/products/${encodeURIComponent(article)}/seller`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sellerId }),
    });
    setPending(null);
    router.refresh();
  }

  return (
    <div className="mt-4 flex flex-col gap-6">
      {groups.map((g) => (
        <div key={g.slug}>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{g.name}</p>
          <div className="mt-2 divide-y divide-border rounded-xl border border-border bg-surface">
            {categories
              .filter((c) => c.groupSlug === g.slug)
              .map((c) => {
                const current = selected[c.slug] ?? sellerByCategory[c.slug] ?? "";
                const itemsInCategory = products.filter((p) => p.categorySlug === c.slug);
                const isMixed = sellerByCategory[c.slug] === null && itemsInCategory.length > 0;
                const isOpen = expanded[c.slug] ?? false;

                return (
                  <div key={c.slug} className="p-3">
                    <div className="flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setExpanded((prev) => ({ ...prev, [c.slug]: !prev[c.slug] }))}
                        className="flex items-center gap-1.5 text-sm hover:text-brand"
                      >
                        <span>{isOpen ? "▾" : "▸"}</span>
                        {c.name}
                        <span className="text-xs text-muted">({itemsInCategory.length})</span>
                        {isMixed && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                            разные юрлица
                          </span>
                        )}
                      </button>
                      <div className="flex items-center gap-2">
                        <select
                          value={current}
                          onChange={(e) =>
                            setSelected((prev) => ({ ...prev, [c.slug]: Number(e.target.value) }))
                          }
                          className="h-9 rounded-md border border-border bg-background px-2 text-sm outline-none focus:border-brand"
                        >
                          <option value="" disabled>
                            — не задано —
                          </option>
                          {sellers.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.shortName}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          disabled={pending === c.slug}
                          onClick={() => saveCategory(c.slug)}
                          className="h-9 rounded-md border border-border px-3 text-sm font-medium hover:border-brand hover:text-brand disabled:opacity-50"
                        >
                          {pending === c.slug ? "..." : "Всем сразу"}
                        </button>
                      </div>
                    </div>

                    {isOpen && (
                      <div className="mt-3 ml-5 flex flex-col gap-1.5 border-l border-border pl-3">
                        {itemsInCategory.map((p) => (
                          <div key={p.article} className="flex items-center justify-between gap-3">
                            <span className="truncate text-xs text-muted" title={p.name}>
                              {p.article} — {p.name}
                            </span>
                            <select
                              defaultValue={p.sellerId ?? ""}
                              onChange={(e) => saveProduct(p.article, Number(e.target.value))}
                              disabled={pending === p.article}
                              className="h-8 shrink-0 rounded-md border border-border bg-background px-2 text-xs outline-none focus:border-brand"
                            >
                              <option value="" disabled>
                                — не задано —
                              </option>
                              {sellers.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.shortName}
                                </option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}
