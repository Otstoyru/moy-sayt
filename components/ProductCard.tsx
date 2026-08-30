"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Product } from "@/lib/products";
import { useOrderList } from "@/components/OrderListProvider";

export default function ProductCard({ product }: { product: Product }) {
  const { items, setPackages } = useOrderList();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const current = items.find((i) => i.article === product.article)?.packages ?? 0;
  const outOfStock = product.stock <= 0;

  async function handleAdd() {
    setPending(true);
    setNotice(null);
    const result = await setPackages(product.article, current + 1);
    if (!result.ok) {
      if (result.requiresLogin) {
        router.push(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }
      setNotice(
        result.availablePackages > 0
          ? `Доступно только ${result.availablePackages} уп.`
          : "Товар закончился"
      );
    }
    setPending(false);
  }

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
        {outOfStock && (
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
        <p className="text-xs text-muted">
          Артикул {product.article} · упаковка {product.packageSize} шт.
        </p>
        {current > 0 && (
          <p className="text-xs font-medium text-brand">В заказе: {current} уп.</p>
        )}
        {notice && <p className="text-xs text-red-600">{notice}</p>}
        <button
          type="button"
          disabled={outOfStock || pending}
          onClick={handleAdd}
          className="mt-auto inline-flex h-9 items-center justify-center rounded-full bg-foreground text-sm font-medium text-background transition-colors hover:bg-brand disabled:cursor-not-allowed disabled:opacity-40"
        >
          {outOfStock ? "Под заказ" : "Добавить упаковку"}
        </button>
      </div>
    </div>
  );
}
