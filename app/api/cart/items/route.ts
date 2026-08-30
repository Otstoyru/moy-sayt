import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getProductByArticle } from "@/lib/products";
import { trySetReservation, deleteReservation, getStock, getReservedByOthers } from "@/lib/db";
import { getCart } from "@/lib/cart";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Требуется вход в аккаунт" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const article = body?.article;
  const packages = Number(body?.packages);

  if (typeof article !== "string" || !Number.isInteger(packages) || packages < 0) {
    return NextResponse.json({ error: "Некорректные данные" }, { status: 400 });
  }

  const product = await getProductByArticle(article);
  if (!product) {
    return NextResponse.json({ error: "Товар не найден" }, { status: 404 });
  }

  if (packages === 0) {
    await deleteReservation(article, user.id);
    const cart = await getCart(user.id);
    return NextResponse.json(cart);
  }

  const quantityUnits = packages * product.packageSize;
  const ok = await trySetReservation(article, user.id, quantityUnits);

  if (!ok) {
    const stock = (await getStock(article)) ?? 0;
    const reservedByOthers = await getReservedByOthers(article, user.id);
    const availablePackages = Math.max(
      0,
      Math.floor((stock - reservedByOthers) / product.packageSize)
    );
    return NextResponse.json(
      { error: "Недостаточно товара на складе", availablePackages },
      { status: 409 }
    );
  }

  const cart = await getCart(user.id);
  return NextResponse.json(cart);
}
