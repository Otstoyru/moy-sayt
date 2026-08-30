import { createDoc, renderToBuffer, money, drawTable } from "@/lib/pdf";
import { sellerLegalFormLabel, type Seller } from "@/lib/sellers";
import { orgFormLabel } from "@/lib/orgForms";
import type { User } from "@/lib/auth";
import type { OrderRow, OrderItemRow } from "@/lib/db";

const DATE_FMT: Intl.DateTimeFormatOptions = { day: "2-digit", month: "2-digit", year: "numeric" };

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString("ru-RU", DATE_FMT);
}

function signatureImageBuffer(dataUrl: string): Buffer {
  const base64 = dataUrl.includes(",") ? dataUrl.slice(dataUrl.indexOf(",") + 1) : dataUrl;
  return Buffer.from(base64, "base64");
}

/** Строка подписанта продавца — зависит от формы юрлица, как в официальном бланке. */
function sellerSignatoryLines(seller: Seller): string[] {
  const name = seller.signatoryName ?? "___________________________";
  if (seller.legalForm === "ooo") {
    return [`Руководитель организации: ${seller.signatoryPosition ?? "Директор"} ${name}`, `Главный бухгалтер: ${name}`];
  }
  if (seller.legalForm === "ip") {
    return [`Индивидуальный предприниматель: ${name}`, seller.ogrn ? `ОГРНИП ${seller.ogrn}` : ""].filter(Boolean);
  }
  return [`Самозанятый: ${name}`];
}

const PAGE_COUNT_WORDS: Record<number, string> = {
  1: "одном",
  2: "двух",
  3: "трёх",
  4: "четырёх",
  5: "пяти",
  6: "шести",
  7: "семи",
  8: "восьми",
  9: "девяти",
  10: "десяти",
};

/** «на двух листах» — стандартная для УПД словесная форма, а не цифра. */
function pageCountPhrase(count: number): string {
  const word = PAGE_COUNT_WORDS[count] ?? String(count);
  return `${word} ${count === 1 ? "листе" : "листах"}`;
}

/**
 * Рендерит УПД статус 1 (совмещённый со счёт-фактурой) для одного продавца
 * по подмножеству позиций заказа, относящихся к нему. Состав и порядок
 * граф следуют рекомендуемой форме УПД (письмо ФНС России от 21.10.2013
 * № ММВ-20-3/96@ на основе бланка счёта-фактуры по Постановлению
 * Правительства РФ от 26.12.2011 № 1137). Упрощения, сделанные сознательно
 * для малого бизнеса без склад-логистики между разными юрлицами:
 *  - «Код вида товара», «Страна происхождения», «Рег. № декларации» —
 *    прочерк: товар производится в РФ, не подлежит прослеживаемости;
 *  - Грузоотправитель/грузополучатель всегда совпадают с продавцом/
 *    покупателем («он же») — товар не транзитом через третьих лиц;
 *  - «Данные о транспортировке» — фиксировано «самовывоз со склада
 *    продавца», текущая единственная схема доставки сайта;
 *  - Сторона покупателя в блоке приёмки-передачи оставлена пустой для
 *    заполнения от руки при получении — на сайте нет данных о том, кто
 *    именно у покупателя примет груз.
 *
 * Это документ строгой отчётности: `updNumber` должен быть уже закреплён
 * за парой (заказ, продавец) заранее, в момент отметки заказа проданным —
 * см. `markOrderSold`/`getOrAssignUpdNumber` в lib/db.ts, не при скачивании.
 */
