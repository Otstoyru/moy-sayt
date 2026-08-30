CREATE TYPE user_role AS ENUM ('user', 'manager', 'administrator');

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'user',
  -- контактное лицо (тот, кто входит на сайт)
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  -- реквизиты для счёта на оплату — обязательны для всех при регистрации
  org_form TEXT NOT NULL,        -- 'individual' | 'self_employed' | 'ip' | 'ooo' | 'other'
  legal_name TEXT NOT NULL,      -- название организации, для ФЛ/самозанятого — ФИО
  legal_address TEXT NOT NULL,   -- юридический адрес
  inn TEXT NOT NULL,
  kpp TEXT,                      -- только для ООО, необязательно
  bank_account TEXT NOT NULL,    -- расчётный счёт
  bank_name TEXT NOT NULL,
  bank_bik TEXT NOT NULL,
  bank_corr_account TEXT,
  -- доставка не входит в цену (по умолчанию самовывоз со склада)
  delivery_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS categories (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  group_slug TEXT NOT NULL,
  group_name TEXT NOT NULL
);

-- Юрлица/ИП/самозанятые, от чьего имени продаются товары и услуги —
-- заполняется и редактируется через /admin/sellers, не хардкодится.
CREATE TABLE IF NOT EXISTS sellers (
  id SERIAL PRIMARY KEY,
  legal_form TEXT NOT NULL,        -- 'ooo' | 'ip' | 'self_employed'
  full_name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  inn TEXT NOT NULL,
  kpp TEXT,
  ogrn TEXT,
  legal_address TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  bank_account TEXT,
  bank_name TEXT,
  bank_bik TEXT,
  bank_corr_account TEXT,
  vat_rate NUMERIC,                -- ставка НДС в % (напр. 20); NULL/0 — не облагается (УСН/НПД)
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  article TEXT PRIMARY KEY,
  stock         INTEGER NOT NULL,
  name          TEXT,
  product_type  TEXT,
  images        JSONB,
  package_size  INTEGER,
  min_price     NUMERIC,
  category_slug TEXT REFERENCES categories(slug),
  seller_id     INTEGER REFERENCES sellers(id)
);

CREATE TABLE IF NOT EXISTS reservations (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id),
  article     TEXT NOT NULL REFERENCES products(article),
  quantity    INTEGER NOT NULL,
  confirmed   BOOLEAN NOT NULL DEFAULT false,
  expires_at  TIMESTAMPTZ NOT NULL,
  UNIQUE (user_id, article)
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  name TEXT,
  phone TEXT,
  email TEXT,
  comment TEXT,
  buyer_type TEXT,
  items JSONB,
  discount_percent NUMERIC,
  total NUMERIC,
  -- 'reserved' | 'paid' | 'sold' | 'expired' | 'cancelled' — paid/sold/cancelled
  -- проставляются менеджером (следующая фаза)
  status TEXT NOT NULL DEFAULT 'reserved',
  payment_due_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Сквозной счётчик номеров счёта — свой на каждое юрлицо (не общий на все
-- заказы), т.к. нумерация счетов у ООО и ИП/самозанятого не пересекается.
CREATE TABLE IF NOT EXISTS seller_invoice_counters (
  seller_id INTEGER PRIMARY KEY REFERENCES sellers(id),
  last_number INTEGER NOT NULL DEFAULT 0
);

-- Номер счёта закрепляется за парой (заказ, продавец) один раз и больше не
-- меняется — иначе повторное скачивание того же счёта показывало бы новый
-- номер при каждом обращении.
CREATE TABLE IF NOT EXISTS invoices (
  order_id INTEGER NOT NULL REFERENCES orders(id),
  seller_id INTEGER NOT NULL REFERENCES sellers(id),
  invoice_number INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (order_id, seller_id)
);
