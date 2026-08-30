import rawProducts from "@/data/products.json";
import { categories } from "@/lib/categories";

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
};

export const products = rawProducts as Product[];

export function getAllProducts(): Product[] {
  return products;
}

export function getProductsByCategory(categorySlug: string): Product[] {
  return products.filter((p) => p.categorySlug === categorySlug);
}

export function getProductByArticle(article: string): Product | undefined {
  return products.find((p) => p.article === article);
}

export function getProductCountByCategory(categorySlug: string): number {
  return products.filter((p) => p.categorySlug === categorySlug).length;
}

export function getCategoriesWithCounts() {
  return categories.map((c) => ({
    ...c,
    count: getProductCountByCategory(c.slug),
    cover: getProductsByCategory(c.slug)[0]?.images[0],
  }));
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
  const category = categories.find((c) => c.slug === product.categorySlug);

  const sentences: string[] = [];

  sentences.push(
    `${product.name.replace(/\s*\(\d+\s*шт\)\s*$/i, "")} — товар собственного производства ПО «Рускисть».`
  );

  if (material) {
    sentences.push(
      `В основе изделия — ${material.blurb}.`
    );
  }

  if (category) {
    sentences.push(
      `Изделие относится к линейке «${category.name.toLowerCase()}» и подходит как для розничной покупки, так и для оптовых заказов от магазинов и дистрибьюторов.`
    );
  }

  sentences.push(
    `Артикул ${product.article}. Упаковка — ${product.packageSize} шт. Мы производим щёточные изделия более 10 лет и контролируем качество на каждом этапе — от подбора сырья до финальной сборки.`
  );

  return sentences.join(" ");
}
