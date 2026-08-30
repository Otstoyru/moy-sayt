import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { createProduct } from "@/lib/products";
import { createCategory, getCategory } from "@/lib/categories";

export async function POST(request: NextRequest) {
  const staff = await requireRole(["manager", "administrator"]);
  if (!staff) return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const article = String(body?.article ?? "").trim();
  const name = String(body?.name ?? "").trim();
  const packageSize = Number(body?.packageSize);
  const minPrice = Number(body?.minPrice);
  const newCategoryName = String(body?.newCategoryName ?? "").trim();
  const groupSlug = String(body?.groupSlug ?? "").trim();
  const groupName = String(body?.groupName ?? "").trim();
  let categorySlug = String(body?.categorySlug ?? "").trim();

  if (!article || !name || !packageSize || packageSize <= 0 || !Number.isFinite(minPrice) || minPrice < 0) {
    return NextResponse.json({ error: "Заполните все обязательные поля" }, { status: 400 });
  }

  if (newCategoryName) {
    if (!groupSlug || !groupName) {
      return NextResponse.json({ error: "Выберите группу для новой категории" }, { status: 400 });
    }
    const category = await createCategory(newCategoryName, groupSlug, groupName);
    categorySlug = category.slug;
  } else if (categorySlug) {
    const category = await getCategory(categorySlug);
    if (!category) return NextResponse.json({ error: "Категория не найдена" }, { status: 400 });
  } else {
    return NextResponse.json({ error: "Выберите категорию" }, { status: 400 });
  }

  const result = await createProduct({
    article,
    name,
    productType: body?.productType ? String(body.productType) : null,
    categorySlug,
    packageSize,
    minPrice,
    sellerId: body?.sellerId ? Number(body.sellerId) : null,
  });

  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json(result.product);
}
