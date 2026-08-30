import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { recordSupplierPayment } from "@/lib/suppliers";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireRole(["administrator"]);
  if (!admin) return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const accountId = Number(body?.accountId);
  const amount = Number(body?.amount);

  if (!accountId || !amount || amount <= 0) {
    return NextResponse.json({ error: "Заполните все обязательные поля" }, { status: 400 });
  }

  await recordSupplierPayment(
    Number(id),
    accountId,
    amount,
    body?.occurredAt ? String(body.occurredAt) : undefined,
    admin.id,
    null
  );

  return NextResponse.json({ ok: true });
}
