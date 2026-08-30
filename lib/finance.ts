import { sql } from "@/lib/db";

export { ACCOUNT_KINDS, accountKindLabel, TRANSACTION_CATEGORIES, transactionCategoryLabel, LOAN_DIRECTIONS, loanDirectionLabel } from "@/lib/financeCategories";

export type FinancialAccount = {
  id: number;
  sellerId: number;
  name: string;
  kind: string;
  isActive: boolean;
  balance: number;
  createdAt: string;
};

function mapAccount(r: Record<string, unknown>): FinancialAccount {
  return {
    id: Number(r.id),
    sellerId: Number(r.seller_id),
    name: r.name as string,
    kind: r.kind as string,
    isActive: Boolean(r.is_active),
    balance: Number(r.balance ?? 0),
    createdAt: r.created_at as string,
  };
}

/** Все счета/кассы всех юрлиц с текущим балансом (сумма проводок по каждому). */
export async function getAccounts(): Promise<FinancialAccount[]> {
  const rows = await sql`
    SELECT a.*, COALESCE(SUM(t.amount), 0) AS balance
    FROM financial_accounts a
    LEFT JOIN financial_transactions t ON t.account_id = a.id
    GROUP BY a.id
    ORDER BY a.seller_id, a.name
  `;
  return rows.map(mapAccount);
}

export async function getAccountById(id: number): Promise<FinancialAccount | null> {
  const rows = await sql`
    SELECT a.*, COALESCE(SUM(t.amount), 0) AS balance
    FROM financial_accounts a
    LEFT JOIN financial_transactions t ON t.account_id = a.id
    WHERE a.id = ${id}
    GROUP BY a.id
  `;
  return rows[0] ? mapAccount(rows[0]) : null;
}

export async function createAccount(sellerId: number, name: string, kind: string): Promise<FinancialAccount> {
  const rows = await sql`
    INSERT INTO financial_accounts (seller_id, name, kind) VALUES (${sellerId}, ${name}, ${kind}) RETURNING *
  `;
  return mapAccount({ ...rows[0], balance: 0 });
}

/** Раздельный баланс — сумма по всем счетам одного юрлица. */
export async function getSellerBalance(sellerId: number): Promise<number> {
  const rows = await sql`
    SELECT COALESCE(SUM(t.amount), 0) AS balance
    FROM financial_accounts a
    LEFT JOIN financial_transactions t ON t.account_id = a.id
    WHERE a.seller_id = ${sellerId}
  `;
  return Number(rows[0].balance);
}

/** Совместный баланс — сумма по всем юрлицам сразу. */
export async function getCombinedBalance(): Promise<number> {
  const rows = await sql`SELECT COALESCE(SUM(amount), 0) AS balance FROM financial_transactions`;
  return Number(rows[0].balance);
}

export type FinancialTransaction = {
  id: number;
  accountId: number;
  amount: number;
  category: string;
  description: string | null;
  orderId: number | null;
  loanId: number | null;
  supplierId: number | null;
  occurredAt: string;
  createdAt: string;
};

function mapTransaction(r: Record<string, unknown>): FinancialTransaction {
  return {
    id: Number(r.id),
    accountId: Number(r.account_id),
    amount: Number(r.amount),
    category: r.category as string,
    description: (r.description as string) ?? null,
    orderId: r.order_id === null ? null : Number(r.order_id),
    loanId: r.loan_id === null ? null : Number(r.loan_id),
    supplierId: r.supplier_id === null || r.supplier_id === undefined ? null : Number(r.supplier_id),
    occurredAt: r.occurred_at as string,
    createdAt: r.created_at as string,
  };
}

export type NewTransaction = {
  accountId: number;
  amount: number;
  category: string;
  description: string | null;
  orderId?: number | null;
  loanId?: number | null;
  supplierId?: number | null;
  createdBy: number;
  occurredAt?: string;
};

export async function createTransaction(input: NewTransaction): Promise<FinancialTransaction> {
  const rows = await sql`
    INSERT INTO financial_transactions (account_id, amount, category, description, order_id, loan_id, supplier_id, created_by, occurred_at)
    VALUES (
      ${input.accountId}, ${input.amount}, ${input.category}, ${input.description},
      ${input.orderId ?? null}, ${input.loanId ?? null}, ${input.supplierId ?? null}, ${input.createdBy},
      ${input.occurredAt ?? new Date().toISOString().slice(0, 10)}
    )
    RETURNING *
  `;
  return mapTransaction(rows[0]);
}

export async function getRecentTransactions(limit = 50): Promise<FinancialTransaction[]> {
  const rows = await sql`
    SELECT * FROM financial_transactions ORDER BY occurred_at DESC, id DESC LIMIT ${limit}
  `;
  return rows.map(mapTransaction);
}

