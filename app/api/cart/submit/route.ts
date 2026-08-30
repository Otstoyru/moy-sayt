import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getCart } from "@/lib/cart";
import { confirmUserReservations, insertOrder } from "@/lib/db";

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

  await confirmUserReservations(user.id);

  await insertOrder({
    userId: user.id,
    name,
    phone,
    email: email || null,
    comment: comment || null,
    buyerType: buyerType || "retail",
    items: cart.items,
    discountPercent: cart.discountPercent,
    total: cart.total,
  });

  return NextResponse.json({ ok: true });
}
