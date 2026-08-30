"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Category, Group } from "@/lib/categories";
import type { Seller } from "@/lib/sellers";

export default function CategorySellerTable({
  groups,
  categories,
  sellers,
  sellerByCategory,
}: {
  groups: Group[];
  categories: Category[];
  sellers: Seller[];
  sellerByCategory: Record<string, number | null>;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [selected, setSelected] = useState<Record<string, number>>({});

  async function save(slug: string) {
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
                return (
                  <div key={c.slug} className="flex items-center justify-between gap-3 p-3">
                    <span className="text-sm">{c.name}</span>
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
                        onClick={() => save(c.slug)}
                        className="h-9 rounded-md border border-border px-3 text-sm font-medium hover:border-brand hover:text-brand disabled:opacity-50"
                      >
                        {pending === c.slug ? "..." : "Сохранить"}
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}
