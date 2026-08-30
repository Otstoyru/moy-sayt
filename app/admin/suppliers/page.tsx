import { redirect } from "next/navigation";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { getSellers } from "@/lib/sellers";
import { getSuppliers, getReceiptsForSupplier } from "@/lib/suppliers";
import { getAccounts } from "@/lib/finance";
import { getAllProducts } from "@/lib/products";
import { getCategories, getGroups } from "@/lib/categories";
import SupplierFormModal from "./SupplierFormModal";
import ReceiptForm from "./ReceiptForm";
import SupplierPaymentForm from "./SupplierPaymentForm";
import NewProductModal from "./NewProductModal";

function money(n: number): string {
  return n.toLocaleString("ru-RU", { maximumFractionDigits: 0 }) + " ₽";
}

export default async function AdminSuppliersPage() {
  const staff = await requireRole(["manager", "administrator"]);
  if (!staff) redirect("/login?next=/admin/suppliers");

  const [sellers, suppliers, accounts, products, categories, groups] = await Promise.all([
    getSellers(),
    getSuppliers(),
    getAccounts(),
    getAllProducts(),
    getCategories(),
    getGroups(),
  ]);
  const sellerById = new Map(sellers.map((s) => [s.id, s]));
  const receiptsBySupplier = await Promise.all(suppliers.map((s) => getReceiptsForSupplier(s.id)));

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold">Расчёты с поставщиками</h1>
        <Link href="/admin/orders" className="text-sm font-medium text-brand hover:underline">
          Заказы →
        </Link>
      </div>
      <p className="mt-2 text-sm text-muted">
        Приход от поставщика (в т.ч. от собственного производства) создаёт задолженность и сразу
        увеличивает остаток по каждому артикулу — деньги никуда не двигаются, пока долг не оплачен.
      </p>

      <SupplierFormModal sellers={sellers.map((s) => ({ id: s.id, name: s.shortName }))} />

      {suppliers.length === 0 ? (
        <p className="mt-4 text-sm text-muted">Поставщиков пока нет.</p>
      ) : (
        <div className="mt-4 flex flex-col gap-4">
          {suppliers.map((supplier, i) => {
            const receipts = receiptsBySupplier[i];
            const sellerAccounts = accounts.filter((a) => a.sellerId === supplier.sellerId && a.isActive);
            return (
              <div key={supplier.id} className="rounded-xl border border-border bg-surface p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">
                    {supplier.name}{" "}
                    <span className="text-xs font-normal text-muted">({sellerById.get(supplier.sellerId)?.shortName})</span>
                  </p>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      supplier.remaining > 0 ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
                    }`}
                  >
                    Долг: {money(supplier.remaining)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted">
                  Оприходовано: {money(supplier.owed)} · Оплачено: {money(supplier.paid)}
                </p>

                {receipts.length > 0 && (
                  <ul className="mt-2 space-y-1 text-xs text-muted">
                    {receipts.slice(0, 5).map((r) => (
                      <li key={r.id}>
                        {new Date(r.createdAt).toLocaleDateString("ru-RU")} · {money(r.amount)}
                        {r.documentNumber ? ` · накладная №${r.documentNumber}` : ""} —{" "}
                        {r.items.map((it) => `${it.name} ×${it.quantity}`).join(", ")}
                      </li>
                    ))}
                  </ul>
                )}

                {staff.role === "administrator" && supplier.remaining > 0 && (
                  <SupplierPaymentForm
                    supplierId={supplier.id}
                    accounts={sellerAccounts.map((a) => ({ id: a.id, name: a.name }))}
                    remaining={supplier.remaining}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-10 flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold">Оприходовать накладную</h2>
        <NewProductModal categories={categories} groups={groups} sellers={sellers.map((s) => ({ id: s.id, name: s.shortName }))} />
      </div>
      <ReceiptForm
        suppliers={suppliers.map((s) => ({ id: s.id, name: s.name }))}
        articles={products.map((p) => p.article)}
      />
    </div>
  );
}
