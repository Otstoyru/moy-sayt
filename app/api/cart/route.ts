import { NextResponse } from "next/server";
import { getOrCreateSessionId } from "@/lib/session";
import { getCart } from "@/lib/cart";

export async function GET() {
  const sessionId = await getOrCreateSessionId();
  const cart = await getCart(sessionId);
  return NextResponse.json(cart);
}
