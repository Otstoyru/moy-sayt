const TIER = 10_000;
const MAX_STEPS = 10;
const STEP_RATIO = 1.05;

function bracketRatio(bracket: number): number {
  return STEP_RATIO ** (MAX_STEPS - bracket);
}

/**
 * Маржинальное ценообразование (как ступени НДФЛ): скидка каждого
 * следующего порога 10 000 ₽ применяется только к той части суммы заказа
 * (по базовым/минимальным ценам), которая попадает именно в этот диапазон,
 * а не ко всей сумме сразу. Раньше скидка была "всё или ничего" по шагам —
 * это давало математически корректный, но контр-интуитивный эффект: сумма
 * к оплате могла СКАЧКОМ УМЕНЬШИТЬСЯ при пересечении порога (это же видно
 * и в исходном примере ценообразования на границе 37→38 упаковок). Здесь
 * такого разрыва нет по построению: итог — это сумма по всем диапазонам,
 * каждый из которых вносит неотрицательный вклад, поэтому общая сумма
 * строго монотонно растёт вместе с объёмом заказа.
 */
function paidTotalForBaseSum(baseSum: number): number {
  let total = 0;
  let remaining = baseSum;
  for (let bracket = 0; bracket < MAX_STEPS && remaining > 0; bracket++) {
    const portion = Math.min(remaining, TIER);
    total += portion * bracketRatio(bracket);
    remaining -= portion;
  }
  if (remaining > 0) {
    total += remaining; // свыше 100 000 ₽ по базовым ценам — уже по минимальной цене
  }
  return total;
}

const MAX_MULTIPLIER = STEP_RATIO ** MAX_STEPS;

/** Средневзвешенный коэффициент цены (unitPrice = minPrice * multiplier) для данной суммы по базовым ценам. */
export function effectiveMultiplier(baseSum: number): number {
  if (baseSum <= 0) return MAX_MULTIPLIER;
  return paidTotalForBaseSum(baseSum) / baseSum;
}

/** Скидка в процентах — относительно МАКСИМАЛЬНОЙ (недисконтированной) цены, а не относительно минимальной. */
export function discountFromMultiplier(multiplier: number): number {
  return 1 - multiplier / MAX_MULTIPLIER;
}

export function maxPrice(minPrice: number): number {
  return minPrice * MAX_MULTIPLIER;
}

export function unitPrice(minPrice: number, multiplier: number): number {
  return minPrice * multiplier;
}

/** Сколько ещё нужно добавить (по базовым ценам, в пересчёте на текущие цены), чтобы полностью выбрать текущий диапазон и перейти к более дешёвому. */
export function amountToNextBracket(baseSum: number, multiplier: number): number {
  if (baseSum >= MAX_STEPS * TIER) return 0;
  const currentBracket = Math.floor(baseSum / TIER);
  const remainingBaseSum = (currentBracket + 1) * TIER - baseSum;
  return remainingBaseSum * multiplier;
}
