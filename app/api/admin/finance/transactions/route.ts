import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { createTransaction } from "@/lib/finance";

export async function POST(request: NextRequest) {
  const admin = await requireRole(["administrator"]);
  if (!admin) return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const accountId = Number(body?.accountId);
  const amount = Number(body?.amount);
  const category = String(body?.category ?? "").trim();

  if (!accountId || !amount || !category) {
    return NextResponse.json({ error: "Заполните все обязательные поля" }, { status: 400 });
  }
  if (category === "sale" || category.startsWith("loan_")) {
    return NextResponse.json(
      { error: "Эта категория проставляется автоматически, вручную её вносить нельзя" },
      { status: 400 }
    );
  }

  const transaction = await createTransaction({
    accountId,
    amount,
    category,
    description: body?.description ? String(body.description) : null,
    createdBy: admin.id,
    occurredAt: body?.occurredAt ? String(body.occurredAt) : undefined,
  });

  return NextResponse.json(transaction);
}
