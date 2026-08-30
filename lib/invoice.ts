import { createDoc, renderToBuffer, money, drawTable } from "@/lib/pdf";
import { sellerLegalFormLabel, type Seller } from "@/lib/sellers";
import { orgFormLabel } from "@/lib/orgForms";
import type { User } from "@/lib/auth";
import type { OrderRow, OrderItemRow } from "@/lib/db";

const DATE_FMT: Intl.DateTimeFormatOptions = {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
};
const DATETIME_FMT: Intl.DateTimeFormatOptions = { ...DATE_FMT, hour: "2-digit", minute: "2-digit" };

function fmtDate(iso: string, withTime = false): string {
  return new Date(iso).toLocaleString("ru-RU", withTime ? DATETIME_FMT : DATE_FMT);
}

/**
 * Renders one seller's invoice for the given subset of an order's line
 * items. An order can in principle contain items from several sellers
 * (multi-entity setup) — each seller gets their own invoice document.
 */
export function renderInvoicePdf(
  order: OrderRow,
  seller: Seller,
  buyer: User,
  items: OrderItemRow[]
): Promise<Buffer> {
  const doc = createDoc();
  const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);

  doc.font("Bold").fontSize(16).text(`Счёт на оплату №${order.id}`, { align: "left" });
  doc.font("Regular").fontSize(10).text(`от ${fmtDate(order.createdAt)}`, { align: "left" });
  doc.moveDown(1);

  doc.font("Bold").fontSize(11).text("Поставщик:");
  doc.font("Regular").fontSize(10);
  doc.text(`${seller.fullName} (${sellerLegalFormLabel(seller.legalForm)})`);
  doc.text(
    `ИНН ${seller.inn}` + (seller.kpp ? `, КПП ${seller.kpp}` : "") + (seller.ogrn ? `, ОГРН ${seller.ogrn}` : "")
  );
  doc.text(seller.legalAddress);
  if (seller.bankAccount) {
    doc.text(`Р/с ${seller.bankAccount} в ${seller.bankName ?? ""}`);
    doc.text(`БИК ${seller.bankBik ?? ""}` + (seller.bankCorrAccount ? `, к/с ${seller.bankCorrAccount}` : ""));
  } else {
    doc.fillColor("#b91c1c").text("Банковские реквизиты не заполнены — обратитесь к администратору сайта.");
    doc.fillColor("black");
  }
  doc.moveDown(1);

  doc.font("Bold").fontSize(11).text("Покупатель:");
  doc.font("Regular").fontSize(10);
  doc.text(`${buyer.legalName} (${orgFormLabel(buyer.orgForm)})`);
  doc.text(`ИНН ${buyer.inn}` + (buyer.kpp ? `, КПП ${buyer.kpp}` : ""));
  doc.text(buyer.legalAddress);
  doc.text(`Телефон: ${buyer.phone}, email: ${buyer.email}`);
  doc.moveDown(1.5);

  const tableX = doc.page.margins.left;
  const tableY = doc.y;
  const columns = [
    { header: "№", width: 25 },
    { header: "Наименование", width: 220 },
    { header: "Арт.", width: 70 },
    { header: "Кол-во, уп.", width: 60, align: "right" as const },
    { header: "Цена/шт.", width: 65, align: "right" as const },
    { header: "Сумма", width: 65, align: "right" as const },
  ];
  const rows = items.map((item, i) => [
    String(i + 1),
    item.name,
    item.article,
    String(item.packages),
    money(item.unitPrice),
    money(item.lineTotal),
  ]);
  const afterTableY = drawTable(doc, tableX, tableY, columns, rows);

  doc.y = afterTableY + 15;
  doc.font("Bold").fontSize(11);
  doc.text(`Скидка за объём заказа: ${Math.round(order.discountPercent * 100)}%`, { align: "right" });
  doc.text(`Итого к оплате: ${money(subtotal)}`, { align: "right" });
  doc.moveDown(1);

  doc.font("Regular").fontSize(10);
  if (order.paymentDueAt) {
    doc.fillColor("#b91c1c").text(`Оплатить до: ${fmtDate(order.paymentDueAt, true)}`, { align: "left" });
    doc.fillColor("black");
  }
  doc.moveDown(0.5);
  doc.fontSize(8).fillColor("#666666").text(
    "Счёт сформирован автоматически и действителен до указанной даты. Оплата данного счёта " +
      "означает согласие с условиями поставки. Товар отгружается самовывозом со склада " +
      "производителя, если иное не согласовано отдельно.",
    { align: "left" }
  );

  return renderToBuffer(doc);
}
