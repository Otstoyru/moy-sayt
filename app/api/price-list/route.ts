import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, phone } = body ?? {};

  if (!name || !phone) {
    return NextResponse.json({ error: "Заполните обязательные поля" }, { status: 400 });
  }

  console.log("Запрос прайс-листа:", body);

  return NextResponse.json({ ok: true });
}
