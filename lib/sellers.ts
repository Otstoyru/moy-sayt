import { sql } from "@/lib/db";

export const SELLER_LEGAL_FORMS = [
  { value: "ooo", label: "ООО" },
  { value: "ip", label: "ИП" },
  { value: "self_employed", label: "Самозанятый" },
] as const;

export function sellerLegalFormLabel(value: string): string {
  return SELLER_LEGAL_FORMS.find((f) => f.value === value)?.label ?? value;
}

export type Seller = {
  id: number;
  legalForm: string;
  fullName: string;
  shortName: string;
  inn: string;
  kpp: string | null;
  ogrn: string | null;
  legalAddress: string;
  phone: string | null;
  email: string | null;
  bankAccount: string | null;
  bankName: string | null;
  bankBik: string | null;
  bankCorrAccount: string | null;
  /** Ставка НДС в процентах (напр. 20); null/0 — не облагается (УСН/НПД). */
  vatRate: number | null;
  isActive: boolean;
};

function mapSeller(r: Record<string, unknown>): Seller {
  return {
    id: Number(r.id),
    legalForm: r.legal_form as string,
    fullName: r.full_name as string,
    shortName: r.short_name as string,
    inn: r.inn as string,
    kpp: (r.kpp as string) ?? null,
    ogrn: (r.ogrn as string) ?? null,
    legalAddress: r.legal_address as string,
    phone: (r.phone as string) ?? null,
    email: (r.email as string) ?? null,
    bankAccount: (r.bank_account as string) ?? null,
    bankName: (r.bank_name as string) ?? null,
    bankBik: (r.bank_bik as string) ?? null,
    bankCorrAccount: (r.bank_corr_account as string) ?? null,
    vatRate: r.vat_rate === null || r.vat_rate === undefined ? null : Number(r.vat_rate),
    isActive: Boolean(r.is_active),
  };
}

export async function getSellers(): Promise<Seller[]> {
  const rows = await sql`SELECT * FROM sellers ORDER BY id`;
  return rows.map(mapSeller);
}

export async function getSellerById(id: number): Promise<Seller | null> {
  const rows = await sql`SELECT * FROM sellers WHERE id = ${id}`;
  return rows[0] ? mapSeller(rows[0]) : null;
}

export type SellerInput = {
  legalForm: string;
  fullName: string;
  shortName: string;
  inn: string;
  kpp: string | null;
  ogrn: string | null;
  legalAddress: string;
  phone: string | null;
  email: string | null;
  bankAccount: string | null;
  bankName: string | null;
  bankBik: string | null;
  bankCorrAccount: string | null;
  vatRate: number | null;
};

export async function createSeller(input: SellerInput): Promise<Seller> {
  const rows = await sql`
    INSERT INTO sellers (
      legal_form, full_name, short_name, inn, kpp, ogrn, legal_address,
      phone, email, bank_account, bank_name, bank_bik, bank_corr_account, vat_rate
    ) VALUES (
      ${input.legalForm}, ${input.fullName}, ${input.shortName}, ${input.inn}, ${input.kpp}, ${input.ogrn},
      ${input.legalAddress}, ${input.phone}, ${input.email}, ${input.bankAccount}, ${input.bankName},
      ${input.bankBik}, ${input.bankCorrAccount}, ${input.vatRate}
    )
    RETURNING *
  `;
  return mapSeller(rows[0]);
}

export async function updateSeller(id: number, input: SellerInput): Promise<Seller | null> {
  const rows = await sql`
    UPDATE sellers SET
      legal_form = ${input.legalForm}, full_name = ${input.fullName}, short_name = ${input.shortName},
      inn = ${input.inn}, kpp = ${input.kpp}, ogrn = ${input.ogrn}, legal_address = ${input.legalAddress},
      phone = ${input.phone}, email = ${input.email}, bank_account = ${input.bankAccount},
      bank_name = ${input.bankName}, bank_bik = ${input.bankBik}, bank_corr_account = ${input.bankCorrAccount},
      vat_rate = ${input.vatRate}
    WHERE id = ${id}
    RETURNING *
  `;
  return rows[0] ? mapSeller(rows[0]) : null;
}

export async function setCategorySeller(categorySlug: string, sellerId: number): Promise<number> {
  const rows = await sql`
    UPDATE products SET seller_id = ${sellerId} WHERE category_slug = ${categorySlug} RETURNING article
  `;
  return rows.length;
}
