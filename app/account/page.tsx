import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { orgFormLabel } from "@/lib/orgForms";
import { getUserOrders } from "@/lib/db";
import LogoutButton from "./LogoutButton";

const ROLE_LABEL: Record<string, string> = {
  user: "Покупатель",
  manager: "Менеджер",
  administrator: "Администратор",
};

const STATUS_LABEL: Record<string, string> = {
  reserved: "Ожидает оплаты",
  paid: "Оплачен",
  sold: "Продано",
  cancelled: "Отменён",
};

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account");

  const orders = await getUserOrders(user.id);

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold">Личный кабинет</h1>
        <LogoutButton />
      </div>

      <dl className="mt-8 space-y-3 text-sm">
        <div>
          <dt className="text-muted">Имя</dt>
          <dd className="font-medium">{user.name}</dd>
        </div>
        <div>
          <dt className="text-muted">Роль</dt>
          <dd className="font-medium">{ROLE_LABEL[user.role] ?? user.role}</dd>
        </div>
        <div>
          <dt className="text-muted">Email</dt>
          <dd className="font-medium">{user.email}</dd>
        </div>
        <div>
          <dt className="text-muted">Телефон</dt>
          <dd className="font-medium">{user.phone}</dd>
        </div>
      </dl>

      <h2 className="mt-10 font-display text-xl font-semibold">Реквизиты</h2>
      <dl className="mt-4 space-y-3 text-sm">
        <div>
          <dt className="text-muted">Форма</dt>
          <dd className="font-medium">{orgFormLabel(user.orgForm)}</dd>
        </div>
        <div>
          <dt className="text-muted">Название / ФИО</dt>
          <dd className="font-medium">{user.legalName}</dd>
        </div>
        <div>
          <dt className="text-muted">Юридический адрес</dt>
          <dd className="font-medium">{user.legalAddress}</dd>
        </div>
        <div>
          <dt className="text-muted">ИНН{user.kpp ? " / КПП" : ""}</dt>
          <dd className="font-medium">
            {user.inn}
            {user.kpp ? ` / ${user.kpp}` : ""}
          </dd>
        </div>
        <div>
          <dt className="text-muted">Банк</dt>
          <dd className="font-medium">
            {user.bankName}, БИК {user.bankBik}
          </dd>
        </div>
        <div>
          <dt className="text-muted">Расчётный счёт</dt>
          <dd className="font-medium">{user.bankAccount}</dd>
        </div>
        {user.deliveryAddress && (
          <div>
            <dt className="text-muted">Адрес доставки</dt>
            <dd className="font-medium">{user.deliveryAddress}</dd>
          </div>
        )}
      </dl>

      <h2 className="mt-10 font-display text-xl font-semibold">Мои заказы</h2>
      {orders.length === 0 ? (
        <p className="mt-4 text-sm text-muted">Заказов пока нет.</p>
      ) : (
        <div className="mt-4 divide-y divide-border rounded-xl border border-border bg-surface">
          {orders.map((order) => {
            const isExpired =
              order.status === "reserved" &&
              order.paymentDueAt !== null &&
              new Date(order.paymentDueAt) < new Date();
            const statusLabel = isExpired
              ? "Резерв снят (просрочена оплата)"
              : STATUS_LABEL[order.status] ?? order.status;

            return (
              <div key={order.id} className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">Заказ №{order.id}</p>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      isExpired
                        ? "bg-red-100 text-red-700"
                        : order.status === "reserved"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-green-100 text-green-700"
                    }`}
                  >
                    {statusLabel}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted">
                  {new Date(order.createdAt).toLocaleString("ru-RU", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {order.status === "reserved" && order.paymentDueAt && !isExpired && (
                    <>
                      {" "}
                      · оплатить до{" "}
                      {new Date(order.paymentDueAt).toLocaleString("ru-RU", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </>
                  )}
                </p>
                <ul className="mt-2 space-y-1 text-sm text-muted">
                  {order.items.map((item) => (
                    <li key={item.article}>
                      {item.name} — {item.packages} уп. ·{" "}
                      {item.lineTotal.toLocaleString("ru-RU", { maximumFractionDigits: 0 })} ₽
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-sm font-semibold">
                  Итого: {order.total.toLocaleString("ru-RU", { maximumFractionDigits: 0 })} ₽
                  {order.discountPercent > 0 && (
                    <span className="ml-2 font-normal text-muted">
                      (скидка {Math.round(order.discountPercent * 100)}%)
                    </span>
                  )}
                </p>
              </div>
            );
          })}
        </div>
      )}

      <p className="mt-6 text-sm text-muted">
        Скачивание счёта на оплату появится здесь на следующем этапе.
      </p>
    </div>
  );
}
