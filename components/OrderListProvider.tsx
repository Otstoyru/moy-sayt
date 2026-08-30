"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";

export type CartLine = {
  article: string;
  name: string;
  image: string;
  packageSize: number;
  packages: number;
  unitPrice: number;
  lineTotal: number;
};

type SetPackagesResult =
  | { ok: true }
  | { ok: false; availablePackages: number; requiresLogin?: false }
  | { ok: false; availablePackages: 0; requiresLogin: true };

type OrderListContextValue = {
  items: CartLine[];
  loading: boolean;
  discountPercent: number;
  amountToNextDiscount: number;
  totalPrice: number;
  totalCount: number;
  setPackages: (article: string, packages: number) => Promise<SetPackagesResult>;
  removeItem: (article: string) => Promise<void>;
  refresh: () => Promise<void>;
  submit: (fields: {
    name: string;
    phone: string;
    email?: string;
    comment?: string;
    buyerType: string;
  }) => Promise<{ ok: true } | { ok: false; error: string }>;
};

const OrderListContext = createContext<OrderListContextValue | null>(null);

type CartResponse = {
  items: CartLine[];
  discountPercent: number;
  amountToNextDiscount: number;
  total: number;
};

export function OrderListProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartResponse>({
    items: [],
    discountPercent: 0,
    amountToNextDiscount: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/cart");
    if (res.ok) setCart(await res.json());
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const setPackages = useCallback(
    async (article: string, packages: number): Promise<SetPackagesResult> => {
      const res = await fetch("/api/cart/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ article, packages }),
      });
      if (res.status === 401) {
        return { ok: false, availablePackages: 0, requiresLogin: true };
      }
      if (res.status === 409) {
        const data = await res.json();
        return { ok: false, availablePackages: data.availablePackages ?? 0 };
      }
      if (res.ok) {
        setCart(await res.json());
        return { ok: true };
      }
      return { ok: false, availablePackages: 0 };
    },
    []
  );

  const removeItem = useCallback(
    async (article: string) => {
      await setPackages(article, 0);
    },
    [setPackages]
  );

  const submit = useCallback(
    async (fields: {
      name: string;
      phone: string;
      email?: string;
      comment?: string;
      buyerType: string;
    }) => {
      const res = await fetch("/api/cart/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      if (res.ok) {
        await refresh();
        return { ok: true as const };
      }
      if (res.status === 401) {
        return { ok: false as const, error: "Требуется вход в аккаунт" };
      }
      const data = await res.json().catch(() => ({}));
      return { ok: false as const, error: data.error ?? "Не удалось отправить заявку" };
    },
    [refresh]
  );

  const totalCount = useMemo(
    () => cart.items.reduce((sum, i) => sum + i.packages, 0),
    [cart.items]
  );

  const value = useMemo(
    () => ({
      items: cart.items,
      loading,
      discountPercent: cart.discountPercent,
      amountToNextDiscount: cart.amountToNextDiscount,
      totalPrice: cart.total,
      totalCount,
      setPackages,
      removeItem,
      refresh,
      submit,
    }),
    [cart, loading, totalCount, setPackages, removeItem, refresh, submit]
  );

  return (
    <OrderListContext.Provider value={value}>
      {children}
    </OrderListContext.Provider>
  );
}

export function useOrderList() {
  const ctx = useContext(OrderListContext);
  if (!ctx) throw new Error("useOrderList must be used within OrderListProvider");
  return ctx;
}
