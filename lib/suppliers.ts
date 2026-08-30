import { sql } from "@/lib/db";
import { createTransaction } from "@/lib/finance";

export type Supplier = {
  id: number;
  sellerId: number;
  name: string;
  isActive: boolean;
  owed: number;
  paid: number;
  remaining: number;
  createdAt: string;
};

function mapSupplier(r: Record<string, unknown>): Supplier {
  const owed = Number(r.owed ?? 0);
  const paid = Number(r.paid ?? 0);
  return {
    id: Number(r.id),
    sellerId: Number(r.seller_id),
    name: r.name as string,
    isActive: Boolean(r.is_active),
    owed,
    paid,
    remaining: owed - paid,
    createdAt: r.created_at as string,
  };
}

export async function getSuppliers(): Promise<Supplier[]> {
  const rows = await sql`
    SELECT s.*,
      COALESCE((SELECT SUM(amount) FROM supplier_receipts WHERE supplier_id = s.id), 0) AS owed,
      COALESCE((SELECT SUM(ABS(amount)) FROM financial_transactions WHERE supplier_id = s.id AND category = 'supplier_payment'), 0) AS paid
    FROM suppliers s
    ORDER BY s.seller_id, s.name
  `;
  return rows.map(mapSupplier);
}

export async function getSupplierById(id: number): Promise<Supplier | null> {
  const rows = await sql`
    SELECT s.*,
      COALESCE((SELECT SUM(amount) FROM supplier_receipts WHERE supplier_id = s.id), 0) AS owed,
      COALESCE((SELECT SUM(ABS(amount)) FROM financial_transactions WHERE supplier_id = s.id AND category = 'supplier_payment'), 0) AS paid
    FROM suppliers s
    WHERE s.id = ${id}
  `;
  return rows[0] ? mapSupplier(rows[0]) : null;
}

export async function createSupplier(sellerId: number, name: string): Promise<Supplier> {
  const rows = await sql`INSERT INTO suppliers (seller_id, name) VALUES (${sellerId}, ${name}) RETURNING *`;
  return mapSupplier({ ...rows[0], owed: 0, paid: 0 });
}

export type ReceiptItem = {
  article: string;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type SupplierReceipt = {
  id: number;
  supplierId: number;
  items: ReceiptItem[];
  amount: number;
  documentNumber: string | null;
  documentDate: string | null;
  description: string | null;
  createdAt: string;
};

function mapReceipt(r: Record<string, unknown>): SupplierReceipt {
  return {
    id: Number(r.id),
    supplierId: Number(r.supplier_id),
    items: (r.items as ReceiptItem[]) ?? [],
    amount: Number(r.amount),
    documentNumber: (r.document_number as string) ?? null,
    documentDate: (r.document_date as string) ?? null,
    description: (r.description as string) ?? null,
    createdAt: r.created_at as string,
  };
}

export async function getReceiptsForSupplier(supplierId: number): Promise<SupplierReceipt[]> {
  const rows = await sql`
    SELECT * FROM supplier_receipts WHERE supplier_id = ${supplierId} ORDER BY created_at DESC
  `;
  return rows.map(mapReceipt);
}

export type NewReceiptLine = { article: string; quantity: number; unitPrice: number };
export type NewReceipt = {
  supplierId: number;
  items: NewReceiptLine[];
  documentNumber: string | null;
  documentDate: string | null;
  description: string | null;
  createdBy: number;
};

export type RecordReceiptResult = { ok: true; receipt: SupplierReceipt } | { ok: false; error: string };

/**
 * Оприходует накладную от поставщика: любая строка — обычный товар
 * каталога (в т.ч. комплектующее вроде ручек — оно тоже products,
 * возможно, продаваемое отдельно), поэтому артикул обязан уже
 * существовать. Задолженность = сумма строк, деньги при этом никуда не
 * двигаются — оплата отдельным действием (см. recordSupplierPayment).
 */
export async function recordSupplierReceipt(input: NewReceipt): Promise<RecordReceiptResult> {
  if (input.items.length === 0) {
    return { ok: false, error: "Добавьте хотя бы одну позицию" };
  }

  const items: ReceiptItem[] = [];
  for (const line of input.items) {
    const rows = await sql`SELECT article, name FROM products WHERE article = ${line.article}`;
    if (!rows.length) {
      return {
        ok: false,
        error: `Артикул «${line.article}» не найден в каталоге — сначала добавьте его как товар в «Остатки»`,
      };
    }
    items.push({
      article: line.article,
      name: (rows[0].name as string) ?? line.article,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      lineTotal: line.quantity * line.unitPrice,
    });
  }
  const amount = items.reduce((sum, i) => sum + i.lineTotal, 0);

  const rows = await sql`
    INSERT INTO supplier_receipts (supplier_id, items, amount, document_number, document_date, description, created_by)
    VALUES (${input.supplierId}, ${JSON.stringify(items)}, ${amount}, ${input.documentNumber}, ${input.documentDate}, ${input.description}, ${input.createdBy})
    RETURNING *
  `;

  for (const item of items) {
    await sql`UPDATE products SET stock = stock + ${item.quantity} WHERE article = ${item.article}`;
  }

  return { ok: true, receipt: mapReceipt(rows[0]) };
}

/**
 * Оплата долга поставщику — обычная расходная проводка на счёт (см.
 * lib/finance.ts), не привязана к конкретной накладной, просто уменьшает
 * общий остаток задолженности перед этим поставщиком.
 */
export async function recordSupplierPayment(
  supplierId: number,
  accountId: number,
  amount: number,
  occurredAt: string | undefined,
  createdBy: number,
  description: string | null
): Promise<void> {
  await createTransaction({
    accountId,
    amount: -amount,
    category: "supplier_payment",
    description: description ?? "Оплата поставщику",
    supplierId,
    createdBy,
    occurredAt,
  });
}
