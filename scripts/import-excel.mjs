import XLSX from "xlsx";
import { neon } from "@neondatabase/serverless";

const inputPath = process.argv[2];
if (!inputPath) {
  console.error("Usage: node scripts/import-excel.mjs <path-to-xlsx>");
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL не задан");
  process.exit(1);
}

// Ручные исправления опечаток в исходном файле — не трогают сам файл,
// применяются только к тексту, который попадёт на сайт.
const NAME_FIXES = {
  "Для узода за телом": "Для ухода за телом",
};

const TRANSLIT = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z",
  и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
  с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch",
  ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};

function slugify(text) {
  return text
    .toLowerCase()
    .split("")
    .map((ch) => TRANSLIT[ch] ?? ch)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const sql = neon(process.env.DATABASE_URL);

const wb = XLSX.readFile(inputPath);
const ws = wb.Sheets["Лист1"];
const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true }).slice(1);

// Фото переносим из уже сохранённых в БД товаров там, где артикул совпадает.
const existingImages = new Map();
for (const row of await sql`SELECT article, images FROM products WHERE images IS NOT NULL`) {
  if (Array.isArray(row.images) && row.images.length) {
    existingImages.set(row.article.trim(), row.images);
  }
}

const categories = new Map(); // slug -> {slug, name, groupSlug, groupName}
const products = [];

for (const row of rows) {
  const [groupNameRaw, markRaw, productType, title, articleRaw, packageSizeRaw, minPriceRaw, stockRaw] = row;

  const article = String(articleRaw).trim();
  const groupName = NAME_FIXES[groupNameRaw] ?? groupNameRaw;
  const categoryName = NAME_FIXES[markRaw] ?? markRaw;
  const groupSlug = slugify(groupName);
  const categorySlug = slugify(categoryName);

  if (!categories.has(categorySlug)) {
    categories.set(categorySlug, { slug: categorySlug, name: categoryName, groupSlug, groupName });
  }

  const packageSize = Number(packageSizeRaw);
  const minPrice = Number(minPriceRaw);
  const stock = Number(stockRaw);

  const name = [productType, title].filter(Boolean).join(", ");
  const images = existingImages.get(article) ?? ["/placeholder-product.svg"];

  products.push({
    article,
    name,
    productType,
    images,
    packageSize,
    minPrice,
    stock,
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
console.log(`Postgres: upserted ${categories.size} categories`);

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
console.log(`Postgres: upserted ${products.length} products`);
