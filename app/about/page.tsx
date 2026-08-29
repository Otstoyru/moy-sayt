import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "О компании — ПО «Рускисть»",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">
        О компании
      </p>
      <h1 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
        Производственное объединение «Рускисть»
      </h1>

      <div className="mt-8 flex flex-col gap-5 text-base leading-7 text-muted">
        <p>
          ПО «Рускисть» занимается производством щетинно-щёточных изделий —
          щёток, кистей и сопутствующих товаров для дома, ухода за собой,
          автомобиля и профессионального использования. Ассортимент включает
          более 200 наименований.
        </p>
        <p>
          Мы производим изделия из натуральных материалов — конского волоса,
          щетины кабана, натуральных растительных волокон и древесины бука —
          а также используем продукты вторичной переработки, которые
          в дальнейшем подлежат рециклингу.
        </p>
        <p>
          На протяжении многих лет продажи нашей продукции велись через
          партнёра — ООО «Экобраш». Сегодня мы развиваем собственный канал
          продаж и работаем напрямую с розничными покупателями и оптовыми
          партнёрами: магазинами, дистрибьюторами и продавцами на
          маркетплейсах.
        </p>
        <p>
          Мы контролируем качество на каждом этапе — от подбора сырья до
          финальной сборки — и готовы обсуждать индивидуальные условия:
          нанесение логотипа, разработку новых изделий и упаковку под ваш
          формат продаж.
        </p>
      </div>

      <div className="mt-10 flex flex-wrap gap-4">
        <Link
          href="/catalog"
          className="inline-flex h-12 items-center justify-center rounded-full bg-foreground px-6 text-sm font-medium text-background hover:bg-brand"
        >
          Смотреть каталог
        </Link>
        <Link
          href="/wholesale"
          className="inline-flex h-12 items-center justify-center rounded-full border border-border px-6 text-sm font-medium hover:border-brand hover:text-brand"
        >
          Условия для партнёров
        </Link>
      </div>
    </div>
  );
}
