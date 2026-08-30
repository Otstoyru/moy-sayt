import { neon } from "@neondatabase/serverless";

export const sql = neon(process.env.DATABASE_URL!);

export type ReservationRow = {
  article: string;
  quantity: number;
};

/**
 * Atomically sets this session's reservation for `article` to exactly
 * `quantityUnits` (in stock units, not packages), but only if doing so does
 * not exceed the product's stock once other sessions' active reservations
 * are accounted for. A single CTE + FOR UPDATE statement — the row lock on
 * `products` is held for the statement's duration, so a concurrent request
 * for the same article cannot both succeed past the stock limit.
 */
export async function trySetReservation(
  article: string,
  sessionId: string,
  quantityUnits: number
): Promise<boolean> {
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

export async function deleteReservation(article: string, sessionId: string): Promise<void> {
  await sql`DELETE FROM reservations WHERE article = ${article} AND session_id = ${sessionId}`;
}

/** Stock reserved by OTHER sessions (confirmed, or still-active/unexpired). */
export async function getReservedByOthers(article: string, sessionId: string): Promise<number> {
  const rows = await sql`
    SELECT COALESCE(SUM(quantity), 0) AS q FROM reservations
    WHERE article = ${article}
      AND session_id <> ${sessionId}
      AND (confirmed OR expires_at > now())
  `;
  return Number(rows[0]?.q ?? 0);
}

export async function getStock(article: string): Promise<number | null> {
  const rows = await sql`SELECT stock FROM products WHERE article = ${article}`;
  if (!rows.length) return null;
  return Number(rows[0].stock);
}

/** This session's own active (non-expired or confirmed) reservations. */
export async function getSessionReservations(sessionId: string): Promise<ReservationRow[]> {
  const rows = await sql`
    SELECT article, quantity FROM reservations
    WHERE session_id = ${sessionId} AND (confirmed OR expires_at > now())
    ORDER BY id ASC
  `;
  return rows.map((r) => ({ article: r.article as string, quantity: Number(r.quantity) }));
}

/** Marks all of this session's active reservations as confirmed (they stop expiring). */
export async function confirmSessionReservations(sessionId: string): Promise<ReservationRow[]> {
  const rows = await sql`
    UPDATE reservations
    SET confirmed = true
    WHERE session_id = ${sessionId} AND expires_at > now() AND NOT confirmed
    RETURNING article, quantity
  `;
  return rows.map((r) => ({ article: r.article as string, quantity: Number(r.quantity) }));
}

export type NewOrder = {
  sessionId: string;
  name: string;
  phone: string;
  email: string | null;
  comment: string | null;
  buyerType: string;
  items: unknown;
  discountPercent: number;
  total: number;
};

export async function insertOrder(order: NewOrder): Promise<void> {
  await sql`
    INSERT INTO orders (session_id, name, phone, email, comment, buyer_type, items, discount_percent, total)
    VALUES (
      ${order.sessionId}, ${order.name}, ${order.phone}, ${order.email}, ${order.comment},
      ${order.buyerType}, ${JSON.stringify(order.items)}, ${order.discountPercent}, ${order.total}
    )
  `;
}
