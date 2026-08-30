import { getProductByArticle, type Product } from "@/lib/products";
import { discountForSubtotal, maxPrice, unitPrice } from "@/lib/pricing";
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
  grossSubtotal: number;
  total: number;
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

  const grossSubtotal = lines.reduce(
    (sum, l) => sum + l.quantityUnits * maxPrice(l.product.minPrice),
    0
  );
  const discountPercent = discountForSubtotal(grossSubtotal);

  const items: CartLine[] = lines.map((l) => {
    const price = unitPrice(l.product.minPrice, discountPercent);
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

  return { items, discountPercent, grossSubtotal, total };
}
