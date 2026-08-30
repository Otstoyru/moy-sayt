import { sql } from "@/lib/db";

// Ручные исправления опечаток в исходном файле — не трогают сам файл,
// применяются только к тексту, который попадёт на сайт.
const NAME_FIXES: Record<string, string> = {
  "Для узода за телом": "Для ухода за телом",
};

const TRANSLIT: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z",
  и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
  с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch",
  ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .split("")
    .map((ch) => TRANSLIT[ch] ?? ch)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export type StockImportResult = {
  categoriesUpserted: number;
  productsUpserted: number;
  /** Артикулы, которых раньше не было в БД — им нужно вручную назначить юрлицо в /admin/sellers. */
  newArticles: string[];
};

/**
 * Разбирает файл «Остатки для сайта.xlsx» (лист "Лист1", колонки: группа,
 * категория, тип товара, название, артикул, размер упаковки, мин. цена,
 * остаток) и обновляет products/categories в БД. Не трогает seller_id и
 * фото уже существующих товаров — при обновлении остатков/цен эти поля
 * сохраняются как есть; новые товары получают seller_id = NULL и
 * плейсхолдер вместо фото, что и попадает в `newArticles` как сигнал
 * админу вручную назначить юрлицо и настоящие фото.
 */
export async function importStockWorkbook(buffer: Buffer): Promise<StockImportResult> {
  const XLSX = await import("xlsx");
  const wb = XLSX.read(buffer, { type: "buffer" });
  const ws = wb.Sheets["Лист1"];
  if (!ws) throw new Error('В файле не найден лист "Лист1"');

  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true }).slice(1) as unknown[][];

  const existingImages = new Map<string, string[]>();
  const existingArticles = new Set<string>();
  for (const row of await sql`SELECT article, images FROM products`) {
    const article = (row.article as string).trim();
    existingArticles.add(article);
    if (Array.isArray(row.images) && row.images.length) existingImages.set(article, row.images);
  }

  const categories = new Map<string, { slug: string; name: string; groupSlug: string; groupName: string }>();
  const products: {
    article: string;
    name: string;
    productType: string;
    images: string[];
    packageSize: number;
    minPrice: number;
    stock: number;
    categorySlug: string;
  }[] = [];
  const newArticles: string[] = [];

  for (const row of rows) {
    const [groupNameRaw, markRaw, productType, title, articleRaw, packageSizeRaw, minPriceRaw, stockRaw] = row as [
      string, string, string, string, string | number, number, number, number
    ];
    if (!articleRaw) continue;

    const article = String(articleRaw).trim();
    const groupName = NAME_FIXES[groupNameRaw] ?? groupNameRaw;
    const categoryName = NAME_FIXES[markRaw] ?? markRaw;
    const groupSlug = slugify(groupName);
    const categorySlug = slugify(categoryName);

    if (!categories.has(categorySlug)) {
      categories.set(categorySlug, { slug: categorySlug, name: categoryName, groupSlug, groupName });
    }

    if (!existingArticles.has(article)) newArticles.push(article);

    products.push({
      article,
      name: [productType, title].filter(Boolean).join(", "),
      productType,
      images: existingImages.get(article) ?? ["/placeholder-product.svg"],
      packageSize: Number(packageSizeRaw),
      minPrice: Number(minPriceRaw),
      stock: Number(stockRaw),
      categorySlug,
    });
  }

  for (const c of categories.values()) {
    await sql`
      INSERT INTO categories (slug, name, group_slug, group_name)
      VALUES (${c.slug}, ${c.name}, ${c.groupSlug}, ${c.groupName})
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, group_slug = EXCLUDED.group_slug, group_name = EXCLUDED.group_name
    `;
  }

  for (const p of products) {
    await sql`
      INSERT INTO products (article, stock, name, product_type, images, package_size, min_price, category_slug)
      VALUES (${p.article}, ${p.stock}, ${p.name}, ${p.productType}, ${JSON.stringify(p.images)}, ${p.packageSize}, ${p.minPrice}, ${p.categorySlug})
      ON CONFLICT (article) DO UPDATE SET
        stock = EXCLUDED.stock,
        name = EXCLUDED.name,
        product_type = EXCLUDED.product_type,
        images = EXCLUDED.images,
        package_size = EXCLUDED.package_size,
        min_price = EXCLUDED.min_price,
        category_slug = EXCLUDED.category_slug
    `;
  }

  return { categoriesUpserted: categories.size, productsUpserted: products.length, newArticles };
}
