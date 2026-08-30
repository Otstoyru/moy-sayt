import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const ARTICLE = "TEST/RACE";
const STOCK = 5;

async function trySetReservation(article, sessionId, quantityUnits) {
  const rows = await sql`
    WITH lock AS (
      SELECT stock FROM products WHERE article = ${article} FOR UPDATE
    ),
    active AS (
      SELECT COALESCE(SUM(quantity), 0) AS q FROM reservations
      WHERE article = ${article}
        AND session_id <> ${sessionId}
        AND (confirmed OR expires_at > now())
    )
    INSERT INTO reservations (session_id, article, quantity, expires_at)
    SELECT ${sessionId}, ${article}, ${quantityUnits}, now() + interval '30 minutes'
    FROM lock, active
    WHERE lock.stock - active.q >= ${quantityUnits}
    ON CONFLICT (session_id, article)
      DO UPDATE SET quantity = ${quantityUnits}, expires_at = now() + interval '30 minutes'
    RETURNING quantity
  `;
  return rows.length > 0;
}

async function main() {
  await sql`DELETE FROM reservations WHERE article = ${ARTICLE}`;
  await sql`DELETE FROM products WHERE article = ${ARTICLE}`;
  await sql`INSERT INTO products (article, stock) VALUES (${ARTICLE}, ${STOCK})`;

  const sessions = ["race-a", "race-b", "race-c"];
  const results = await Promise.all(
    sessions.map((s) => trySetReservation(ARTICLE, s, 3))
  );

  const succeeded = sessions.filter((_, i) => results[i]);
  const rows = await sql`SELECT session_id, quantity FROM reservations WHERE article = ${ARTICLE}`;
  const totalReserved = rows.reduce((sum, r) => sum + Number(r.quantity), 0);

  console.log("Requests: 3 sessions x 3 units each (9 requested, stock =", STOCK, ")");
  console.log("Succeeded sessions:", succeeded);
  console.log("Reservation rows:", rows);
  console.log("Total reserved:", totalReserved);

  if (totalReserved > STOCK) {
    console.error("OVERBOOKING DETECTED — total reserved exceeds stock!");
    process.exitCode = 1;
  } else if (succeeded.length === sessions.length) {
    console.error("Expected at least one rejection, but all succeeded — test invalid");
    process.exitCode = 1;
  } else {
    console.log("PASS: no overbooking, at least one request correctly rejected.");
  }

  await sql`DELETE FROM reservations WHERE article = ${ARTICLE}`;
  await sql`DELETE FROM products WHERE article = ${ARTICLE}`;
}

main();
