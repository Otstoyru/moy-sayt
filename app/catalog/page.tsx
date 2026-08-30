import type { Metadata } from "next";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import Pagination from "@/components/Pagination";
import { categories, groups } from "@/lib/categories";
import { getAllProducts } from "@/lib/products";

export const metadata: Metadata = {
  title: "Каталог — ПО «Рускисть»",
};

const PAGE_SIZE = 24;

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const products = getAllProducts();
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const totalPages = Math.ceil(products.length / PAGE_SIZE);
  const pageItems = products.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-12">
      <h1 className="font-display text-3xl font-semibold">Весь каталог</h1>
      <p className="mt-2 text-muted">{products.length} товаров</p>

      <div className="mt-6 flex flex-col gap-4">
        {groups.map((g) => (
          <div key={g.slug} id={g.slug} className="scroll-mt-24">
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
                    className="rounded-full border border-border px-4 py-1.5 text-sm text-foreground hover:border-brand hover:text-brand"
                  >
                    {c.name}
                  </Link>
                ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {pageItems.map((p) => (
          <ProductCard key={p.article} product={p} />
        ))}
      </div>

      <Pagination basePath="/catalog" page={page} totalPages={totalPages} />
    </div>
  );
}
