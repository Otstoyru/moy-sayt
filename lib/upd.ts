import { createDoc, renderToBuffer, money } from "@/lib/pdf";
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
  1: "одном", 2: "двух", 3: "трёх", 4: "четырёх", 5: "пяти",
  6: "шести", 7: "семи", 8: "восьми", 9: "девяти", 10: "десяти",
};

/** «на двух листах» — стандартная для УПД словесная форма, а не цифра. */
function pageCountPhrase(count: number): string {
  const word = PAGE_COUNT_WORDS[count] ?? String(count);
  return `${word} ${count === 1 ? "листе" : "листах"}`;
}

type FormCell = { label: string; value: string; code: string; width: number } | null;

/**
 * Рендерит УПД статус 1 (совмещённый со счёт-фактурой) для одного продавца
 * по подмножеству позиций заказа, относящихся к нему. Вёрстка нарочно
 * повторяет реальный бланк (рамки, разбивка на графы, коды граф А, 1, 1а...
 * как в письме ФНС России от 21.10.2013 № ММВ-20-3/96@ на основе бланка
 * счёта-фактуры по Постановлению Правительства РФ от 26.12.2011 № 1137),
 * а не просто список тех же полей текстом — сверено с реальным УПД,
 * который выпускает бухгалтер продавца. Упрощения, сделанные сознательно:
 *  - «Код товара», «Код вида товара», «Страна происхождения», «Рег. №
 *    декларации» — прочерк: товар производится в РФ, не подлежит
 *    прослеживаемости и вывозу;
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

  const colWidth = fullWidth / 2 - 1;

  /** Одна строка формы-таблицы: label сверху мелко, value ниже — с рамкой по бокам/снизу. */
  function formRow(cells: FormCell[], y: number): number {
    // Высота меряется ТЕМ ЖЕ шрифтом/размером, каким value рисуется ниже
    // (8.5pt Regular) — иначе оценка занижена и длинное двухстрочное
    // значение наезжает на следующую строку формы.
    doc.font("Regular").fontSize(8.5);
    const heights = cells.map((cell) => {
      if (!cell) return 0;
      return doc.heightOfString(cell.value, { width: cell.width - 8 });
    });
    const rowHeight = Math.max(24, ...heights.map((h) => h + 18));

    let cx = left;
    cells.forEach((cell) => {
      if (cell) {
        doc.font("Bold").fontSize(6.5).fillColor("#444444");
        doc.text(`${cell.label} (${cell.code})`, cx + 4, y + 3, { width: cell.width - 8 });
        doc.font("Regular").fontSize(8.5).fillColor("black");
        doc.text(cell.value, cx + 4, y + 12, { width: cell.width - 8 });
      }
      cx += cell ? cell.width : 0;
    });

    return y + rowHeight;
  }

  // --- Рамка блока реквизитов: заголовок + статус + продавец/покупатель ---
  const formTop = doc.page.margins.top;
  let y = formTop;

  // Заголовок: статус-бокс слева, название документа и номер справа.
  const headerHeight = 46;
  doc.rect(left, y, fullWidth, headerHeight).strokeColor("#333333").lineWidth(0.75).stroke();
  doc.moveTo(left + 95, y).lineTo(left + 95, y + headerHeight).stroke();
  doc
    .font("Bold")
    .fontSize(8)
    .fillColor("black")
    .text("Статус: 1", left + 5, y + 4, { width: 85 })
    .font("Regular")
    .fontSize(6.5)
    .text("счёт-фактура и передаточный документ (акт)", left + 5, y + 15, { width: 85 });

  doc.font("Bold").fontSize(13).text("Универсальный передаточный документ", left + 105, y + 6, {
    width: fullWidth - 110,
  });
  doc.font("Regular").fontSize(9);
  doc.text(
    `Счёт-фактура № ${updNumber} от ${fmtDate(order.createdAt)}   ·   Исправление: № — от —`,
    left + 105,
    y + 26,
    { width: fullWidth - 110 }
  );
  doc.fontSize(6.5).fillColor("#666666").text(
    "Приложение № 1 к постановлению Правительства РФ от 26.12.2011 № 1137",
    left + 105,
    y + 37,
    { width: fullWidth - 110 }
  );
  doc.fillColor("black");
  y += headerHeight;

  // Продавец / Покупатель, построчно, с общей рамкой и разбивкой по графам.
  y = formRow(
    [
      { label: "Продавец", code: "2", value: `${seller.fullName} (${sellerLegalFormLabel(seller.legalForm)})`, width: colWidth },
      { label: "Покупатель", code: "6", value: `${buyer.legalName} (${orgFormLabel(buyer.orgForm)})`, width: colWidth },
    ],
    y
  );
  y = formRow(
    [
      { label: "Адрес", code: "2а", value: seller.legalAddress, width: colWidth },
      { label: "Адрес", code: "6а", value: buyer.legalAddress, width: colWidth },
    ],
    y
  );
  y = formRow(
    [
      {
        label: "ИНН/КПП продавца",
        code: "2б",
        value: `${seller.inn}${seller.kpp ? ` / ${seller.kpp}` : ""}${seller.ogrn ? `, ОГРН ${seller.ogrn}` : ""}`,
        width: colWidth,
      },
      { label: "ИНН/КПП покупателя", code: "6б", value: `${buyer.inn}${buyer.kpp ? ` / ${buyer.kpp}` : ""}`, width: colWidth },
    ],
    y
  );
  y = formRow(
    [
      { label: "Грузоотправитель и его адрес", code: "3", value: "он же", width: colWidth },
      { label: "Грузополучатель и его адрес", code: "4", value: "он же", width: colWidth },
    ],
    y
  );
  y = formRow(
    [
      { label: "К платёжно-расчётному документу", code: "5", value: "—", width: colWidth },
      { label: "Валюта: наименование, код", code: "7", value: "Российский рубль, 643", width: colWidth },
    ],
    y
  );
  y = formRow(
    [
      {
        label: "Документ об отгрузке",
        code: "5а",
        value: `Универсальный передаточный документ № ${updNumber} от ${fmtDate(order.createdAt)}`,
        width: fullWidth,
      },
      null,
    ],
    y
  );

  // Внешняя рамка и разделительная вертикаль по всему блоку реквизитов.
  doc.rect(left, formTop, fullWidth, y - formTop).strokeColor("#333333").lineWidth(0.75).stroke();
  doc.moveTo(left + colWidth + 1, formTop + headerHeight).lineTo(left + colWidth + 1, y).stroke();

  doc.x = left;
  doc.y = y + 8;

  // --- Таблица позиций: графы и коды граф как в официальном бланке ---
  const columns = [
    { code: "А", header: "Код товара", width: 24, align: "center" as const },
    { code: "1", header: "№ п/п", width: 16, align: "center" as const },
    { code: "1а", header: "Наименование товара", width: 186, align: "left" as const },
    { code: "1б", header: "Код вида товара", width: 30, align: "center" as const },
    { code: "2", header: "Ед. изм., код", width: 24, align: "center" as const },
    { code: "2а", header: "Ед. изм., усл. обозн.", width: 28, align: "center" as const },
    { code: "3", header: "Кол-во", width: 32, align: "right" as const },
    { code: "4", header: "Цена за ед.", width: 42, align: "right" as const },
    { code: "5", header: "Стоимость без налога", width: 56, align: "right" as const },
    { code: "6", header: "В т.ч. акциз", width: 46, align: "center" as const },
    { code: "7", header: "Ставка налога", width: 34, align: "right" as const },
    { code: "8", header: "Сумма налога", width: 48, align: "right" as const },
    { code: "9", header: "Стоимость с налогом", width: 52, align: "right" as const },
    { code: "10", header: "Страна, код", width: 26, align: "center" as const },
    { code: "10а", header: "Страна, назв.", width: 30, align: "center" as const },
    { code: "11", header: "Рег. № декларации", width: 40, align: "center" as const },
  ];
  const tableWidth = columns.reduce((s, c) => s + c.width, 0);
  const tableX = left;

  function drawGridRow(cells: string[], y0: number, rowHeight: number, bold: boolean, fontSize: number) {
    let cx = tableX;
    doc.font(bold ? "Bold" : "Regular").fontSize(fontSize);
    columns.forEach((col, i) => {
      doc.text(cells[i] ?? "", cx + 2, y0 + 2, { width: col.width - 4, align: col.align });
      cx += col.width;
    });
  }

  function drawGridLines(y0: number, y1: number) {
    let cx = tableX;
    doc.strokeColor("#999999").lineWidth(0.5);
    doc.moveTo(cx, y0).lineTo(cx, y1).stroke();
    for (const col of columns) {
      cx += col.width;
      doc.moveTo(cx, y0).lineTo(cx, y1).stroke();
    }
    doc.moveTo(tableX, y1).lineTo(tableX + tableWidth, y1).stroke();
    doc.strokeColor("black");
  }

  // Заголовок таблицы: строка названий граф + строка кодов граф.
  let ty = doc.y;
  const headerTextRowH = 30;
  const headerCodeRowH = 11;
  doc.moveTo(tableX, ty).lineTo(tableX + tableWidth, ty).strokeColor("#999999").lineWidth(0.5).stroke();
  let cx = tableX;
  doc.font("Bold").fontSize(6.5);
  columns.forEach((col) => {
    doc.text(col.header, cx + 2, ty + 2, { width: col.width - 4, align: "center" });
    cx += col.width;
  });
  cx = tableX;
  doc.font("Regular").fontSize(7);
  columns.forEach((col) => {
    doc.text(col.code, cx + 2, ty + headerTextRowH, { width: col.width - 4, align: "center" });
    cx += col.width;
  });
  drawGridLines(ty, ty + headerTextRowH + headerCodeRowH);
  ty += headerTextRowH + headerCodeRowH;

  const pageBottom = doc.page.height - doc.page.margins.bottom;
  for (const [i, item] of items.entries()) {
    const lineWithoutVat = seller.vatRate ? item.lineTotal / (1 + seller.vatRate / 100) : item.lineTotal;
    const lineVat = item.lineTotal - lineWithoutVat;
    const cells = [
      "-",
      String(i + 1),
      `${item.name} (арт. ${item.article})`,
      "-",
      "796",
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
      "-",
    ];
    doc.font("Regular").fontSize(7.5);
    const rowHeight = Math.max(16, ...columns.map((col, ci) => doc.heightOfString(cells[ci] ?? "", { width: col.width - 4 }) + 4));
    if (ty + rowHeight > pageBottom) {
      doc.addPage();
      ty = doc.page.margins.top;
    }
    drawGridRow(cells, ty, rowHeight, false, 7.5);
    drawGridLines(ty, ty + rowHeight);
    ty += rowHeight;
  }

  doc.x = left;
  doc.y = ty + 8;
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
  // Подпись и печать — разные вещи, ставятся в разных местах документа и
  // не всегда обе есть, поэтому вставляются независимо друг от друга.
  const stampX = left + 115;
  let imagesHeight = 0;
  if (seller.signatureImage) {
    try {
      doc.image(signatureImageBuffer(seller.signatureImage), left, doc.y + 3, { fit: [100, 40] });
      imagesHeight = Math.max(imagesHeight, 44);
    } catch {
      /* повреждённый скан — печатаем без изображения, останется пустая строка для подписи от руки */
    }
  }
  if (seller.stampImage) {
    try {
      doc.image(signatureImageBuffer(seller.stampImage), stampX, doc.y + 3, { fit: [55, 55] });
      imagesHeight = Math.max(imagesHeight, 59);
    } catch {
      /* повреждённый скан печати — не критично, оттиск можно поставить от руки */
    }
  }
  doc.y += imagesHeight || 34;
  doc.text("_____________________ / подпись", left, doc.y, { width: 108 });
  doc.font("Regular").fontSize(8).text("М.П.", stampX, doc.y, { width: 55 });
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
