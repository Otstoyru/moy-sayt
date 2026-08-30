import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { setOrderProcessed } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const staff = await requireRole(["manager", "administrator"]);
  if (!staff) return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (typeof body?.processed !== "boolean") {
    return NextResponse.json({ error: "Некорректные данные" }, { status: 400 });
  }

  await setOrderProcessed(Number(id), body.processed);
  return NextResponse.json({ ok: true });
}
