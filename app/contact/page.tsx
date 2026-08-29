import type { Metadata } from "next";
import ContactForm from "./ContactForm";
import { company } from "@/lib/company";

export const metadata: Metadata = {
  title: "Контакты — ПО «Рускисть»",
};

export default function ContactPage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-10 px-6 py-16 sm:flex-row">
      <div className="flex-1">
        <h1 className="font-display text-3xl font-semibold">
          Связаться с нами
        </h1>
        <p className="mt-2 text-muted">
          Заполните форму, и мы свяжемся с вами в ближайшее время.
        </p>

        <dl className="mt-8 space-y-3 text-sm">
          <div>
            <dt className="text-muted">Email</dt>
            <dd className="font-medium">{company.email}</dd>
          </div>
          <div>
            <dt className="text-muted">Телефон</dt>
            <dd className="font-medium">
              <a href={`tel:${company.phoneHref}`} className="hover:text-brand">
                {company.phone}
              </a>
            </dd>
          </div>
          <div>
            <dt className="text-muted">Юридический адрес</dt>
            <dd className="font-medium">{company.legalAddress}</dd>
          </div>
          <div>
            <dt className="text-muted">Реквизиты</dt>
            <dd className="font-medium">
              {company.shortName}
              <br />
              ИНН {company.inn}, КПП {company.kpp}
              <br />
              ОГРН {company.ogrn}
            </dd>
          </div>
        </dl>
      </div>
      <div className="flex-1">
        <ContactForm />
      </div>
    </div>
  );
}
