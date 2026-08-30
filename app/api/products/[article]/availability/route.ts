import { NextRequest, NextResponse } from "next/server";
import { getOrCreateSessionId } from "@/lib/session";
import { getProductByArticle } from "@/lib/products";
import { getStock, getReservedByOthers } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ article: string }> }
) {
  const { article: encoded } = await params;
  const article = decodeURIComponent(encoded);

  const product = getProductByArticle(article);
  if (!product) {
    return NextResponse.json({ error: "Товар не найден" }, { status: 404 });
  }

  const sessionId = await getOrCreateSessionId();
  const stock = (await getStock(article)) ?? 0;
  const reservedByOthers = await getReservedByOthers(article, sessionId);
  const available = Math.max(0, Math.floor((stock - reservedByOthers) / product.packageSize));

  return NextResponse.json({ available });
}
