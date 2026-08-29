import type { Metadata } from "next";
import PriceListForm from "@/components/PriceListForm";

export const metadata: Metadata = {
  title: "Оптовым партнёрам — ПО «Рускисть»",
};

const BENEFITS = [
  {
    title: "Большой ассортимент",
    text: "200+ наименований востребованных товаров для дома, сада, ухода за телом и волосами — со стабильным спросом у покупателей.",
  },
  {
    title: "Экспертность",
    text: "Более 10 лет опыта разработки и производства кистей и щёток на деревянной основе и изделий из бука.",
  },
  {
    title: "Надёжность",
    text: "Заключаем договор, соблюдаем сроки поставки, гарантируем качество каждой партии.",
  },
  {
    title: "Без минимальной суммы заказа",
    text: "Вы можете приобрести одну коробку одного наименования — удобно для начинающих предпринимателей.",
  },
];

const SERVICES = [
  {
    title: "Нанесение логотипа",
    text: "Изготовим партию щёточных изделий под вашим брендом.",
  },
  {
    title: "Разработка нового товара",
    text: "Поможем разработать изделие под конкретную задачу — от эскиза до серийного производства.",
  },
  {
    title: "Индивидуальная упаковка",
    text: "Подберём или разработаем упаковку под ваш формат продаж.",
  },
];

export default function WholesalePage() {
  return (
    <div>
      <section className="border-b border-border bg-surface">
        <div className="mx-auto max-w-4xl px-6 py-16 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">
            Приглашаем к сотрудничеству
          </p>
          <h1 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
            Оптовые поставки щёточных изделий напрямую от производителя
          </h1>
          <p className="mt-4 text-muted">
            ПО «Рускисть» производит щётки, кисти и щёточные изделия
            собственными силами и поставляет их магазинам, дистрибьюторам и
            маркетплейс-продавцам без посредников.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-8 sm:grid-cols-2">
          {BENEFITS.map((b) => (
            <div key={b.title} className="rounded-xl border border-border bg-surface p-6">
              <p className="font-display text-lg font-semibold">{b.title}</p>
              <p className="mt-2 text-sm leading-6 text-muted">{b.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-surface">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="font-display text-2xl font-semibold sm:text-3xl">
            Производство щёток под вашим брендом
          </h2>
          <div className="mt-8 grid gap-8 sm:grid-cols-3">
            {SERVICES.map((s) => (
              <div key={s.title}>
                <p className="font-display text-lg font-semibold">{s.title}</p>
                <p className="mt-2 text-sm leading-6 text-muted">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-6 py-16">
        <h2 className="text-center font-display text-2xl font-semibold sm:text-3xl">
          Получить прайс-лист
        </h2>
        <p className="mt-3 text-center text-muted">
          Оставьте контакты — пришлём актуальный прайс-лист с информацией о
          товарах и условиях сотрудничества.
        </p>
        <div className="mt-8">
          <PriceListForm />
        </div>
      </section>
    </div>
  );
}
