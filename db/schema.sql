CREATE TABLE IF NOT EXISTS products (
  article TEXT PRIMARY KEY,
  stock   INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS reservations (
  id          SERIAL PRIMARY KEY,
  session_id  TEXT NOT NULL,
  article     TEXT NOT NULL REFERENCES products(article),
  quantity    INTEGER NOT NULL,
  confirmed   BOOLEAN NOT NULL DEFAULT false,
  expires_at  TIMESTAMPTZ NOT NULL,
  UNIQUE (session_id, article)
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  session_id TEXT,
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
