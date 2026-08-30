import { redirect } from "next/navigation";
import Link from "next/link";
import { requireRole, getUserById } from "@/lib/auth";
import { getAllReturns, getBuyersWithSoldOrders } from "@/lib/db";
import { getAllProducts } from "@/lib/products";
import ReturnForm from "./ReturnForm";

export default async function AdminReturnsPage() {
  const staff = await requireRole(["manager", "administrator"]);
  if (!staff) redirect("/login?next=/admin/returns");

  const [returns, buyers, products] = await Promise.all([
    getAllReturns(),
    getBuyersWithSoldOrders(),
    getAllProducts(),
  ]);
  const buyerNames = new Map<number, string>();
  await Promise.all(
    [...new Set(returns.map((r) => r.userId))].map(async (userId) => {
      const u = await getUserById(userId);
      if (u) buyerNames.set(userId, `${u.name} (${u.email})`);
    })
  );

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold">Возвраты</h1>
        <Link href="/admin/orders" className="text-sm font-medium text-brand hover:underline">
          Заказы →
        </Link>
      </div>
      <p className="mt-2 text-sm text-muted">
        Возврат оформляет сам покупатель — своей возвратной накладной (номер и дата его документа).
        Мы приходуем товар на склад и проверяем, что количество не превышает то, что этот покупатель
        когда-либо получил по проданным заказам за вычетом уже оформленных возвратов.
      </p>

      <ReturnForm buyers={buyers} articles={products.map((p) => p.article)} />

      <h2 className="mt-10 font-display text-xl font-semibold">История возвратов</h2>
      {returns.length === 0 ? (
        <p className="mt-4 text-sm text-muted">Возвратов пока не было.</p>
      ) : (
        <div className="mt-4 divide-y divide-border rounded-xl border border-border bg-surface">
          {returns.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm">
              <div>
                <p className="font-medium">
                  {r.article} — {r.quantity} уп.
                </p>
                <p className="text-xs text-muted">{buyerNames.get(r.userId) ?? `покупатель #${r.userId}`}</p>
              </div>
              <div className="text-right text-xs text-muted">
                <p>
                  Накладная покупателя №{r.buyerDocumentNumber}
                  {r.buyerDocumentDate
                    ? ` от ${new Date(r.buyerDocumentDate).toLocaleDateString("ru-RU")}`
                    : ""}
                </p>
                <p>{new Date(r.createdAt).toLocaleString("ru-RU")}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
