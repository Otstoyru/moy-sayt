import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { getStock, recordReturn } from "@/lib/db";

export async function POST(request: NextRequest) {
  const staff = await requireRole(["manager", "administrator"]);
  if (!staff) return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Некорректные данные" }, { status: 400 });

  const userId = Number(body.userId);
  const article = String(body.article ?? "").trim();
  const quantity = Number(body.quantity);
  const buyerDocumentNumber = String(body.buyerDocumentNumber ?? "").trim();
  const buyerDocumentDate = body.buyerDocumentDate ? String(body.buyerDocumentDate) : null;

  if (!userId || !article || !Number.isInteger(quantity) || quantity <= 0 || !buyerDocumentNumber) {
    return NextResponse.json({ error: "Заполните все обязательные поля" }, { status: 400 });
  }

  const stock = await getStock(article);
  if (stock === null) {
    return NextResponse.json({ error: `Артикул «${article}» не найден в каталоге` }, { status: 404 });
  }

  const result = await recordReturn({
    userId,
    article,
    quantity,
    buyerDocumentNumber,
    buyerDocumentDate,
    createdBy: staff.id,
  });

  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
