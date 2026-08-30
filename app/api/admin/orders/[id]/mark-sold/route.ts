import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { markOrderSold } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const staff = await requireRole(["manager", "administrator"]);
  if (!staff) return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });

  const { id } = await params;
  const order = await markOrderSold(Number(id));
  if (!order) return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
