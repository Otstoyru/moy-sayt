import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import Pagination from "@/components/Pagination";
import { getCategories, getGroups, getCategory } from "@/lib/categories";
import { getProductsByCategory } from "@/lib/products";

export const revalidate = 60;

const PAGE_SIZE = 24;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const cat = await getCategory(category);
  return { title: cat ? `${cat.name} — ПО «Рускисть»` : "Каталог" };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { category } = await params;
  const { page: pageParam } = await searchParams;
  const [cat, categories, groups] = await Promise.all([
    getCategory(category),
    getCategories(),
    getGroups(),
  ]);
  if (!cat) notFound();

  const products = await getProductsByCategory(category);
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const totalPages = Math.ceil(products.length / PAGE_SIZE);
  const pageItems = products.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-12">
      <p className="text-sm text-muted">
        <Link href="/catalog" className="hover:text-brand">
          Каталог
        </Link>{" "}
        / {cat.name}
      </p>
      <h1 className="mt-2 font-display text-3xl font-semibold">{cat.name}</h1>
      <p className="mt-2 text-muted">
        {cat.groupName} · {products.length} товаров
      </p>

      <div className="mt-6 flex flex-col gap-4">
        {groups.map((g) => (
          <div key={g.slug}>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              {g.name}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {categories
                .filter((c) => c.groupSlug === g.slug)
                .map((c) => (
                  <Link
                    key={c.slug}
                    href={`/catalog/${c.slug}`}
                    className={`rounded-full border px-4 py-1.5 text-sm ${
                      c.slug === category
                        ? "border-brand bg-brand text-white"
                        : "border-border text-foreground hover:border-brand hover:text-brand"
                    }`}
                  >
                    {c.name}
                  </Link>
                ))}
            </div>
          </div>
        ))}
      </div>

      {pageItems.length === 0 ? (
        <p className="mt-12 text-muted">В этой категории пока нет товаров.</p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {pageItems.map((p) => (
            <ProductCard key={p.article} product={p} />
          ))}
        </div>
      )}

      <Pagination
        basePath={`/catalog/${category}`}
        page={page}
        totalPages={totalPages}
      />
    </div>
  );
}
