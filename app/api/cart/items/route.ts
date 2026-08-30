import { NextRequest, NextResponse } from "next/server";
import { getOrCreateSessionId } from "@/lib/session";
import { getProductByArticle } from "@/lib/products";
import { trySetReservation, deleteReservation, getStock, getReservedByOthers } from "@/lib/db";
import { getCart } from "@/lib/cart";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const article = body?.article;
  const packages = Number(body?.packages);

  if (typeof article !== "string" || !Number.isInteger(packages) || packages < 0) {
    return NextResponse.json({ error: "Некорректные данные" }, { status: 400 });
  }

  const product = getProductByArticle(article);
  if (!product) {
    return NextResponse.json({ error: "Товар не найден" }, { status: 404 });
  }

  const sessionId = await getOrCreateSessionId();

  if (packages === 0) {
    await deleteReservation(article, sessionId);
    const cart = await getCart(sessionId);
    return NextResponse.json(cart);
  }

  const quantityUnits = packages * product.packageSize;
  const ok = await trySetReservation(article, sessionId, quantityUnits);

  if (!ok) {
    const stock = (await getStock(article)) ?? 0;
    const reservedByOthers = await getReservedByOthers(article, sessionId);
    const availablePackages = Math.max(
      0,
      Math.floor((stock - reservedByOthers) / product.packageSize)
    );
    return NextResponse.json(
      { error: "Недостаточно товара на складе", availablePackages },
      { status: 409 }
    );
  }

  const cart = await getCart(sessionId);
  return NextResponse.json(cart);
}
