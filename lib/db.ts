import { neon } from "@neondatabase/serverless";

export const sql = neon(process.env.DATABASE_URL!);

export type ReservationRow = {
  article: string;
  quantity: number;
};

/**
 * Atomically sets this user's reservation for `article` to exactly
 * `quantityUnits` (in stock units, not packages), but only if doing so does
 * not exceed the product's stock once other users' active reservations
 * are accounted for. A single CTE + FOR UPDATE statement — the row lock on
 * `products` is held for the statement's duration, so a concurrent request
 * for the same article cannot both succeed past the stock limit.
 *
 * Only touches a NOT-yet-confirmed (still-in-cart) reservation row — once a
 * reservation has been confirmed as part of a submitted order, cart edits
 * must not silently overwrite it (the user would need to wait for that
 * order to resolve before reserving the same article again).
 */
export async function trySetReservation(
  article: string,
  userId: number,
  quantityUnits: number
): Promise<boolean> {
  const rows = await sql`
    WITH lock AS (
      SELECT stock FROM products WHERE article = ${article} FOR UPDATE
    ),
    active AS (
      SELECT COALESCE(SUM(quantity), 0) AS q FROM reservations
      WHERE article = ${article}
        AND user_id <> ${userId}
        AND expires_at > now()
    )
    INSERT INTO reservations (user_id, article, quantity, expires_at)
    SELECT ${userId}, ${article}, ${quantityUnits}, now() + interval '30 minutes'
    FROM lock, active
    WHERE lock.stock - active.q >= ${quantityUnits}
    ON CONFLICT (user_id, article)
      DO UPDATE SET quantity = ${quantityUnits}, expires_at = now() + interval '30 minutes'
      WHERE NOT reservations.confirmed
    RETURNING quantity
  `;
  return rows.length > 0;
}

/** True if this user already has this article tied up in a submitted (unpaid) order. */
export async function hasConfirmedReservation(article: string, userId: number): Promise<boolean> {
  const rows = await sql`
    SELECT 1 FROM reservations
    WHERE article = ${article} AND user_id = ${userId} AND confirmed AND expires_at > now()
  `;
  return rows.length > 0;
}

export async function deleteReservation(article: string, userId: number): Promise<void> {
  await sql`DELETE FROM reservations WHERE article = ${article} AND user_id = ${userId} AND NOT confirmed`;
}

/** Stock reserved by OTHER users — still-active cart holds or unpaid confirmed orders. */
export async function getReservedByOthers(article: string, userId: number): Promise<number> {
  const rows = await sql`
    SELECT COALESCE(SUM(quantity), 0) AS q FROM reservations
    WHERE article = ${article}
      AND user_id <> ${userId}
      AND expires_at > now()
  `;
  return Number(rows[0]?.q ?? 0);
}

export async function getStock(article: string): Promise<number | null> {
  const rows = await sql`SELECT stock FROM products WHERE article = ${article}`;
  if (!rows.length) return null;
  return Number(rows[0].stock);
}

/** This user's current shopping cart — reservations not yet submitted as an order. */
export async function getUserReservations(userId: number): Promise<ReservationRow[]> {
  const rows = await sql`
    SELECT article, quantity FROM reservations
    WHERE user_id = ${userId} AND NOT confirmed AND expires_at > now()
    ORDER BY id ASC
  `;
  return rows.map((r) => ({ article: r.article as string, quantity: Number(r.quantity) }));
}

/**
 * Confirms all of this user's active cart reservations as part of a
 * submitted order: marks them `confirmed` (excludes them from the cart
 * view) and pushes their expiry out to the payment deadline — after that,
 * if still unpaid, they lazily stop blocking stock like any other expired
 * reservation, no cron required.
 */
export async function confirmUserReservations(
  userId: number,
  paymentDueAt: Date
): Promise<ReservationRow[]> {
  const rows = await sql`
    UPDATE reservations
    SET confirmed = true, expires_at = ${paymentDueAt.toISOString()}
    WHERE user_id = ${userId} AND NOT confirmed AND expires_at > now()
    RETURNING article, quantity
  `;
  return rows.map((r) => ({ article: r.article as string, quantity: Number(r.quantity) }));
}

