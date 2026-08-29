import Image from "next/image";
import Link from "next/link";
import CategoryTile from "@/components/CategoryTile";
import { getCategoriesWithCounts } from "@/lib/products";

const MATERIALS = [
  {
    title: "Конский волос",
    text: "Длинный и деликатный, особенно подходит для изделий, требующих бережного ухода.",
  },
  {
    title: "Щетина кабана",
    text: "Удивительно универсальна — может быть и мягкой, и достаточно жёсткой. Самый традиционный материал в отрасли.",
  },
  {
    title: "Волокно тампико",
    text: "Растительное волокно из листьев агавы — прочное и слегка абразивное.",
  },
  {
    title: "Волокно кокоса",
    text: "Гигроскопично и не подвержено гниению. Используется в щётках для пола и смётках.",
  },
  {
    title: "Синтетическое волокно",
    text: "Устойчиво к влаге, держит форму при интенсивном ежедневном использовании.",
  },
  {
    title: "Щетина козы",
    text: "Мягкая и деликатная — для самого бережного ухода.",
  },
];

export default function Home() {
  const categories = getCategoriesWithCounts();

  return (
    <div className="flex flex-col">
      <section className="border-b border-border bg-surface">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">
              Производственное объединение
            </p>
            <h1 className="mt-3 font-display text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
              Щёточные изделия, которым можно доверять
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-muted">
              Более 10 лет мы производим щётки, кисти и щёточные изделия из
              натуральных и переработанных материалов. Свыше 200 наименований
              — для дома, авто, ухода за собой и профессионального
              использования. Работаем и с розничными покупателями, и с
              оптовыми партнёрами.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/catalog"
                className="inline-flex h-12 items-center justify-center rounded-full bg-foreground px-6 text-sm font-medium text-background transition-colors hover:bg-brand"
              >
                Смотреть каталог
              </Link>
              <Link
                href="/wholesale"
                className="inline-flex h-12 items-center justify-center rounded-full border border-border px-6 text-sm font-medium text-foreground transition-colors hover:border-brand hover:text-brand"
              >
                Оптовым партнёрам
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {categories.slice(0, 4).map((c) =>
              c.cover ? (
                <div
                  key={c.slug}
                  className="relative aspect-square overflow-hidden rounded-2xl bg-[#f1ece1]"
                >
                  <Image
                    src={c.cover}
                    alt={c.name}
                    fill
                    sizes="25vw"
                    className="object-cover"
                  />
                </div>
              ) : null
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-16">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-2xl font-semibold sm:text-3xl">
            Каталог по категориям
          </h2>
          <Link href="/catalog" className="text-sm font-medium text-brand hover:underline">
            Весь каталог →
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <CategoryTile
              key={c.slug}
              slug={c.slug}
              name={c.name}
              shortDescription={`${c.shortDescription} · ${c.count} товаров`}
              cover={c.cover}
            />
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-surface">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="max-w-2xl font-display text-2xl font-semibold sm:text-3xl">
            Материалы, из которых мы производим кисти и щётки
          </h2>
          <p className="mt-3 max-w-2xl text-muted">
            Натуральное сырьё, продукты вторичной переработки и материалы,
            подлежащие дальнейшему рециклингу.
          </p>
          <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {MATERIALS.map((m) => (
              <div key={m.title}>
                <p className="font-display text-lg font-semibold text-foreground">
                  {m.title}
                </p>
                <p className="mt-2 text-sm leading-6 text-muted">{m.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-16">
        <div className="grid gap-8 rounded-2xl bg-foreground px-8 py-12 text-background sm:grid-cols-2 sm:px-12">
          <div>
            <h2 className="font-display text-2xl font-semibold sm:text-3xl">
              Работаете в рознице или опте?
            </h2>
            <p className="mt-3 max-w-md text-sm text-background/80">
              Мы поддерживаем и небольшие розничные заказы, и оптовые поставки
              без ограничения по минимальной сумме — от одной коробки одного
              наименования.
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 sm:items-end sm:justify-center">
            <Link
              href="/wholesale"
              className="inline-flex h-12 items-center justify-center rounded-full bg-brand px-6 text-sm font-medium text-white hover:bg-brand-dark"
            >
              Условия для партнёров
            </Link>
            <Link
              href="/contact"
              className="inline-flex h-12 items-center justify-center rounded-full border border-white/30 px-6 text-sm font-medium text-white hover:border-white"
            >
              Связаться с нами
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
