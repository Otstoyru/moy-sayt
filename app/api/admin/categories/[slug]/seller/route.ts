import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { setCategorySeller } from "@/lib/sellers";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const admin = await requireRole(["administrator"]);
  if (!admin) return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });

  const { slug } = await params;
  const body = await request.json().catch(() => null);
  const sellerId = Number(body?.sellerId);
  if (!Number.isInteger(sellerId)) {
    return NextResponse.json({ error: "Некорректный продавец" }, { status: 400 });
  }

  const updated = await setCategorySeller(slug, sellerId);
  return NextResponse.json({ ok: true, updated });
}
