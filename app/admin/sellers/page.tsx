import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { getSellers, sellerLegalFormLabel } from "@/lib/sellers";
import { getCategories, getGroups } from "@/lib/categories";
import { getAllProducts } from "@/lib/products";
import SellerFormModal from "./SellerFormModal";
import CategorySellerTable from "./CategorySellerTable";

export default async function AdminSellersPage() {
  const admin = await requireRole(["administrator"]);
  if (!admin) redirect("/login?next=/admin/sellers");

  const [sellers, categories, groups, products] = await Promise.all([
    getSellers(),
    getCategories(),
    getGroups(),
    getAllProducts(),
  ]);

  const sellerByCategory = new Map<string, number | null>();
  for (const c of categories) {
    const inCategory = products.filter((p) => p.categorySlug === c.slug);
    const ids = new Set(inCategory.map((p) => p.sellerId));
    sellerByCategory.set(c.slug, ids.size === 1 ? [...ids][0] : null);
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold">Юрлица</h1>
        <SellerFormModal />
      </div>
      <p className="mt-2 text-sm text-muted">
        Юрлица/ИП/самозанятые, от чьего имени продаются товары и услуги — используются
        в счетах на оплату и прайс-листе.
      </p>

      <div className="mt-8 divide-y divide-border rounded-xl border border-border bg-surface">
        {sellers.length === 0 && (
          <p className="p-4 text-sm text-muted">Пока не добавлено ни одного юрлица.</p>
        )}
        {sellers.map((s) => (
          <div key={s.id} className="flex items-center justify-between gap-4 p-4">
            <div>
              <p className="font-medium">
                {s.shortName} <span className="text-xs text-muted">({sellerLegalFormLabel(s.legalForm)})</span>
              </p>
              <p className="text-xs text-muted">
                ИНН {s.inn}
                {s.kpp ? ` · КПП ${s.kpp}` : ""}
                {!s.bankAccount && (
                  <span className="ml-2 text-amber-600">— не заполнены банковские реквизиты</span>
                )}
              </p>
            </div>
            <SellerFormModal seller={s} />
          </div>
        ))}
      </div>

      <h2 className="mt-10 font-display text-xl font-semibold">Привязка категорий к юрлицам</h2>
      <p className="mt-2 text-sm text-muted">
        Все товары в категории будут продаваться от выбранного юрлица — это определяет,
        кто выставляет счёт по позициям этой категории.
      </p>
      <CategorySellerTable groups={groups} categories={categories} sellers={sellers} sellerByCategory={Object.fromEntries(sellerByCategory)} />
    </div>
  );
}
