import { sql } from "@/lib/db";
import { getCategories } from "@/lib/categories";

export type Product = {
  article: string;
  name: string;
  productType: string;
  images: string[];
  packageSize: number;
  minPrice: number;
  stock: number;
  groupSlug: string;
  groupName: string;
  categorySlug: string;
  categoryName: string;
  sellerId: number | null;
};

const PRODUCT_SELECT = `
  SELECT p.article, p.name, p.product_type, p.images, p.package_size, p.min_price, p.stock,
         p.seller_id, c.slug AS category_slug, c.name AS category_name, c.group_slug, c.group_name
  FROM products p
  JOIN categories c ON c.slug = p.category_slug
`;

function mapRow(r: Record<string, unknown>): Product {
  return {
    article: r.article as string,
    name: r.name as string,
    productType: r.product_type as string,
    images: (r.images as string[]) ?? [],
    packageSize: Number(r.package_size),
    minPrice: Number(r.min_price),
    stock: Number(r.stock),
    groupSlug: r.group_slug as string,
    groupName: r.group_name as string,
    categorySlug: r.category_slug as string,
    categoryName: r.category_name as string,
    sellerId: r.seller_id === null || r.seller_id === undefined ? null : Number(r.seller_id),
  };
}

export async function getAllProducts(): Promise<Product[]> {
  const rows = await sql.query(PRODUCT_SELECT + " ORDER BY p.article");
  return rows.map(mapRow);
}

export async function getProductsByCategory(categorySlug: string): Promise<Product[]> {
  const rows = await sql`
    SELECT p.article, p.name, p.product_type, p.images, p.package_size, p.min_price, p.stock,
           p.seller_id, c.slug AS category_slug, c.name AS category_name, c.group_slug, c.group_name
    FROM products p
    JOIN categories c ON c.slug = p.category_slug
    WHERE c.slug = ${categorySlug}
    ORDER BY p.article
  `;
  return rows.map(mapRow);
}

export async function getProductByArticle(article: string): Promise<Product | undefined> {
  const rows = await sql`
    SELECT p.article, p.name, p.product_type, p.images, p.package_size, p.min_price, p.stock,
           p.seller_id, c.slug AS category_slug, c.name AS category_name, c.group_slug, c.group_name
    FROM products p
    JOIN categories c ON c.slug = p.category_slug
    WHERE p.article = ${article}
  `;
  return rows[0] ? mapRow(rows[0]) : undefined;
}

export async function getProductCountByCategory(categorySlug: string): Promise<number> {
  const rows = await sql`SELECT count(*) FROM products WHERE category_slug = ${categorySlug}`;
  return Number(rows[0].count);
}

export async function getCategoriesWithCounts() {
  const [categories, all] = await Promise.all([getCategories(), getAllProducts()]);
  return categories.map((c) => {
    const inCategory = all.filter((p) => p.categorySlug === c.slug);
    return { ...c, count: inCategory.length, cover: inCategory[0]?.images[0] };
  });
}

const MATERIALS: { match: RegExp; label: string; blurb: string }[] = [
  {
    match: /щетин[а-я]* кабана|вепр[ья]/i,
    label: "натуральная щетина кабана",
    blurb:
      "натуральная щетина кабана — универсальный материал, который бережно очищает и хорошо держит форму",
  },
  {
    match: /конск[а-я]* волос/i,
    label: "натуральный конский волос",
    blurb:
      "натуральный конский волос — мягкий и деликатный, подходит для бережного ухода",
  },
  {
    match: /волокн[а-я]* тампико/i,
    label: "волокно тампико",
    blurb:
      "растительное волокно тампико — прочное и слегка жёсткое, хорошо справляется с въевшимися загрязнениями",
  },
  {
    match: /волокн[а-я]* кокоса/i,
    label: "волокно кокоса",
    blurb:
      "волокно кокоса — гигроскопичное и износостойкое, не подвержено гниению",
  },
  {
    match: /щетин[а-я]* коз[а-я]*|козь[а-я]* /i,
    label: "щетина козы",
    blurb: "мягкая щетина козы — деликатный уход без риска повредить поверхность",
  },
  {
    match: /синтетическ[а-я]* волокн/i,
    label: "синтетическое волокно",
    blurb:
      "прочное синтетическое волокно, устойчивое к влаге и не теряющее форму при интенсивном использовании",
  },
  {
    match: /бук|дуб|ясень/i,
    label: "натуральное дерево",
    blurb: "массив дерева (бук, дуб или ясень) с защитным восковым покрытием",
  },
];

export function detectMaterial(name: string) {
  return MATERIALS.find((m) => m.match.test(name));
}

export function generateDescription(product: Product): string {
  const material = detectMaterial(product.name);

  const sentences: string[] = [];

  sentences.push(
    `${product.name.replace(/\s*\(\d+\s*шт\)\s*$/i, "")} — товар собственного производства ПО «Рускисть».`
  );

  if (material) {
    sentences.push(
      `В основе изделия — ${material.blurb}.`
    );
  }

  sentences.push(
    `Изделие относится к линейке «${product.categoryName.toLowerCase()}» и подходит как для розничной покупки, так и для оптовых заказов от магазинов и дистрибьюторов.`
  );

  sentences.push(
    `Артикул ${product.article}. Упаковка — ${product.packageSize} шт. Мы производим щёточные изделия более 10 лет и контролируем качество на каждом этапе — от подбора сырья до финальной сборки.`
  );

  return sentences.join(" ");
}
