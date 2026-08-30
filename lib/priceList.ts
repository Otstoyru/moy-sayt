import { createDoc, renderToBuffer, money, drawTable } from "@/lib/pdf";
import type { Product } from "@/lib/products";
import type { Group, Category } from "@/lib/categories";
import type { Seller } from "@/lib/sellers";

export function renderPriceListPdf(
  products: Product[],
  categories: Category[],
  groups: Group[],
  sellers: Seller[]
): Promise<Buffer> {
  const doc = createDoc();
  doc.font("Bold").fontSize(16).text("Прайс-лист", { align: "left" });
  doc
    .font("Regular")
    .fontSize(9)
    .fillColor("#666666")
    .text(
      `Дата формирования: ${new Date().toLocaleDateString("ru-RU")}. Указана минимальная цена за ` +
        "штуку — действует при заказе от 100 000 ₽ (по базовым ценам). При меньшем объёме заказа " +
        "действует наценка, которая плавно снижается до нуля по мере роста суммы заказа — точная " +
        "цена рассчитывается в корзине на сайте.",
      { align: "left" }
    );
  doc.fillColor("black");
  doc.moveDown(1);

  const sellerById = new Map(sellers.map((s) => [s.id, s]));
  const multiSeller = new Set(products.map((p) => p.sellerId)).size > 1;

  for (const g of groups) {
    const catsInGroup = categories.filter((c) => c.groupSlug === g.slug);
    if (!catsInGroup.some((c) => products.some((p) => p.categorySlug === c.slug))) continue;

    doc.font("Bold").fontSize(13).text(g.name);
    doc.moveDown(0.3);

    for (const c of catsInGroup) {
      const items = products.filter((p) => p.categorySlug === c.slug);
      if (!items.length) continue;

      if (doc.y + 60 > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
      }

      doc.font("Bold").fontSize(11).text(c.name);
      doc.moveDown(0.2);

      const columns = [
        { header: "Артикул", width: 70 },
        { header: "Наименование", width: multiSeller ? 220 : 260 },
        { header: "Уп., шт.", width: 55, align: "right" as const },
        { header: "Цена/шт.", width: 65, align: "right" as const },
        ...(multiSeller ? [{ header: "Продавец", width: 80 }] : []),
      ];
      const rows = items.map((p) => [
        p.article,
        p.name,
        String(p.packageSize),
        money(p.minPrice),
        ...(multiSeller ? [p.sellerId ? (sellerById.get(p.sellerId)?.shortName ?? "") : ""] : []),
      ]);
      const afterY = drawTable(doc, doc.page.margins.left, doc.y, columns, rows);
      doc.y = afterY + 10;
    }
  }

  return renderToBuffer(doc);
}
