import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { recordSupplierReceipt } from "@/lib/suppliers";

export async function POST(request: NextRequest) {
  const staff = await requireRole(["manager", "administrator"]);
  if (!staff) return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const supplierId = Number(body?.supplierId);
  const items = Array.isArray(body?.items) ? body.items : [];

  if (!supplierId || items.length === 0) {
    return NextResponse.json({ error: "Заполните все обязательные поля" }, { status: 400 });
  }
  for (const line of items) {
    if (!line.article || !Number.isFinite(line.quantity) || line.quantity <= 0 || !Number.isFinite(line.unitPrice) || line.unitPrice < 0) {
      return NextResponse.json({ error: "Проверьте артикул, количество и цену в каждой строке" }, { status: 400 });
    }
  }

  const result = await recordSupplierReceipt({
    supplierId,
    items,
    documentNumber: body?.documentNumber ? String(body.documentNumber) : null,
    documentDate: body?.documentDate ? String(body.documentDate) : null,
    description: body?.description ? String(body.description) : null,
    createdBy: staff.id,
  });

  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json(result.receipt);
}