export function renderUpdPdf(
  order: OrderRow,
  seller: Seller,
  buyer: User,
  items: OrderItemRow[],
  updNumber: number,
  invoiceNumber: number | null
): Promise<Buffer> {
  const doc = createDoc({ layout: "landscape" });
  const fullWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const left = doc.page.margins.left;
  const totalWithVat = items.reduce((sum, i) => sum + i.lineTotal, 0);
  const totalWithoutVat = seller.vatRate ? totalWithVat / (1 + seller.vatRate / 100) : totalWithVat;
  const totalVat = totalWithVat - totalWithoutVat;

  function field(label: string, value: string, x: number, y: number, width: number): number {
    doc.font("Bold").fontSize(8).text(label, x, y, { width, continued: false });
    doc.font("Regular").fontSize(9).text(value, x, doc.y, { width });
    return doc.y;
  }

  // --- Заголовок ---
  doc.rect(left, doc.page.margins.top, 95, 38).strokeColor("#333333").stroke();
  doc
    .font("Bold")
    .fontSize(8)
    .text("Статус: 1", left + 5, doc.page.margins.top + 3, { width: 85 })
    .fontSize(6.5)
    .font("Regular")
    .text("счёт-фактура и передаточный документ (акт)", left + 5, doc.page.margins.top + 13, { width: 85 });

  doc.font("Bold").fontSize(13).text("Универсальный передаточный документ", left + 110, doc.page.margins.top, {
    width: fullWidth - 110,
  });
  doc.font("Regular").fontSize(9);
  doc.text(
    `Счёт-фактура № ${updNumber} от ${fmtDate(order.createdAt)}   ·   Исправление: № — от —`,
    left + 110,
    doc.y + 3,
    { width: fullWidth - 110 }
  );
  doc.x = left;
  doc.y = Math.max(doc.y, doc.page.margins.top + 38) + 10;

  // --- Продавец / Покупатель ---
  const colWidth = fullWidth / 2 - 12;
  const rightX = left + colWidth + 24;
  let y1 = doc.y;
  let y2 = doc.y;

  y1 = field("Продавец:", `${seller.fullName} (${sellerLegalFormLabel(seller.legalForm)})`, left, y1, colWidth);
  y1 = field("Адрес:", seller.legalAddress, left, y1, colWidth);
  y1 = field(
    "ИНН/КПП продавца:",
    `${seller.inn}${seller.kpp ? ` / ${seller.kpp}` : ""}${seller.ogrn ? `, ОГРН ${seller.ogrn}` : ""}`,
    left,
    y1,
    colWidth
  );
  y1 = field("Грузоотправитель и его адрес:", "он же", left, y1, colWidth);

  y2 = field("Покупатель:", `${buyer.legalName} (${orgFormLabel(buyer.orgForm)})`, rightX, y2, colWidth);
  y2 = field("Адрес:", buyer.legalAddress, rightX, y2, colWidth);
  y2 = field("ИНН/КПП покупателя:", `${buyer.inn}${buyer.kpp ? ` / ${buyer.kpp}` : ""}`, rightX, y2, colWidth);
  y2 = field("Грузополучатель и его адрес:", "он же", rightX, y2, colWidth);

  const row3Y = Math.max(y1, y2) + 8;
  y1 = field("К платёжно-расчётному документу:", "—", left, row3Y, colWidth);
  y2 = field("Валюта: наименование, код:", "Российский рубль, 643", rightX, row3Y, colWidth);
  doc.x = left;
  doc.y = Math.max(y1, y2) + 4;
  doc.y = field(
    "Документ об отгрузке:",
    `Универсальный передаточный документ № ${updNumber} от ${fmtDate(order.createdAt)}`,
    left,
    doc.y,
    fullWidth
  );
  doc.x = left;
  doc.y += 6;

  // --- Таблица позиций ---
  const tableX = left;
  const tableY = doc.y;
  const columns = [
    { header: "№", width: 14 },
    { header: "Наименование товара", width: 208 },
    { header: "Арт.", width: 48 },
    { header: "Код", width: 26, align: "center" as const },
    { header: "Ед.", width: 24, align: "center" as const },
    { header: "Кол-во", width: 34, align: "right" as const },
    { header: "Цена", width: 44, align: "right" as const },
    { header: "Без НДС", width: 56, align: "right" as const },
    { header: "Акциз", width: 52, align: "center" as const },
    { header: "Ставка", width: 40, align: "right" as const },
    { header: "НДС", width: 48, align: "right" as const },
    { header: "С НДС", width: 54, align: "right" as const },
    { header: "Страна", width: 34, align: "center" as const },
    { header: "Рег.№", width: 36, align: "center" as const },
  ];
  const rows = items.map((item, i) => {
    const lineWithoutVat = seller.vatRate ? item.lineTotal / (1 + seller.vatRate / 100) : item.lineTotal;
    const lineVat = item.lineTotal - lineWithoutVat;
    return [
      String(i + 1),
      item.name,
      item.article,
      "-",
      "уп.",
      String(item.packages),
      money(item.unitPrice),
      money(lineWithoutVat),
      "Без акциза",
      seller.vatRate ? `${seller.vatRate}%` : "Без НДС",
      money(lineVat),
      money(item.lineTotal),
      "-",
      "-",
    ];
  });
  const afterTableY = drawTable(doc, tableX, tableY, columns, rows);

  doc.x = left;
  doc.y = afterTableY + 8;
  doc.font("Bold").fontSize(9);
  doc.text(`Итого: без НДС ${money(totalWithoutVat)}, НДС ${money(totalVat)}, с НДС ${money(totalWithVat)}`, left, doc.y, {
    width: fullWidth,
    align: "right",
  });
  doc.text(`Всего к оплате: ${money(totalWithVat)}`, left, doc.y, { width: fullWidth, align: "right" });
  doc.x = left;
  doc.font("Regular").fontSize(8).fillColor("#666666");
  doc.text(
    seller.vatRate ? `в т.ч. НДС ${seller.vatRate}%: ${money(totalVat)}` : "НДС не облагается (УСН)",
    left,
    doc.y,
    { width: fullWidth, align: "right" }
  );
  doc.fillColor("black");
  doc.x = left;
  doc.moveDown(0.6);

  doc.font("Regular").fontSize(8);
  // Реальное число листов документа известно только после того, как он
  // полностью отрисован (позиции могут перенести часть текста на
  // следующую страницу) — место резервируется здесь, а сама надпись
  // дописывается в конце через doc.switchToPage(), см. низ функции.
  const pageCountLineY = doc.y;
  const pageCountLinePageIndex = doc.bufferedPageRange().count - 1;
  doc.moveDown(1);
  doc.x = left;
  const basisText = invoiceNumber
    ? `Основание передачи (сдачи) / получения (приёмки): счёт на оплату № ${invoiceNumber} от ${fmtDate(order.createdAt)}`
    : "Основание передачи (сдачи) / получения (приёмки): —";
  doc.text(basisText, left, doc.y + 1, { width: fullWidth });
  doc.x = left;
  doc.text("Данные о транспортировке и грузе: самовывоз со склада продавца", left, doc.y + 1, { width: fullWidth });
  doc.x = left;
  doc.moveDown(0.6);

  // --- Подписи ---
  // Блок подписей раскладывается вручную по двум колонкам с абсолютными
  // координатами — если он не поместится на текущей странице, pdfkit сам
  // перенесёт часть текста на новую страницу ПОСРЕДИ блока, и колонки
  // "продавец"/"покупатель" разъедутся по разным страницам. Поэтому здесь
  // явная проверка остатка места и принудительный перенос ВСЕГО блока
  // целиком, а не по частям.
  const SIGNATURE_BLOCK_HEIGHT_ESTIMATE = 160;
  if (doc.y + SIGNATURE_BLOCK_HEIGHT_ESTIMATE > doc.page.height - doc.page.margins.bottom) {
    doc.addPage();
    doc.x = left;
    doc.y = doc.page.margins.top;
  }

  const sigColWidth = fullWidth / 2 - 15;
  const rightSigX = left + sigColWidth + 30;
  const sigTopY = doc.y;

  doc.font("Regular").fontSize(8);
  const sellerLines = sellerSignatoryLines(seller);
  sellerLines.forEach((line) => {
    doc.text(line, left, doc.y, { width: sigColWidth });
    doc.x = left;
  });
  if (seller.signatureImage) {
    try {
      doc.image(signatureImageBuffer(seller.signatureImage), left, doc.y + 3, { fit: [110, 42] });
      doc.y += 46;
    } catch {
      doc.moveDown(1.4);
    }
  } else {
    doc.moveDown(1.4);
  }
  doc.text("_____________________ / подпись / М.П.", left, doc.y, { width: sigColWidth });
  doc.x = left;
  doc.moveDown(0.3);
  doc.font("Bold").fontSize(8).text("Товар (груз) передал / услуги, результаты работ сдал:", left, doc.y, { width: sigColWidth });
  doc.font("Regular");
  doc.text(sellerLines[0]?.split(": ")[1] ?? "", left, doc.y, { width: sigColWidth });
  doc.text(`Дата отгрузки, передачи: ${fmtDate(order.createdAt)}`, left, doc.y + 1, { width: sigColWidth });
  doc.text(
    `Составитель документа: ${seller.fullName}, ИНН ${seller.inn}${seller.kpp ? `, КПП ${seller.kpp}` : ""}`,
    left,
    doc.y + 1,
    { width: sigColWidth }
  );
  const leftSigBottom = doc.y;

  doc.font("Regular").fontSize(8);
  doc.text("Товар (груз) получил / услуги, результаты работ принял:", rightSigX, sigTopY, { width: sigColWidth });
  doc.font("Bold").text(buyer.legalName, rightSigX, doc.y, { width: sigColWidth });
  doc.font("Regular");
  doc.moveDown(1.4);
  doc.text("_____________________ / Подпись, ФИО, должность", rightSigX, doc.y, { width: sigColWidth });
  doc.text("Дата получения (приёмки): _______________", rightSigX, doc.y + 8, { width: sigColWidth });
  doc.text(
    `Составитель документа со стороны покупателя: ${buyer.legalName}, ИНН ${buyer.inn}${buyer.kpp ? `, КПП ${buyer.kpp}` : ""}`,
    rightSigX,
    doc.y + 8,
    { width: sigColWidth }
  );
  const rightSigBottom = doc.y;

  doc.x = left;
  doc.y = Math.max(leftSigBottom, rightSigBottom) + 10;
  doc.fontSize(6.5).fillColor("#666666").text(
    "Документ составлен по рекомендуемой форме УПД (письмо ФНС России от 21.10.2013 № ММВ-20-3/96@ на основе бланка " +
      "счёта-фактуры по Постановлению Правительства РФ от 26.12.2011 № 1137), статус 1 — совмещает функции счёта-фактуры " +
      "и передаточного документа (накладной, акта).",
    left,
    doc.y,
    { width: fullWidth, align: "left" }
  );

  const totalPages = doc.bufferedPageRange().count;
  doc.switchToPage(pageCountLinePageIndex);
  doc.font("Regular").fontSize(8).fillColor("black");
  doc.text(`Документ составлен на ${pageCountPhrase(totalPages)}.`, left, pageCountLineY, { width: fullWidth });

  return renderToBuffer(doc);
}
