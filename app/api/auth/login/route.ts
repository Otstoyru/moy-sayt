import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail, verifyPassword, createSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = body?.email;
  const password = body?.password;

  if (typeof email !== "string" || typeof password !== "string") {
    return NextResponse.json({ error: "Заполните email и пароль" }, { status: 400 });
  }

  const user = await getUserByEmail(email.trim().toLowerCase());
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json({ error: "Неверный email или пароль" }, { status: 401 });
  }

  await createSession(user.id);
  return NextResponse.json({ ok: true });
}
