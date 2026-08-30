import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { recordLoanPayment } from "@/lib/finance";

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
  const kind = String(body?.kind ?? "");

  if (!accountId || !amount || amount <= 0 || (kind !== "repayment" && kind !== "interest")) {
    return NextResponse.json({ error: "Заполните все обязательные поля" }, { status: 400 });
  }

  try {
    await recordLoanPayment(
      Number(id),
      accountId,
      amount,
      kind,
      body?.occurredAt ? String(body.occurredAt) : new Date().toISOString().slice(0, 10),
      admin.id
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось сохранить платёж";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
