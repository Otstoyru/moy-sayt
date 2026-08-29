"use client";

import Image from "next/image";
import Link from "next/link";
import { Product } from "@/lib/products";
import { useOrderList } from "@/components/OrderListProvider";

export default function ProductCard({ product }: { product: Product }) {
  const { addItem } = useOrderList();

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-border bg-surface transition-shadow hover:shadow-md">
      <Link
        href={`/product/${encodeURIComponent(product.article)}`}
        className="relative block aspect-square overflow-hidden bg-[#f1ece1]"
      >
        <Image
          src={product.images[0]}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-contain p-2 transition-transform duration-300 group-hover:scale-105"
        />
        {!product.inStock && (
          <span className="absolute left-2 top-2 rounded-full bg-foreground/80 px-2 py-1 text-[11px] font-medium text-white">
            Под заказ
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <Link
          href={`/product/${encodeURIComponent(product.article)}`}
          className="line-clamp-2 text-sm font-medium text-foreground hover:text-brand"
        >
          {product.name}
        </Link>
        <p className="text-xs text-muted">Артикул {product.article}</p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <div>
            <span className="font-display text-lg font-semibold text-foreground">
              {product.price.toLocaleString("ru-RU")} ₽
            </span>
            {product.oldPrice && (
              <span className="ml-2 text-xs text-muted line-through">
                {product.oldPrice.toLocaleString("ru-RU")} ₽
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() =>
            addItem({
              article: product.article,
              name: product.name,
              price: product.price,
              image: product.images[0],
            })
          }
          className="mt-2 inline-flex h-9 items-center justify-center rounded-full bg-foreground text-sm font-medium text-background transition-colors hover:bg-brand"
        >
          Добавить к заказу
        </button>
      </div>
    </div>
  );
}
