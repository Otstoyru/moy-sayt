import XLSX from "xlsx";
import { neon } from "@neondatabase/serverless";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const inputPath = process.argv[2];
if (!inputPath) {
  console.error("Usage: node scripts/import-excel.mjs <path-to-xlsx>");
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

const wb = XLSX.readFile(inputPath);
const ws = wb.Sheets["Лист1"];
const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true }).slice(1);

// Изображения переносим из текущего каталога там, где артикул совпадает.
const oldProductsPath = path.join(root, "data", "products.json");
const oldImagesByArticle = new Map();
if (existsSync(oldProductsPath)) {
  const old = JSON.parse(readFileSync(oldProductsPath, "utf8"));
  for (const p of old) {
    if (Array.isArray(p.images) && p.images.length) {
      oldImagesByArticle.set(p.article.trim(), p.images);
    }
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
  const images = oldImagesByArticle.get(article) ?? ["/placeholder-product.svg"];

  products.push({
    article,
    name,
    productType,
    images,
    packageSize,
    minPrice,
    stock,
    groupSlug,
    groupName,
    categorySlug,
    categoryName,
  });
}

writeFileSync(
  path.join(root, "data", "products.json"),
  JSON.stringify(products, null, 2) + "\n",
  "utf8"
);
console.log(`data/products.json: ${products.length} products`);

const GROUP_ORDER = ["schetki", "izdeliya-iz-dereva"];
const sortedCategories = [...categories.values()].sort((a, b) => {
  const gi = GROUP_ORDER.indexOf(a.groupSlug) - GROUP_ORDER.indexOf(b.groupSlug);
  if (gi !== 0) return gi;
  return a.name.localeCompare(b.name, "ru");
});

const categoriesSource = `// Сгенерировано scripts/import-excel.mjs — не редактировать руками.
export type Category = {
  slug: string;
  name: string;
  groupSlug: string;
  groupName: string;
};

export const groups = [
${[...new Set(sortedCategories.map((c) => c.groupSlug))]
  .map((slug) => {
    const name = sortedCategories.find((c) => c.groupSlug === slug).groupName;
    return `  { slug: ${JSON.stringify(slug)}, name: ${JSON.stringify(name)} },`;
  })
  .join("\n")}
];

export const categories: Category[] = [
${sortedCategories
  .map(
    (c) =>
      `  { slug: ${JSON.stringify(c.slug)}, name: ${JSON.stringify(c.name)}, groupSlug: ${JSON.stringify(
        c.groupSlug
      )}, groupName: ${JSON.stringify(c.groupName)} },`
  )
  .join("\n")}
];

export function getCategory(slug: string) {
  return categories.find((c) => c.slug === slug);
}
`;

writeFileSync(path.join(root, "lib", "categories.ts"), categoriesSource, "utf8");
console.log(`lib/categories.ts: ${sortedCategories.length} categories in ${new Set(sortedCategories.map(c=>c.groupSlug)).size} groups`);

// Обновляем остатки в БД (upsert, не трогает активные резервы).
if (process.env.DATABASE_URL) {
  const sql = neon(process.env.DATABASE_URL);
  for (const p of products) {
    await sql`
      INSERT INTO products (article, stock) VALUES (${p.article}, ${p.stock})
      ON CONFLICT (article) DO UPDATE SET stock = EXCLUDED.stock
    `;
  }
  console.log(`Postgres: upserted stock for ${products.length} articles`);
} else {
  console.log("DATABASE_URL not set — skipped Postgres upsert");
}
