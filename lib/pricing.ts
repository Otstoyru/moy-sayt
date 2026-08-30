const MIN_MARKUP = 0.5; // наценка над базовой (минимальной) ценой при минимальной закупке
const ZERO_MARKUP_THRESHOLD = 100_000; // сумма закупки по базовым ценам, при которой наценка обнуляется

/**
 * Наценка над базовой (минимальной, из файла) ценой линейно и плавно
 * убывает от 50% (при минимальной закупке) до 0% (при закупке от
 * 100 000 ₽ и выше). Считается от суммы ПО БАЗОВЫМ ЦЕНАМ — она не
 * зависит от самой наценки, поэтому никакой самоссылки и связанных с ней
 * разрывов/скачков нет в принципе: кривая гладкая на всём диапазоне.
 */
export function markupForBaseSum(baseSum: number): number {
  const fraction = Math.max(0, 1 - baseSum / ZERO_MARKUP_THRESHOLD);
  return MIN_MARKUP * fraction;
}

export function unitPrice(minPrice: number, markup: number): number {
  return minPrice * (1 + markup);
}

export function maxPrice(minPrice: number): number {
  return minPrice * (1 + MIN_MARKUP);
}

/** "Скидка" относительно максимальной цены — для понятного отображения клиенту. */
export function discountFromMarkup(markup: number): number {
  return 1 - (1 + markup) / (1 + MIN_MARKUP);
}

/**
 * Сколько ещё не хватает до суммы к оплате, при которой наценка обнулится.
 * Точная (не приближённая) формула: при сумме по базовым ценам ровно
 * 100 000 ₽ наценка = 0, а значит и итог к оплате в этой точке ВСЕГДА
 * равен ровно 100 000 ₽, независимо от состава корзины — поэтому просто
 * вычитаем текущий итог из порога, без пересчёта через наценку.
 */
export function amountToZeroMarkup(total: number): number {
  return Math.max(0, ZERO_MARKUP_THRESHOLD - total);
}
