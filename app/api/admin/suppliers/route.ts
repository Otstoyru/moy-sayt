import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { createSupplier } from "@/lib/suppliers";

export async function POST(request: NextRequest) {
  const staff = await requireRole(["manager", "administrator"]);
  if (!staff) return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const sellerId = Number(body?.sellerId);
  const name = String(body?.name ?? "").trim();

  if (!sellerId || !name) {
    return NextResponse.json({ error: "Заполните все обязательные поля" }, { status: 400 });
  }

  const supplier = await createSupplier(sellerId, name);
  return NextResponse.json(supplier);
}
