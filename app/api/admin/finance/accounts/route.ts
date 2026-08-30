import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { createAccount } from "@/lib/finance";

export async function POST(request: NextRequest) {
  const admin = await requireRole(["administrator"]);
  if (!admin) return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const sellerId = Number(body?.sellerId);
  const name = String(body?.name ?? "").trim();
  const kind = String(body?.kind ?? "bank");

  if (!sellerId || !name) {
    return NextResponse.json({ error: "Заполните все обязательные поля" }, { status: 400 });
  }

  const account = await createAccount(sellerId, name, kind);
  return NextResponse.json(account);
}
