import { NextResponse } from "next/server";
import { getAllProducts } from "@/lib/products";
import { getCategories, getGroups } from "@/lib/categories";
import { getSellers } from "@/lib/sellers";
import { renderPriceListPdf } from "@/lib/priceList";

export async function GET() {
  const [products, categories, groups, sellers] = await Promise.all([
    getAllProducts(),
    getCategories(),
    getGroups(),
    getSellers(),
  ]);

  const pdf = await renderPriceListPdf(products, categories, groups, sellers);

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="price-list.pdf"',
    },
  });
}
