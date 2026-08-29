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

export type OrderItem = {
  article: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
};

type OrderListContextValue = {
  items: OrderItem[];
  addItem: (item: Omit<OrderItem, "quantity">, quantity?: number) => void;
  removeItem: (article: string) => void;
  setQuantity: (article: string, quantity: number) => void;
  clear: () => void;
  totalCount: number;
  totalPrice: number;
};

const OrderListContext = createContext<OrderListContextValue | null>(null);

const STORAGE_KEY = "ruskist-order-list";

export function OrderListProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<OrderItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items, hydrated]);

  const addItem = useCallback(
    (item: Omit<OrderItem, "quantity">, quantity = 1) => {
      setItems((prev) => {
        const existing = prev.find((i) => i.article === item.article);
        if (existing) {
          return prev.map((i) =>
            i.article === item.article
              ? { ...i, quantity: i.quantity + quantity }
              : i
          );
        }
        return [...prev, { ...item, quantity }];
      });
    },
    []
  );

  const removeItem = useCallback((article: string) => {
    setItems((prev) => prev.filter((i) => i.article !== article));
  }, []);

  const setQuantity = useCallback((article: string, quantity: number) => {
    setItems((prev) =>
      prev.map((i) =>
        i.article === article ? { ...i, quantity: Math.max(1, quantity) } : i
      )
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const totalCount = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );
  const totalPrice = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity * i.price, 0),
    [items]
  );

  const value = useMemo(
    () => ({ items, addItem, removeItem, setQuantity, clear, totalCount, totalPrice }),
    [items, addItem, removeItem, setQuantity, clear, totalCount, totalPrice]
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