export type NewOrder = {
  userId: number;
  name: string;
  phone: string;
  email: string | null;
  comment: string | null;
  buyerType: string;
  items: unknown;
  discountPercent: number;
  total: number;
  paymentDueAt: Date;
};

export async function insertOrder(order: NewOrder): Promise<number> {
  const rows = await sql`
    INSERT INTO orders (
      user_id, name, phone, email, comment, buyer_type, items, discount_percent, total,
      status, payment_due_at
    )
    VALUES (
      ${order.userId}, ${order.name}, ${order.phone}, ${order.email}, ${order.comment},
      ${order.buyerType}, ${JSON.stringify(order.items)}, ${order.discountPercent}, ${order.total},
      'reserved', ${order.paymentDueAt.toISOString()}
    )
    RETURNING id
  `;
  return Number(rows[0].id);
}

export type OrderItemRow = {
  article: string;
  name: string;
  packages: number;
  unitPrice: number;
  lineTotal: number;
  sellerId: number | null;
};

export type OrderRow = {
  id: number;
  userId: number;
  items: OrderItemRow[];
  discountPercent: number;
  total: number;
  status: string;
  paymentDueAt: string | null;
  createdAt: string;
};

function mapOrderRow(r: Record<string, unknown>): OrderRow {
  return {
    id: Number(r.id),
    userId: Number(r.user_id),
    items: (r.items as OrderItemRow[]) ?? [],
    discountPercent: Number(r.discount_percent),
    total: Number(r.total),
    status: r.status as string,
    paymentDueAt: r.payment_due_at as string | null,
    createdAt: r.created_at as string,
  };
}

export async function getUserOrders(userId: number): Promise<OrderRow[]> {
  const rows = await sql`
    SELECT id, user_id, items, discount_percent, total, status, payment_due_at, created_at
    FROM orders WHERE user_id = ${userId} ORDER BY created_at DESC
  `;
  return rows.map(mapOrderRow);
}

export async function getOrderById(id: number): Promise<OrderRow | null> {
  const rows = await sql`
    SELECT id, user_id, items, discount_percent, total, status, payment_due_at, created_at
    FROM orders WHERE id = ${id}
  `;
  return rows[0] ? mapOrderRow(rows[0]) : null;
}

/**
 * Номер счёта на оплату для пары (заказ, продавец) — закрепляется один раз
 * и не меняется при повторных скачиваниях. Нумерация своя для каждого
 * юрлица (не общий счётчик на все заказы): счётчик в `seller_invoice_counters`
 * инкрементируется атомарно через ON CONFLICT DO UPDATE, что при
 * конкуренции сериализуется блокировкой строки — гонка возможна только
 * между двумя ПЕРВЫМИ запросами счёта для одной и той же пары (заказ,
 * продавец) одновременно и в худшем случае оставляет безобидный пропуск в
 * нумерации, а не дублирование номера.
 */
export async function getOrAssignInvoiceNumber(orderId: number, sellerId: number): Promise<number> {
  const existing = await sql`
    SELECT invoice_number FROM invoices WHERE order_id = ${orderId} AND seller_id = ${sellerId}
  `;
  if (existing.length) return Number(existing[0].invoice_number);

  const rows = await sql`
    WITH bump AS (
      INSERT INTO seller_invoice_counters (seller_id, last_number)
      VALUES (${sellerId}, 1)
      ON CONFLICT (seller_id) DO UPDATE SET last_number = seller_invoice_counters.last_number + 1
      RETURNING last_number
    )
    INSERT INTO invoices (order_id, seller_id, invoice_number)
    SELECT ${orderId}, ${sellerId}, last_number FROM bump
    ON CONFLICT (order_id, seller_id) DO NOTHING
    RETURNING invoice_number
  `;
  if (rows.length) return Number(rows[0].invoice_number);

  const after = await sql`
    SELECT invoice_number FROM invoices WHERE order_id = ${orderId} AND seller_id = ${sellerId}
  `;
  return Number(after[0].invoice_number);
}
