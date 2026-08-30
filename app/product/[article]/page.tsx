import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProductGallery from "@/components/ProductGallery";
import AddToOrderButton from "@/components/AddToOrderButton";
import ProductCard from "@/components/ProductCard";
import { getCategory } from "@/lib/categories";
import {
  generateDescription,
  getProductByArticle,
  getProductsByCategory,
} from "@/lib/products";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ article: string }>;
}): Promise<Metadata> {
  const { article } = await params;
  const product = await getProductByArticle(decodeURIComponent(article));
  return { title: product ? `${product.name} — ПО «Рускисть»` : "Товар" };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ article: string }>;
}) {
  const { article } = await params;
  const product = await getProductByArticle(decodeURIComponent(article));
  if (!product) notFound();

  const [category, categoryProducts] = await Promise.all([
    getCategory(product.categorySlug),
    getProductsByCategory(product.categorySlug),
  ]);
  const related = categoryProducts.filter((p) => p.article !== product.article).slice(0, 4);

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-12">
      <p className="text-sm text-muted">
        <Link href="/catalog" className="hover:text-brand">
          Каталог
        </Link>{" "}
        /{" "}
        {category && (
          <Link href={`/catalog/${category.slug}`} className="hover:text-brand">
            {category.name}
          </Link>
        )}
      </p>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <ProductGallery images={product.images} name={product.name} />

        <div>
          <h1 className="font-display text-2xl font-semibold leading-snug sm:text-3xl">
            {product.name}
          </h1>
          <p className="mt-2 text-sm text-muted">Артикул {product.article}</p>

          <div className="mt-6">
            <AddToOrderButton article={product.article} packageSize={product.packageSize} />
          </div>

          <p className="mt-8 text-sm leading-7 text-muted">
            {generateDescription(product)}
          </p>

          <div className="mt-8 rounded-xl border border-border bg-surface p-4 text-sm text-muted">
            Покупаете для магазина или под свой бренд? Мы работаем с оптовыми
            заказами без минимальной суммы и можем нанести ваш логотип.{" "}
            <Link href="/wholesale" className="font-medium text-brand hover:underline">
              Условия для партнёров →
            </Link>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <div className="mt-16">
          <h2 className="font-display text-xl font-semibold">Похожие товары</h2>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.article} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
