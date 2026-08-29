"use client";

import { useState } from "react";
import { useOrderList } from "@/components/OrderListProvider";

export default function AddToOrderButton({
  article,
  name,
  price,
  image,
}: {
  article: string;
  name: string;
  price: number;
  image: string;
}) {
  const { addItem } = useOrderList();
  const [added, setAdded] = useState(false);

  return (
    <button
      type="button"
      onClick={() => {
        addItem({ article, name, price, image });
        setAdded(true);
        setTimeout(() => setAdded(false), 1500);
      }}
      className="inline-flex h-12 items-center justify-center rounded-full bg-foreground px-8 text-sm font-medium text-background transition-colors hover:bg-brand"
    >
      {added ? "Добавлено ✓" : "Добавить к заказу"}
    </button>
  );
}
