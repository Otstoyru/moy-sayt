import Link from "next/link";
import { categories } from "@/lib/categories";
import { company } from "@/lib/company";

export default function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-display text-xl font-semibold">Рускисть</p>
          <p className="mt-2 text-sm text-muted">
            Производственное объединение «Рускисть» — щёточные изделия
            собственного производства. Более 200 наименований, опт и
            розница.
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold text-foreground">Каталог</p>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            {categories.slice(0, 6).map((c) => (
              <li key={c.slug}>
                <Link href={`/catalog/${c.slug}`} className="hover:text-brand">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold text-foreground">Компания</p>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>
              <Link href="/about" className="hover:text-brand">
                О компании
              </Link>
            </li>
            <li>
              <Link href="/wholesale" className="hover:text-brand">
                Оптовым партнёрам
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-brand">
                Контакты
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold text-foreground">Контакты</p>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>{company.email}</li>
            <li>
              <a href={`tel:${company.phoneHref}`} className="hover:text-brand">
                {company.phone}
              </a>
            </li>
            <li>{company.legalAddress}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted">
        <p>
          {company.shortName}, ИНН {company.inn}, ОГРН {company.ogrn}
        </p>
        <p className="mt-1">
          © {new Date().getFullYear()} ПО «Рускисть». Все права защищены.
        </p>
      </div>
    </footer>
  );
}
