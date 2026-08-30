const TIER = 10_000;
const STEP = 0.05;
const MAX_DISCOUNT = 0.5;

export function discountForSubtotal(grossSubtotal: number): number {
  return Math.min(Math.floor(grossSubtotal / TIER) * STEP, MAX_DISCOUNT);
}

export function maxPrice(minPrice: number): number {
  return minPrice * 2;
}

export function unitPrice(minPrice: number, discount: number): number {
  return maxPrice(minPrice) * (1 - discount);
}

export function amountToNextDiscount(grossSubtotal: number): number {
  const currentDiscount = discountForSubtotal(grossSubtotal);
  if (currentDiscount >= MAX_DISCOUNT) return 0;
  const nextTierFloor = (Math.floor(grossSubtotal / TIER) + 1) * TIER;
  return nextTierFloor - grossSubtotal;
}
