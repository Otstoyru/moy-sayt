import ozonImages from "@/data/ozon-images.json";

export const PLACEHOLDER_IMAGE = "/placeholder-product.svg";

// Фото с Ozon для артикулов, у которых в БД остался плейсхолдер
// (снимок Ozon API /v2/product/pictures/info, ключ — offer_id).
const OZON_IMAGES = ozonImages as Record<string, string[]>;

// Латинские префиксы грузинских артикулов → кириллица, буква в букву
// (G-SL-302 → СЛ/302, G-SH-280 → Ш/280). Диграфы проверяются первыми.
const LATIN_TO_CYRILLIC: [string, string][] = [
  ["SH", "Ш"], ["CH", "Ч"],
  ["A", "А"], ["B", "Б"], ["C", "С"], ["D", "Д"], ["E", "Е"], ["F", "Ф"],
  ["G", "Г"], ["H", "Н"], ["I", "И"], ["K", "К"], ["L", "Л"], ["M", "М"],
  ["N", "Н"], ["O", "О"], ["P", "Р"], ["R", "Р"], ["S", "С"], ["T", "Т"],
  ["U", "У"], ["V", "В"], ["X", "Х"], ["Y", "У"], ["Z", "З"],
];

function toCyrillic(segment: string): string {
  let out = "";
  let i = 0;
  while (i < segment.length) {
    const pair = LATIN_TO_CYRILLIC.find(([lat]) => segment.startsWith(lat, i));
    if (pair) {
      out += pair[1];
      i += pair[0].length;
    } else {
      out += segment[i];
      i += 1;
    }
  }
  return out;
}

/** Артикулы, под которыми может лежать фото того же товара: сам артикул, основной (без G), без хвоста /1, /2. */
export function imageCandidates(article: string): string[] {
  const result = [article];
  let base = article.trim();
  if (/^G[-/]/i.test(base)) base = base.slice(2);
  const parts = base.split(/[-/]/);
  // префикс (буквы) переводим в кириллицу, числовые части не трогаем
  parts[0] = toCyrillic(parts[0].toUpperCase());
  base = parts.join("/");
  result.push(base);
  // М/170/1, С/301/1 — тот же товар, что М/170 / С/301
  const variant = base.match(/^(.+\/\d+)\/\d$/);
  if (variant) result.push(variant[1]);
  return [...new Set(result)];
}

export function isPlaceholder(images: string[] | null | undefined): boolean {
  return !images || images.length === 0 || images.every((src) => src === PLACEHOLDER_IMAGE);
}

/** Если в БД у товара нет фото — подставить фото с Ozon по артикулу или по основному артикулу. */
export function resolveImages(article: string, images: string[] | null | undefined): string[] {
  if (!isPlaceholder(images)) return images as string[];
  for (const candidate of imageCandidates(article)) {
    const found = OZON_IMAGES[candidate];
    if (found?.length) return found;
  }
  return [PLACEHOLDER_IMAGE];
}
