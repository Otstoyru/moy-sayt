import { NextRequest, NextResponse } from "next/server";
import { getOrCreateSessionId } from "@/lib/session";
import { getCart } from "@/lib/cart";
import { confirmSessionReservations, insertOrder } from "@/lib/db";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const { name, phone, email, comment, buyerType } = body ?? {};

  if (!name || !phone) {
    return NextResponse.json({ error: "Заполните обязательные поля" }, { status: 400 });
  }

  const sessionId = await getOrCreateSessionId();
  const cart = await getCart(sessionId);

  if (cart.items.length === 0) {
    return NextResponse.json({ error: "Список заказа пуст" }, { status: 400 });
  }

  await confirmSessionReservations(sessionId);

  await insertOrder({
    sessionId,
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
