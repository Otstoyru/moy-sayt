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
  await run(
    "CREATE TABLE sellers",
    `CREATE TABLE IF NOT EXISTS sellers (
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
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`
  );

  await run(
    "products.seller_id",
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS seller_id INTEGER REFERENCES sellers(id)`
  );

  // Сеем реальное ООО из уже известных реквизитов (lib/company.ts) — банковские
  // поля оставляем пустыми, администратор дозаполнит их через панель
  // /admin/sellers. Остальные юрлица (ИП, самозанятый) заводятся тем же путём,
  // когда появятся товары/услуги от их имени.
  const existing = await sql`SELECT id FROM sellers WHERE inn = '5038162730'`;
  let sellerId;
  if (existing.length) {
    sellerId = existing[0].id;
    console.log("SKIP (already seeded): ООО «ПО РУСКИСТЬ»");
  } else {
    const rows = await sql`
      INSERT INTO sellers (legal_form, full_name, short_name, inn, kpp, ogrn, legal_address, phone, email)
      VALUES (
        'ooo',
        'Общество с ограниченной ответственностью «Производственное объединение Рускисть»',
        'ООО «ПО РУСКИСТЬ»',
        '5038162730', '503801001', '1225000021542',
        '141207, Московская обл., г. Пушкино, ул. Учинская, д. 16, офис 4, этаж 2',
        '+7 926 222-22-77', 'info@ruskist.ru'
      )
      RETURNING id
    `;
    sellerId = rows[0].id;
    console.log("OK: seeded ООО «ПО РУСКИСТЬ» as seller", sellerId);
  }

  const updated = await sql`UPDATE products SET seller_id = ${sellerId} WHERE seller_id IS NULL RETURNING article`;
  console.log(`OK: assigned ${updated.length} products to ООО «ПО РУСКИСТЬ»`);

  console.log("Migration done.");
}

main();
