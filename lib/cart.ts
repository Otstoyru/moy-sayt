import { getProductByArticle, type Product } from "@/lib/products";
import { markupForBaseSum, unitPrice, discountFromMarkup, amountToZeroMarkup } from "@/lib/pricing";
import { getUserReservations } from "@/lib/db";

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

export async function getCart(userId: number): Promise<CartSummary> {
  const reservations = await getUserReservations(userId);

  const resolved = await Promise.all(
    reservations.map(async (r) => {
      const product = await getProductByArticle(r.article);
      if (!product) return null;
      return { product, quantityUnits: r.quantity };
    })
  );
  const lines = resolved.filter((l): l is { product: Product; quantityUnits: number } => l !== null);

  // Сумма по базовым (минимальным) ценам — двигатель плавной кривой наценки,
  // не зависит от самой наценки (никакой самоссылки).
  const baseSum = lines.reduce((sum, l) => sum + l.quantityUnits * l.product.minPrice, 0);
  const markup = markupForBaseSum(baseSum);
  const discountPercent = discountFromMarkup(markup);

  const items: CartLine[] = lines.map((l) => {
    const price = unitPrice(l.product.minPrice, markup);
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
  const amountToNextDiscount = amountToZeroMarkup(total);

  return { items, discountPercent, total, amountToNextDiscount };
}
