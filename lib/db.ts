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
  /** Внутренняя отметка бухгалтера — не влияет на статус/склад/УПД. */
  processed: boolean;
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
    processed: Boolean(r.processed),
    createdAt: r.created_at as string,
  };
}

export async function getUserOrders(userId: number): Promise<OrderRow[]> {
  const rows = await sql`
    SELECT id, user_id, items, discount_percent, total, status, payment_due_at, processed, created_at
    FROM orders WHERE user_id = ${userId} ORDER BY created_at DESC
  `;
  return rows.map(mapOrderRow);
}

export async function getOrderById(id: number): Promise<OrderRow | null> {
  const rows = await sql`
    SELECT id, user_id, items, discount_percent, total, status, payment_due_at, processed, created_at
    FROM orders WHERE id = ${id}
  `;
  return rows[0] ? mapOrderRow(rows[0]) : null;
}

export async function setOrderProcessed(orderId: number, processed: boolean): Promise<void> {
  await sql`UPDATE orders SET processed = ${processed} WHERE id = ${orderId}`;
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

/**
 * Номер УПД для пары (заказ, продавец) — в отличие от счёта на оплату это
 * документ строгой отчётности со своей отдельной последовательностью на
 * каждое юрлицо. На практике вызывается один раз, в момент отметки заказа
 * проданным (см. `markOrderSold`) — здесь же не эагерно, а идемпотентно,
 * чтобы повторное обращение (например, скачивание уже выданного УПД)
 * никогда не создавало новый номер.
 */
export async function getOrAssignUpdNumber(orderId: number, sellerId: number): Promise<number> {
  const existing = await sql`
    SELECT upd_number FROM upd_documents WHERE order_id = ${orderId} AND seller_id = ${sellerId}
  `;
  if (existing.length) return Number(existing[0].upd_number);

  const rows = await sql`
    WITH bump AS (
      INSERT INTO seller_upd_counters (seller_id, last_number)
      VALUES (${sellerId}, 1)
      ON CONFLICT (seller_id) DO UPDATE SET last_number = seller_upd_counters.last_number + 1
      RETURNING last_number
    )
    INSERT INTO upd_documents (order_id, seller_id, upd_number)
    SELECT ${orderId}, ${sellerId}, last_number FROM bump
    ON CONFLICT (order_id, seller_id) DO NOTHING
    RETURNING upd_number
  `;
  if (rows.length) return Number(rows[0].upd_number);

  const after = await sql`
    SELECT upd_number FROM upd_documents WHERE order_id = ${orderId} AND seller_id = ${sellerId}
  `;
  return Number(after[0].upd_number);
}

export async function getAllOrders(): Promise<OrderRow[]> {
  const rows = await sql`
    SELECT id, user_id, items, discount_percent, total, status, payment_due_at, processed, created_at
    FROM orders ORDER BY created_at DESC
  `;
  return rows.map(mapOrderRow);
}

/**
 * Отмечает заказ проданным (внесена оплата) и в тот же момент закрепляет
 * номер УПД за каждым юрлицом, представленным в заказе — так нумерация
 * строгого документа привязана к реальному событию продажи, а не к
 * произвольному моменту первого скачивания PDF. Идемпотентна: повторный
 * вызов для уже проданного заказа не меняет ни статус, ни номера УПД.
 */
export async function markOrderSold(orderId: number): Promise<OrderRow | null> {
  await sql`UPDATE orders SET status = 'sold' WHERE id = ${orderId} AND status <> 'cancelled'`;
  const order = await getOrderById(orderId);
  if (!order) return null;

  const sellerIds = [...new Set(order.items.map((i) => i.sellerId).filter((v): v is number => v !== null))];
  for (const sellerId of sellerIds) {
    await getOrAssignUpdNumber(order.id, sellerId);
  }
  return order;
}

/** Юрлица не имеют отношения к покупателям, покупавшим хоть что-то проданное — для выбора в форме возврата. */
export async function getBuyersWithSoldOrders(): Promise<{ id: number; name: string; email: string }[]> {
  const rows = await sql`
    SELECT DISTINCT u.id, u.name, u.email FROM users u
    JOIN orders o ON o.user_id = u.id
    WHERE o.status = 'sold'
    ORDER BY u.name
  `;
  return rows.map((r) => ({ id: Number(r.id), name: r.name as string, email: r.email as string }));
}

async function getPurchasedQuantity(userId: number, article: string): Promise<number> {
  const rows = await sql`
    SELECT COALESCE(SUM((item->>'packages')::int), 0) AS total
    FROM orders, jsonb_array_elements(items) AS item
    WHERE orders.user_id = ${userId} AND orders.status = 'sold' AND item->>'article' = ${article}
  `;
  return Number(rows[0].total);
}

async function getReturnedQuantity(userId: number, article: string): Promise<number> {
  const rows = await sql`
    SELECT COALESCE(SUM(quantity), 0) AS total FROM returns WHERE user_id = ${userId} AND article = ${article}
  `;
  return Number(rows[0].total);
}

export type ReturnRow = {
  id: number;
  userId: number;
  article: string;
  quantity: number;
  buyerDocumentNumber: string;
  buyerDocumentDate: string | null;
  createdAt: string;
};

export async function getAllReturns(): Promise<ReturnRow[]> {
  const rows = await sql`
    SELECT id, user_id, article, quantity, buyer_document_number, buyer_document_date, created_at
    FROM returns ORDER BY created_at DESC
  `;
  return rows.map((r) => ({
    id: Number(r.id),
    userId: Number(r.user_id),
    article: r.article as string,
    quantity: Number(r.quantity),
    buyerDocumentNumber: r.buyer_document_number as string,
    buyerDocumentDate: r.buyer_document_date as string | null,
    createdAt: r.created_at as string,
  }));
}

export type NewReturn = {
  userId: number;
  article: string;
  quantity: number;
  buyerDocumentNumber: string;
  buyerDocumentDate: string | null;
  createdBy: number;
};

/**
 * Записывает возврат от покупателя и приходует товар на склад. Покупатель
 * в этой операции выступает "поставщиком" — номер документа его
 * собственный, не из нашего счётчика. Атомарно проверяет, что запрошенное
 * количество не превышает то, что этот покупатель когда-либо купил по
 * проданным заказам минус то, что уже было им возвращено ранее — иначе
 * можно "вернуть" товар, которого не покупали, или вернуть больше, чем
 * купили.
 */
export async function recordReturn(input: NewReturn): Promise<{ ok: true } | { ok: false; error: string }> {
  const rows = await sql`
    WITH purchased AS (
      SELECT COALESCE(SUM((item->>'packages')::int), 0) AS total
      FROM orders, jsonb_array_elements(items) AS item
      WHERE orders.user_id = ${input.userId} AND orders.status = 'sold' AND item->>'article' = ${input.article}
    ),
    returned AS (
      SELECT COALESCE(SUM(quantity), 0) AS total FROM returns WHERE user_id = ${input.userId} AND article = ${input.article}
    )
    INSERT INTO returns (user_id, article, quantity, buyer_document_number, buyer_document_date, created_by)
    SELECT ${input.userId}, ${input.article}, ${input.quantity}, ${input.buyerDocumentNumber}, ${input.buyerDocumentDate}, ${input.createdBy}
    FROM purchased, returned
    WHERE purchased.total - returned.total >= ${input.quantity}
    RETURNING id
  `;

  if (!rows.length) {
    const purchased = await getPurchasedQuantity(input.userId, input.article);
    const returned = await getReturnedQuantity(input.userId, input.article);
    return {
      ok: false,
      error: `Куплено (проданных заказов) ${purchased} шт, уже возвращено ${returned} шт — доступно к возврату ${Math.max(0, purchased - returned)} шт, запрошено ${input.quantity}.`,
    };
  }

  await sql`UPDATE products SET stock = stock + ${input.quantity} WHERE article = ${input.article}`;
  return { ok: true };
}
