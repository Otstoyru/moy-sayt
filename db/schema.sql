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

CREATE TABLE IF NOT EXISTS products (
  article TEXT PRIMARY KEY,
  stock         INTEGER NOT NULL,
  name          TEXT,
  product_type  TEXT,
  images        JSONB,
  package_size  INTEGER,
  min_price     NUMERIC,
  category_slug TEXT REFERENCES categories(slug)
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
  created_at TIMESTAMPTZ DEFAULT now()
);
