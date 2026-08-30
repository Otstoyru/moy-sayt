import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { setProductSeller } from "@/lib/sellers";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ article: string }> }
) {
  const admin = await requireRole(["administrator"]);
  if (!admin) return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });

  const { article: encoded } = await params;
  const article = decodeURIComponent(encoded);

  const body = await request.json().catch(() => null);
  const sellerId = Number(body?.sellerId);
  if (!Number.isInteger(sellerId)) {
    return NextResponse.json({ error: "Некорректный продавец" }, { status: 400 });
  }

  const ok = await setProductSeller(article, sellerId);
  if (!ok) return NextResponse.json({ error: "Товар не найден" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
