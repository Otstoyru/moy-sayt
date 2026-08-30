const TIER = 10_000;
const MAX_STEPS = 10;
const STEP_RATIO = 1.05;

/**
 * Порог скидки определяется суммой, которую клиент РЕАЛЬНО ПЛАТИТ — но
 * сама эта сумма зависит от скидки (самоссылка). Разрешаем это аналитически:
 * "сумма по базовым (минимальным) ценам" не зависит от скидки и растёт
 * вместе с ней монотонно быстрее порога, поэтому нужный уровень скидки —
 * это наибольший шаг d, для которого суммы по базовым ценам уже достаточно.
 * Сверено с примером ценообразования (11 точек, расхождение 0).
 */
function requiredBaseSum(step: number): number {
  return (step * TIER) / STEP_RATIO ** (MAX_STEPS - step);
}

export function resolveDiscountStep(baseSum: number): number {
  let step = 0;
  for (let d = MAX_STEPS; d >= 0; d--) {
    if (baseSum >= requiredBaseSum(d)) {
      step = d;
      break;
    }
  }

  // На границе шагов возможен парадокс: сумма к оплате на текущей скидке
  // уже перевалила за следующий круглый порог, хотя сумма по базовым ценам
  // до него чуть-чуть не дотягивает. В этом случае отдаём клиенту скидку
  // следующего шага — эта сумма и оправдывает более глубокую скидку.
  while (step < MAX_STEPS) {
    const total = baseSum * STEP_RATIO ** (MAX_STEPS - step);
    const threshold = (step + 1) * TIER;
    if (total >= threshold) {
      step += 1;
    } else {
      break;
    }
  }

  return step;
}

export function discountForStep(step: number): number {
  return 1 - STEP_RATIO ** -step;
}

export function maxPrice(minPrice: number): number {
  return minPrice * STEP_RATIO ** MAX_STEPS;
}

export function unitPriceForStep(minPrice: number, step: number): number {
  return minPrice * STEP_RATIO ** (MAX_STEPS - step);
}

/** Ближайший круглый порог (10 000 / 20 000 / … / 100 000) суммы к оплате. */
export function nextThresholdAmount(step: number): number | null {
  if (step >= MAX_STEPS) return null;
  return (step + 1) * TIER;
}
