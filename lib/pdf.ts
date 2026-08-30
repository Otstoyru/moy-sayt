import PDFDocument from "pdfkit";
import path from "node:path";

const FONT_REGULAR = path.join(process.cwd(), "lib/fonts/PTSerif-Regular.ttf");
const FONT_BOLD = path.join(process.cwd(), "lib/fonts/PTSerif-Bold.ttf");

export function createDoc(): PDFKit.PDFDocument {
  const doc = new PDFDocument({ margin: 50, size: "A4", bufferPages: true });
  doc.registerFont("Regular", FONT_REGULAR);
  doc.registerFont("Bold", FONT_BOLD);
  doc.font("Regular").fontSize(10);
  return doc;
}

export function renderToBuffer(doc: PDFKit.PDFDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.end();
  });
}

export function money(n: number): string {
  return n.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " ₽";
}

export type TableColumn = {
  header: string;
  width: number;
  align?: "left" | "right" | "center";
};

/** Simple manual table renderer — pdfkit has no built-in tables. */
export function drawTable(
  doc: PDFKit.PDFDocument,
  x: number,
  startY: number,
  columns: TableColumn[],
  rows: string[][]
): number {
  const rowHeight = 20;
  const pageBottom = doc.page.height - doc.page.margins.bottom;
  let y = startY;

  function drawRow(cells: string[], bold: boolean) {
    if (y + rowHeight > pageBottom) {
      doc.addPage();
      y = doc.page.margins.top;
    }
    let cx = x;
    doc.font(bold ? "Bold" : "Regular").fontSize(9);
    columns.forEach((col, i) => {
      doc.text(cells[i] ?? "", cx, y, {
        width: col.width,
        align: col.align ?? "left",
      });
      cx += col.width;
    });
    y += rowHeight;
  }

  drawRow(columns.map((c) => c.header), true);
  doc
    .moveTo(x, y - 4)
    .lineTo(x + columns.reduce((s, c) => s + c.width, 0), y - 4)
    .strokeColor("#999999")
    .stroke();

  for (const row of rows) drawRow(row, false);

  return y;
}
