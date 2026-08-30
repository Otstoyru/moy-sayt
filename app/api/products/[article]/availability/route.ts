import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getProductByArticle } from "@/lib/products";
import { getStock, getReservedByOthers } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ article: string }> }
) {
  const { article: encoded } = await params;
  const article = decodeURIComponent(encoded);

  const product = await getProductByArticle(article);
  if (!product) {
    return NextResponse.json({ error: "Товар не найден" }, { status: 404 });
  }

  const user = await getCurrentUser();
  const stock = (await getStock(article)) ?? 0;
  const reservedByOthers = await getReservedByOthers(article, user?.id ?? -1);
  const available = Math.max(0, Math.floor((stock - reservedByOthers) / product.packageSize));

  return NextResponse.json({ available });
}
