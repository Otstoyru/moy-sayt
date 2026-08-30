"use client";

import { useEffect, useState } from "react";
import { useOrderList } from "@/components/OrderListProvider";

export default function AddToOrderButton({
  article,
  packageSize,
}: {
  article: string;
  packageSize: number;
}) {
  const { items, setPackages } = useOrderList();
  const [available, setAvailable] = useState<number | null>(null);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const current = items.find((i) => i.article === article)?.packages ?? 0;

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/products/${encodeURIComponent(article)}/availability`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setAvailable(d.available ?? 0);
      })
      .catch(() => {
        if (!cancelled) setAvailable(0);
      });
    return () => {
      cancelled = true;
    };
  }, [article, current]);

  async function change(next: number) {
    setNotice(null);
    setPending(true);
    const result = await setPackages(article, next);
    if (!result.ok) {
      setAvailable(result.availablePackages);
      setNotice(`Доступно только ${result.availablePackages} уп.`);
    }
    setPending(false);
  }

  if (available === null) {
    return <div className="h-12 w-40 animate-pulse rounded-full bg-surface" />;
  }

  if (available === 0 && current === 0) {
    return (
      <span className="inline-flex h-12 items-center justify-center rounded-full bg-surface px-8 text-sm font-medium text-muted">
        Под заказ
      </span>
    );
  }

  return (
    <div>
      {current === 0 ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => change(1)}
          className="inline-flex h-12 items-center justify-center rounded-full bg-foreground px-8 text-sm font-medium text-background transition-colors hover:bg-brand disabled:opacity-50"
        >
          Добавить к заказу
        </button>
      ) : (
        <div className="inline-flex items-center gap-4 rounded-full border border-border px-2">
          <button
            type="button"
            disabled={pending}
            onClick={() => change(current - 1)}
            className="flex h-10 w-10 items-center justify-center text-lg disabled:opacity-30"
          >
            −
          </button>
          <span className="min-w-[4ch] text-center text-sm font-medium">
            {current} уп.
          </span>
          <button
            type="button"
            disabled={pending || current >= available}
            onClick={() => change(current + 1)}
            className="flex h-10 w-10 items-center justify-center text-lg disabled:opacity-30"
          >
            +
          </button>
        </div>
      )}
      {notice && <p className="mt-2 text-xs text-red-600">{notice}</p>}
      <p className="mt-2 text-xs text-muted">
        В упаковке {packageSize} шт. Доступно {available} уп.
      </p>
    </div>
  );
}