/** Не позволяет задвоить проводку дохода, если "Отметить продано" вызвали повторно. */
export async function hasSaleTransactionForOrder(orderId: number): Promise<boolean> {
  const rows = await sql`SELECT 1 FROM financial_transactions WHERE order_id = ${orderId} AND category = 'sale' LIMIT 1`;
  return rows.length > 0;
}

export async function getTransactionsByAccount(accountId: number, limit = 50): Promise<FinancialTransaction[]> {
  const rows = await sql`
    SELECT * FROM financial_transactions WHERE account_id = ${accountId}
    ORDER BY occurred_at DESC, id DESC LIMIT ${limit}
  `;
  return rows.map(mapTransaction);
}

export type Loan = {
  id: number;
  sellerId: number;
  direction: string;
  counterparty: string;
  principal: number;
  interestRate: number | null;
  startedAt: string;
  dueAt: string | null;
  isClosed: boolean;
  remaining: number;
  createdAt: string;
};

function mapLoan(r: Record<string, unknown>): Loan {
  return {
    id: Number(r.id),
    sellerId: Number(r.seller_id),
    direction: r.direction as string,
    counterparty: r.counterparty as string,
    principal: Number(r.principal),
    interestRate: r.interest_rate === null ? null : Number(r.interest_rate),
    startedAt: r.started_at as string,
    dueAt: (r.due_at as string) ?? null,
    isClosed: Boolean(r.is_closed),
    remaining: Number(r.remaining ?? r.principal),
    createdAt: r.created_at as string,
  };
}

export async function getLoans(): Promise<Loan[]> {
  const rows = await sql`
    SELECT l.*, l.principal - COALESCE((
      SELECT SUM(ABS(t.amount)) FROM financial_transactions t
      WHERE t.loan_id = l.id AND t.category = 'loan_repayment'
    ), 0) AS remaining
    FROM loans l
    ORDER BY l.is_closed, l.started_at DESC
  `;
  return rows.map(mapLoan);
}

export async function getLoanById(id: number): Promise<Loan | null> {
  const rows = await sql`
    SELECT l.*, l.principal - COALESCE((
      SELECT SUM(ABS(t.amount)) FROM financial_transactions t
      WHERE t.loan_id = l.id AND t.category = 'loan_repayment'
    ), 0) AS remaining
    FROM loans l
    WHERE l.id = ${id}
  `;
  return rows[0] ? mapLoan(rows[0]) : null;
}

export type NewLoan = {
  sellerId: number;
  direction: "borrowed" | "lent";
  counterparty: string;
  principal: number;
  interestRate: number | null;
  startedAt: string;
  dueAt: string | null;
  accountId: number;
  createdBy: number;
};

/** Создаёт займ и сразу проводку выдачи/получения по выбранному счёту. */
export async function createLoan(input: NewLoan): Promise<Loan> {
  const rows = await sql`
    INSERT INTO loans (seller_id, direction, counterparty, principal, interest_rate, started_at, due_at)
    VALUES (${input.sellerId}, ${input.direction}, ${input.counterparty}, ${input.principal}, ${input.interestRate}, ${input.startedAt}, ${input.dueAt})
    RETURNING *
  `;
  const loan = rows[0];

  await createTransaction({
    accountId: input.accountId,
    amount: input.direction === "borrowed" ? input.principal : -input.principal,
    category: input.direction === "borrowed" ? "loan_received" : "loan_given",
    description: `Займ: ${input.counterparty}`,
    loanId: Number(loan.id),
    createdBy: input.createdBy,
    occurredAt: input.startedAt,
  });

  return { ...mapLoan(loan), remaining: input.principal };
}

/**
 * Записывает погашение основного долга или уплату/получение процентов по
 * займу — обычной проводкой на счёт со знаком, зависящим от направления
 * займа (мы платим — расход, нам платят — доход). `amount` всегда
 * положительное число ("сколько погасили/сколько процентов").
 */
export async function recordLoanPayment(
  loanId: number,
  accountId: number,
  amount: number,
  kind: "repayment" | "interest",
  occurredAt: string,
  createdBy: number
): Promise<void> {
  const loan = await getLoanById(loanId);
  if (!loan) throw new Error("Займ не найден");

  const sign = loan.direction === "borrowed" ? -1 : 1;
  await createTransaction({
    accountId,
    amount: sign * amount,
    category: kind === "repayment" ? "loan_repayment" : "loan_interest",
    description: `${kind === "repayment" ? "Погашение" : "Проценты"} по займу: ${loan.counterparty}`,
    loanId,
    createdBy,
    occurredAt,
  });
}
