import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, email, message } = body ?? {};

  if (!name || !email || !message) {
    return NextResponse.json({ error: "Все поля обязательны" }, { status: 400 });
  }

  console.log("Новое сообщение из контактной формы:", { name, email, message });

  return NextResponse.json({ ok: true });
}
