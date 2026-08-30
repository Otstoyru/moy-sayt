import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

async function run(label, statement) {
  try {
    await sql.query(statement);
    console.log("OK:", label);
  } catch (err) {
    console.log("SKIP (" + err.message + "):", label);
  }
}

async function main() {
  await run("CREATE TYPE user_role", `
    CREATE TYPE user_role AS ENUM ('user', 'manager', 'administrator')
  `);

  await run("CREATE TABLE users", `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role user_role NOT NULL DEFAULT 'user',
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      org_form TEXT NOT NULL,
      legal_name TEXT NOT NULL,
      legal_address TEXT NOT NULL,
      inn TEXT NOT NULL,
      kpp TEXT,
      bank_account TEXT NOT NULL,
      bank_name TEXT NOT NULL,
      bank_bik TEXT NOT NULL,
      bank_corr_account TEXT,
      delivery_address TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  await run("CREATE TABLE user_sessions", `
    CREATE TABLE IF NOT EXISTS user_sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  await run("CREATE TABLE categories", `
    CREATE TABLE IF NOT EXISTS categories (
      slug TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      group_slug TEXT NOT NULL,
      group_name TEXT NOT NULL
    )
  `);

  await run("ALTER products ADD name", `ALTER TABLE products ADD COLUMN IF NOT EXISTS name TEXT`);
  await run("ALTER products ADD product_type", `ALTER TABLE products ADD COLUMN IF NOT EXISTS product_type TEXT`);
  await run("ALTER products ADD images", `ALTER TABLE products ADD COLUMN IF NOT EXISTS images JSONB`);
  await run("ALTER products ADD package_size", `ALTER TABLE products ADD COLUMN IF NOT EXISTS package_size INTEGER`);
  await run("ALTER products ADD min_price", `ALTER TABLE products ADD COLUMN IF NOT EXISTS min_price NUMERIC`);
  await run("ALTER products ADD category_slug", `ALTER TABLE products ADD COLUMN IF NOT EXISTS category_slug TEXT REFERENCES categories(slug)`);

  // Нет реальных заказов/резервов в проде (только тестовые, уже вычищены) —
  // безопасно пересоздать с новым ключом user_id вместо анонимного session_id.
  await run("DROP TABLE reservations", `DROP TABLE IF EXISTS reservations`);
  await run("DROP TABLE orders", `DROP TABLE IF EXISTS orders`);

  await run("CREATE TABLE reservations", `
    CREATE TABLE reservations (
      id          SERIAL PRIMARY KEY,
      user_id     INTEGER NOT NULL REFERENCES users(id),
      article     TEXT NOT NULL REFERENCES products(article),
      quantity    INTEGER NOT NULL,
      confirmed   BOOLEAN NOT NULL DEFAULT false,
      expires_at  TIMESTAMPTZ NOT NULL,
      UNIQUE (user_id, article)
    )
  `);

  await run("CREATE TABLE orders", `
    CREATE TABLE orders (
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
    )
  `);

  console.log("Migration done.");
}

main();
