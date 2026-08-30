import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, getUserById } from "@/lib/auth";
import { getOrderById } from "@/lib/db";
import { getSellerById } from "@/lib/sellers";
import { renderInvoicePdf } from "@/lib/invoice";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Требуется вход в аккаунт" }, { status: 401 });

  const { id } = await params;
  const order = await getOrderById(Number(id));
  if (!order) return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });

  const isOwner = order.userId === user.id;
  const isStaff = user.role === "manager" || user.role === "administrator";
  if (!isOwner && !isStaff) {
    return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
  }

  const sellerIds = [...new Set(order.items.map((i) => i.sellerId).filter((v): v is number => v !== null))];
  if (sellerIds.length === 0) {
    return NextResponse.json({ error: "У позиций заказа не указан продавец" }, { status: 400 });
  }

  const requestedSellerId = request.nextUrl.searchParams.get("seller");
  const sellerId = requestedSellerId ? Number(requestedSellerId) : sellerIds[0];
  if (!sellerIds.includes(sellerId)) {
    return NextResponse.json({ error: "Некорректный продавец для этого заказа" }, { status: 400 });
  }

  const seller = await getSellerById(sellerId);
  if (!seller) return NextResponse.json({ error: "Продавец не найден" }, { status: 404 });

  const items = order.items.filter((i) => i.sellerId === sellerId);

  // Реквизиты покупателя — это всегда владелец заказа, а не тот, кто
  // сейчас смотрит счёт (менеджер/администратор может открывать чужие заказы).
  const buyer = isOwner ? user : await getUserById(order.userId);
  if (!buyer) return NextResponse.json({ error: "Покупатель не найден" }, { status: 404 });

  const pdf = await renderInvoicePdf(order, seller, buyer, items);

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="schet-${order.id}.pdf"`,
    },
  });
}
