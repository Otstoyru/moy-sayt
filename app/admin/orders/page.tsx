import { redirect } from "next/navigation";
import Link from "next/link";
import { requireRole, getUserById } from "@/lib/auth";
import { getAllOrders } from "@/lib/db";
import { getSellers } from "@/lib/sellers";
import { getAccounts } from "@/lib/finance";
import MarkSoldButton from "./MarkSoldButton";
import ProcessedToggle from "./ProcessedToggle";

const STATUS_LABEL: Record<string, string> = {
  reserved: "Ожидает оплаты",
  paid: "Оплачен",
  sold: "Продано",
  cancelled: "Отменён",
};

export default async function AdminOrdersPage() {
  const staff = await requireRole(["manager", "administrator"]);
  if (!staff) redirect("/login?next=/admin/orders");

  const [orders, sellers, accounts] = await Promise.all([getAllOrders(), getSellers(), getAccounts()]);
  const sellerById = new Map(sellers.map((s) => [s.id, s]));
  const accountsBySeller = new Map<number, { id: number; name: string }[]>();
  for (const a of accounts) {
    if (!a.isActive) continue;
    const list = accountsBySeller.get(a.sellerId) ?? [];
    list.push({ id: a.id, name: a.name });
    accountsBySeller.set(a.sellerId, list);
  }
  const buyers = await Promise.all(orders.map((o) => getUserById(o.userId)));

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold">Заказы</h1>
        <div className="flex items-center gap-4">
          <Link href="/admin/stock" className="text-sm font-medium text-brand hover:underline">
            Остатки →
          </Link>
          <Link href="/admin/returns" className="text-sm font-medium text-brand hover:underline">
            Возвраты →
          </Link>
          <Link href="/admin/suppliers" className="text-sm font-medium text-brand hover:underline">
            Поставщики →
          </Link>
          {staff.role === "administrator" && (
            <>
              <Link href="/admin/finance" className="text-sm font-medium text-brand hover:underline">
                Финансы →
              </Link>
              <Link href="/admin/sellers" className="text-sm font-medium text-brand hover:underline">
                Юрлица →
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="mt-8 divide-y divide-border rounded-xl border border-border bg-surface">
        {orders.length === 0 && <p className="p-4 text-sm text-muted">Заказов пока нет.</p>}
        {orders.map((order, i) => {
          const buyer = buyers[i];
          const sellerIds = [
            ...new Set(order.items.map((item) => item.sellerId).filter((v): v is number => v !== null)),
          ];
          const sellerGroups = sellerIds.map((sellerId) => ({
            sellerId,
            sellerName: sellerById.get(sellerId)?.shortName ?? `юрлицо #${sellerId}`,
            subtotal: order.items
              .filter((item) => item.sellerId === sellerId)
              .reduce((sum, item) => sum + item.lineTotal, 0),
            accounts: accountsBySeller.get(sellerId) ?? [],
          }));

          return (
            <div key={order.id} className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">
                  Заказ №{order.id} — {buyer?.legalName ?? "покупатель не найден"}
                </p>
                <div className="flex items-center gap-3">
                  <ProcessedToggle orderId={order.id} processed={order.processed} />
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      order.status === "sold" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {STATUS_LABEL[order.status] ?? order.status}
                  </span>
                </div>
              </div>
              <p className="mt-1 text-xs text-muted">
                {new Date(order.createdAt).toLocaleString("ru-RU", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                {buyer && ` · ${buyer.email} · ${buyer.phone}`}
              </p>
              <ul className="mt-2 space-y-1 text-sm text-muted">
                {order.items.map((item) => (
                  <li key={item.article}>
                    {item.name} — {item.packages} уп. · {item.lineTotal.toLocaleString("ru-RU", { maximumFractionDigits: 0 })} ₽
                    {item.sellerId && sellers.length > 1 ? ` (${sellerById.get(item.sellerId)?.shortName})` : ""}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-sm font-semibold">
                Итого: {order.total.toLocaleString("ru-RU", { maximumFractionDigits: 0 })} ₽
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                {sellerIds.map((sellerId) => (
                  <a
                    key={`invoice-${sellerId}`}
                    href={`/api/account/orders/${order.id}/invoice?seller=${sellerId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-brand hover:underline"
                  >
                    Счёт{sellers.length > 1 ? ` (${sellerById.get(sellerId)?.shortName})` : ""}
                  </a>
                ))}

                {order.status !== "sold" && <MarkSoldButton orderId={order.id} sellerGroups={sellerGroups} />}

                {order.status === "sold" &&
                  sellerIds.map((sellerId) => (
                    <a
                      key={`upd-${sellerId}`}
                      href={`/api/account/orders/${order.id}/upd?seller=${sellerId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-brand hover:underline"
                    >
                      УПД{sellers.length > 1 ? ` (${sellerById.get(sellerId)?.shortName})` : ""}
                    </a>
                  ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
