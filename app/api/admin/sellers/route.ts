import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { createSeller, getSellers } from "@/lib/sellers";

const REQUIRED_FIELDS = ["legalForm", "fullName", "shortName", "inn", "legalAddress"] as const;

export async function GET() {
  const admin = await requireRole(["administrator"]);
  if (!admin) return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
  return NextResponse.json(await getSellers());
}

export async function POST(request: NextRequest) {
  const admin = await requireRole(["administrator"]);
  if (!admin) return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Некорректные данные" }, { status: 400 });

  for (const field of REQUIRED_FIELDS) {
    if (!body[field]) {
      return NextResponse.json({ error: "Заполните все обязательные поля" }, { status: 400 });
    }
  }

  const seller = await createSeller({
    legalForm: body.legalForm,
    fullName: body.fullName,
    shortName: body.shortName,
    inn: body.inn,
    kpp: body.kpp || null,
    ogrn: body.ogrn || null,
    legalAddress: body.legalAddress,
    phone: body.phone || null,
    email: body.email || null,
    bankAccount: body.bankAccount || null,
    bankName: body.bankName || null,
    bankBik: body.bankBik || null,
    bankCorrAccount: body.bankCorrAccount || null,
    vatRate: body.vatRate ? Number(body.vatRate) : null,
  });

  return NextResponse.json(seller);
}
