"use client";

import Link from "next/link";
import { useState } from "react";
import type { Group } from "@/lib/categories";
import { useOrderList } from "@/components/OrderListProvider";

type HeaderUser = { name: string; role: string } | null;

export default function SiteHeader({ groups, user }: { groups: Group[]; user: HeaderUser }) {
  const { totalCount } = useOrderList();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="flex flex-col leading-none">
          <span className="font-display text-2xl font-semibold tracking-tight text-foreground">
            Рускисть
          </span>
          <span className="text-[11px] uppercase tracking-[0.2em] text-muted">
            ПО «Рускисть»
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-foreground lg:flex">
          <Link href="/catalog" className="hover:text-brand">
            Каталог
          </Link>
          <Link href="/wholesale" className="hover:text-brand">
            Оптовым партнёрам
          </Link>
          <Link href="/about" className="hover:text-brand">
            О компании
          </Link>
          <Link href="/contact" className="hover:text-brand">
            Контакты
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {(user?.role === "administrator" || user?.role === "manager") && (
            <Link href="/admin/orders" className="hidden text-sm font-medium hover:text-brand lg:block">
              Админ
            </Link>
          )}
          <Link
            href={user ? "/account" : "/login"}
            className="hidden text-sm font-medium hover:text-brand lg:block"
          >
            {user ? user.name : "Войти"}
          </Link>
          <Link
            href="/order"
            className="relative flex h-10 items-center gap-2 rounded-full border border-border px-4 text-sm font-medium hover:border-brand hover:text-brand"
          >
            Список к заказу
            {totalCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-xs font-semibold text-white">
                {totalCount}
              </span>
            )}
          </Link>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border lg:hidden"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Меню"
          >
            <span className="text-lg">☰</span>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-border px-6 py-4 lg:hidden">
          <nav className="flex flex-col gap-3 text-sm font-medium">
            <Link href={user ? "/account" : "/login"} onClick={() => setMenuOpen(false)}>
              {user ? user.name : "Войти"}
            </Link>
            <Link href="/catalog" onClick={() => setMenuOpen(false)}>
              Каталог
            </Link>
            <Link href="/wholesale" onClick={() => setMenuOpen(false)}>
              Оптовым партнёрам
            </Link>
            <Link href="/about" onClick={() => setMenuOpen(false)}>
              О компании
            </Link>
            <Link href="/contact" onClick={() => setMenuOpen(false)}>
              Контакты
            </Link>
          </nav>
        </div>
      )}

      <div className="hidden border-t border-border/70 bg-background/60 lg:block">
        <div className="mx-auto flex max-w-6xl flex-wrap gap-x-5 gap-y-2 px-6 py-2.5 text-[13px] text-muted">
          {groups.map((g) => (
            <Link key={g.slug} href={`/catalog#${g.slug}`} className="hover:text-brand">
              {g.name}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
