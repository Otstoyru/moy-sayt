import { createDoc, renderToBuffer, money, drawTable } from "@/lib/pdf";
import { markupForBaseSum, unitPrice } from "@/lib/pricing";
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
      `Дата формирования: ${new Date().toLocaleDateString("ru-RU")}. Цена за единицу товара ` +
        "зависит от суммы всего заказа (по базовым ценам) — наценка плавно снижается с 50% до 0% " +
        "по мере роста суммы. Ниже — цена на трёх характерных уровнях суммы заказа; точная цена " +
        "для смешанной корзины рассчитывается на сайте.",
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
        { header: "Артикул", width: 60 },
        { header: "Наименование", width: multiSeller ? 140 : 175 },
        { header: "Уп.,шт.", width: 35, align: "right" as const },
        { header: "До 50 000 ₽", width: 65, align: "right" as const },
        { header: "50–100 тыс. ₽", width: 70, align: "right" as const },
        { header: "От 100 000 ₽", width: 65, align: "right" as const },
        ...(multiSeller ? [{ header: "Продавец", width: 65 }] : []),
      ];
      const rows = items.map((p) => {
        const priceAt0 = unitPrice(p.minPrice, markupForBaseSum(0));
        const priceAt50k = unitPrice(p.minPrice, markupForBaseSum(50_000));
        const priceAt100k = p.minPrice;
        return [
          p.article,
          p.name,
          String(p.packageSize),
          money(priceAt0),
          money(priceAt50k),
          money(priceAt100k),
          ...(multiSeller ? [p.sellerId ? (sellerById.get(p.sellerId)?.shortName ?? "") : ""] : []),
        ];
      });
      const afterY = drawTable(doc, doc.page.margins.left, doc.y, columns, rows);
      doc.x = doc.page.margins.left;
      doc.y = afterY + 10;
    }
  }

  return renderToBuffer(doc);
}
