import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, phone, items, buyerType } = body ?? {};

  if (!name || !phone || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Заполните обязательные поля" }, { status: 400 });
  }

  console.log("Новая заявка на заказ:", JSON.stringify(body, null, 2));

  return NextResponse.json({ ok: true });
}
