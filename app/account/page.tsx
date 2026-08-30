import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { orgFormLabel } from "@/lib/orgForms";
import LogoutButton from "./LogoutButton";

const ROLE_LABEL: Record<string, string> = {
  user: "Покупатель",
  manager: "Менеджер",
  administrator: "Администратор",
};

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account");

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

      <p className="mt-10 text-sm text-muted">
        Список заказов и скачивание счетов появятся здесь на следующем этапе.
      </p>
    </div>
  );
}
