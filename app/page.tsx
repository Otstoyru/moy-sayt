import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 items-center justify-center px-6">
      <div className="max-w-xl text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Добро пожаловать
        </h1>
        <p className="mt-4 text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          Это простой сайт на Next.js. Здесь может быть описание вашей компании,
          продукта или услуги.
        </p>
        <Link
          href="/contact"
          className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-foreground px-6 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
        >
          Связаться с нами
        </Link>
      </div>
    </div>
  );
}
