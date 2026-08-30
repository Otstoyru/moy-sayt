import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getCart } from "@/lib/cart";
import { amountToZeroMarkup } from "@/lib/pricing";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ items: [], discountPercent: 0, total: 0, amountToNextDiscount: amountToZeroMarkup(0) });
  }
  const cart = await getCart(user.id);
  return NextResponse.json(cart);
}
