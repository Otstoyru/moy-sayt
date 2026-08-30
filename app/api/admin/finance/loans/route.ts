import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { createLoan } from "@/lib/finance";

export async function POST(request: NextRequest) {
  const admin = await requireRole(["administrator"]);
  if (!admin) return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const sellerId = Number(body?.sellerId);
  const direction = String(body?.direction ?? "");
  const counterparty = String(body?.counterparty ?? "").trim();
  const principal = Number(body?.principal);
  const accountId = Number(body?.accountId);
  const startedAt = String(body?.startedAt ?? "");

  if (
    !sellerId ||
    (direction !== "borrowed" && direction !== "lent") ||
    !counterparty ||
    !principal ||
    principal <= 0 ||
    !accountId ||
    !startedAt
  ) {
    return NextResponse.json({ error: "Заполните все обязательные поля" }, { status: 400 });
  }

  const loan = await createLoan({
    sellerId,
    direction,
    counterparty,
    principal,
    interestRate: body?.interestRate ? Number(body.interestRate) : null,
    startedAt,
    dueAt: body?.dueAt ? String(body.dueAt) : null,
    accountId,
    createdBy: admin.id,
  });

  return NextResponse.json(loan);
}
