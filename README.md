# ПО «Рускисть» — сайт

Сайт производственного объединения «Рускисть»: каталог щёточных изделий
(200+ наименований), розничные и оптовые заказы, страница для партнёров.

Стек: Next.js (App Router), TypeScript, Tailwind CSS 4.

## Разработка

```bash
npm run dev
```

Открыть [http://localhost:3000](http://localhost:3000).

## Данные каталога

Товары хранятся в [`data/products.json`](data/products.json) — выгружены из
Ozon Seller API (название, цена, фото, категория). Категории описаны в
[`lib/categories.ts`](lib/categories.ts).

Чтобы обновить каталог из Ozon Seller API повторно, понадобятся `Client-Id`
и `Api-Key` из личного кабинета (Настройки → Seller API → Сгенерировать
ключ), а затем запросы к `v3/product/list` и `v3/product/info/list`.

## Деплой

Проект развёрнут на Vercel и автоматически обновляется при пуше в `main`.
