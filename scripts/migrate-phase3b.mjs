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
    "sellers.vat_rate",
    // NULL/0 = не облагается НДС (УСН/НПД); иначе — ставка в процентах (например, 20 или 22)
    `ALTER TABLE sellers ADD COLUMN IF NOT EXISTS vat_rate NUMERIC`
  );
  console.log("Migration done.");
}

main();
