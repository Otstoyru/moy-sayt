import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getCart } from "@/lib/cart";
import { confirmUserReservations, insertOrder } from "@/lib/db";
import { nextBusinessDayDeadline } from "@/lib/businessDays";
import { sendMail, MANAGER_EMAIL } from "@/lib/mail";
import { orgFormLabel } from "@/lib/orgForms";

const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Moscow",
};

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Требуется вход в аккаунт" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const { name, phone, email, comment, buyerType } = body ?? {};

  if (!name || !phone) {
    return NextResponse.json({ error: "Заполните обязательные поля" }, { status: 400 });
  }

  const cart = await getCart(user.id);

  if (cart.items.length === 0) {
    return NextResponse.json({ error: "Список заказа пуст" }, { status: 400 });
  }

  const paymentDueAt = nextBusinessDayDeadline(new Date());

  await confirmUserReservations(user.id, paymentDueAt);

  const orderId = await insertOrder({
    userId: user.id,
    name,
    phone,
    email: email || null,
    comment: comment || null,
    buyerType: buyerType || "retail",
    items: cart.items,
    discountPercent: cart.discountPercent,
    total: cart.total,
    paymentDueAt,
  });

  const dueLabel = paymentDueAt.toLocaleString("ru-RU", DATE_FORMAT);

  const itemsHtml = cart.items
    .map(
      (i) =>
        `<tr>
          <td>${i.name} (${i.article})</td>
          <td>${i.packages} уп.</td>
          <td>${i.unitPrice.toFixed(2)} ₽</td>
          <td>${i.lineTotal.toFixed(2)} ₽</td>
        </tr>`
    )
    .join("");

  sendMail({
    to: MANAGER_EMAIL,
    subject: `Новый заказ №${orderId} от ${name}`,
    html: `
      <h2>Заказ №${orderId}</h2>
      <p>
        <b>Покупатель:</b> ${user.name} (${orgFormLabel(user.orgForm)}, ${user.legalName}, ИНН ${user.inn})<br>
        <b>Телефон:</b> ${phone}<br>
        <b>Email:</b> ${email || user.email}<br>
        <b>Тип:</b> ${buyerType === "wholesale" ? "Оптовый партнёр" : "Розничный покупатель"}
        ${comment ? `<br><b>Комментарий:</b> ${comment}` : ""}
      </p>
      <table border="1" cellpadding="6" cellspacing="0">
        <tr><th>Товар</th><th>Кол-во</th><th>Цена/шт.</th><th>Сумма</th></tr>
        ${itemsHtml}
      </table>
      <p>
        <b>Скидка:</b> ${Math.round(cart.discountPercent * 100)}%<br>
        <b>Итого:</b> ${cart.total.toFixed(2)} ₽<br>
        <b>Оплатить до:</b> ${dueLabel} (МСК)
      </p>
    `,
  }).catch((err) => console.error("Не удалось отправить письмо о заказе:", err));

  return NextResponse.json({ ok: true, orderId, paymentDueAt: paymentDueAt.toISOString() });
}
