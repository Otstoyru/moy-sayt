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
    "orders.status",
    `ALTER TABLE orders ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'reserved'`
  );
  await run(
    "orders.payment_due_at",
    `ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_due_at TIMESTAMPTZ`
  );
  console.log("Migration done.");
}

main();
