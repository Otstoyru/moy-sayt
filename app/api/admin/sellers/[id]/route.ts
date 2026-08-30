import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { updateSeller } from "@/lib/sellers";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireRole(["administrator"]);
  if (!admin) return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Некорректные данные" }, { status: 400 });

  const seller = await updateSeller(Number(id), {
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
  });

  if (!seller) return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  return NextResponse.json(seller);
}
