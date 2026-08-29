import type { Metadata } from "next";
import ContactForm from "./ContactForm";

export const metadata: Metadata = {
  title: "Контакты — Мой сайт",
};

export default function ContactPage() {
  return (
    <div className="flex flex-1 justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Связаться с нами
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Заполните форму, и мы свяжемся с вами в ближайшее время.
        </p>
        <div className="mt-8">
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
