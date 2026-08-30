const TIER = 10_000;
const MAX_STEPS = 10;
const STEP_RATIO = 1.05;

/**
 * Цена за штуку снижается геометрически: за каждые полные 10 000 ₽ суммы
 * заказа (по максимальным ценам) цена делится на 1.05, пока не достигнет
 * минимальной цены (10 шагов, при сумме ≥100 000 ₽). Коэффициенты сверены
 * с примером ценообразования — расхождение 0 на всех порогах.
 */
function stepForSubtotal(grossSubtotal: number): number {
  return Math.min(MAX_STEPS, Math.floor(grossSubtotal / TIER));
}

export function discountForSubtotal(grossSubtotal: number): number {
  const step = stepForSubtotal(grossSubtotal);
  return 1 - STEP_RATIO ** -step;
}

export function maxPrice(minPrice: number): number {
  return minPrice * STEP_RATIO ** MAX_STEPS;
}

export function unitPrice(minPrice: number, discount: number): number {
  return maxPrice(minPrice) * (1 - discount);
}

export function amountToNextDiscount(grossSubtotal: number): number {
  const step = stepForSubtotal(grossSubtotal);
  if (step >= MAX_STEPS) return 0;
  const nextTierFloor = (step + 1) * TIER;
  return nextTierFloor - grossSubtotal;
}
