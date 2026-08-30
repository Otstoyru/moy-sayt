import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { getOrderById, markOrderSold } from "@/lib/db";
import { createTransaction, hasSaleTransactionForOrder } from "@/lib/finance";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const staff = await requireRole(["manager", "administrator"]);
  if (!staff) return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });

  const { id } = await params;
  const orderId = Number(id);
  const body = await request.json().catch(() => ({}));
  const accountsBySeller = (body?.accountsBySeller ?? {}) as Record<string, number>;

  const existingOrder = await getOrderById(orderId);
  if (!existingOrder) return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });

  // Проверяем, что для каждого юрлица в заказе указан счёт поступления,
  // ДО того как отмечать заказ проданным и закреплять номер УПД — иначе
  // при ошибке заказ останется помеченным продано без проводки дохода.
  const alreadyBooked = existingOrder.status === "sold" || (await hasSaleTransactionForOrder(orderId));
  const subtotalsBySeller = new Map<number, number>();
  for (const item of existingOrder.items) {
    if (item.sellerId === null) continue;
    subtotalsBySeller.set(item.sellerId, (subtotalsBySeller.get(item.sellerId) ?? 0) + item.lineTotal);
  }

  if (!alreadyBooked) {
    for (const sellerId of subtotalsBySeller.keys()) {
      if (!accountsBySeller[String(sellerId)]) {
        return NextResponse.json(
          { error: `Не указан счёт поступления для одного из юрлиц заказа (seller ${sellerId})` },
          { status: 400 }
        );
      }
    }
  }

  const order = await markOrderSold(orderId);
  if (!order) return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });

  if (!alreadyBooked) {
    for (const [sellerId, subtotal] of subtotalsBySeller) {
      await createTransaction({
        accountId: accountsBySeller[String(sellerId)],
        amount: subtotal,
        category: "sale",
        description: `Заказ №${orderId}`,
        orderId,
        createdBy: staff.id,
      });
    }
  }

  return NextResponse.json({ ok: true });
}
