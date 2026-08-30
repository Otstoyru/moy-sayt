import { getProductByArticle, type Product } from "@/lib/products";
import { effectiveMultiplier, unitPrice, amountToNextBracket, discountFromMultiplier } from "@/lib/pricing";
import { getSessionReservations } from "@/lib/db";

export type CartLine = {
  article: string;
  name: string;
  image: string;
  packageSize: number;
  packages: number;
  unitPrice: number;
  lineTotal: number;
};

export type CartSummary = {
  items: CartLine[];
  discountPercent: number;
  total: number;
  amountToNextDiscount: number;
};

export async function getCart(sessionId: string): Promise<CartSummary> {
  const reservations = await getSessionReservations(sessionId);

  const lines = reservations
    .map((r) => {
      const product = getProductByArticle(r.article);
      if (!product) return null;
      return { product, quantityUnits: r.quantity };
    })
    .filter((l): l is { product: Product; quantityUnits: number } => l !== null);

  // Сумма по базовым (минимальным) ценам определяет, в какие диапазоны
  // 10 000 ₽ попадает заказ — маржинально, поэтому итог всегда монотонен.
  const baseSum = lines.reduce((sum, l) => sum + l.quantityUnits * l.product.minPrice, 0);
  const multiplier = effectiveMultiplier(baseSum);
  const discountPercent = discountFromMultiplier(multiplier);

  const items: CartLine[] = lines.map((l) => {
    const price = unitPrice(l.product.minPrice, multiplier);
    return {
      article: l.product.article,
      name: l.product.name,
      image: l.product.images[0],
      packageSize: l.product.packageSize,
      packages: Math.round(l.quantityUnits / l.product.packageSize),
      unitPrice: price,
      lineTotal: l.quantityUnits * price,
    };
  });

  const total = items.reduce((sum, i) => sum + i.lineTotal, 0);
  const amountToNextDiscount = amountToNextBracket(baseSum, multiplier);

  return { items, discountPercent, total, amountToNextDiscount };
}
