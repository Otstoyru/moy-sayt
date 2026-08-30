import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { importStockWorkbook } from "@/lib/stockImport";

export async function POST(request: NextRequest) {
  const staff = await requireRole(["manager", "administrator"]);
  if (!staff) return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Файл не передан" }, { status: 400 });
  }
  if (!file.name.toLowerCase().endsWith(".xlsx")) {
    return NextResponse.json({ error: "Ожидается файл .xlsx" }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await importStockWorkbook(buffer);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось разобрать файл";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
