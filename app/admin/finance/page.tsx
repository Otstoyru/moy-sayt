import { redirect } from "next/navigation";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { getSellers } from "@/lib/sellers";
import { getAccounts, getCombinedBalance, getRecentTransactions, getLoans, transactionCategoryLabel, accountKindLabel, loanDirectionLabel } from "@/lib/finance";
import AccountFormModal from "./AccountFormModal";
import TransactionForm from "./TransactionForm";
import LoanFormModal from "./LoanFormModal";
import LoanPaymentForm from "./LoanPaymentForm";

function money(n: number): string {
  return n.toLocaleString("ru-RU", { maximumFractionDigits: 0 }) + " ₽";
}

export default async function AdminFinancePage() {
  const admin = await requireRole(["administrator"]);
  if (!admin) redirect("/login?next=/admin/finance");

  const [sellers, accounts, combinedBalance, transactions, loans] = await Promise.all([
    getSellers(),
    getAccounts(),
    getCombinedBalance(),
    getRecentTransactions(50),
    getLoans(),
  ]);

  const accountById = new Map(accounts.map((a) => [a.id, a]));
  const sellerById = new Map(sellers.map((s) => [s.id, s]));

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold">Финансы</h1>
        <div className="flex items-center gap-4">
          <Link href="/admin/suppliers" className="text-sm font-medium text-brand hover:underline">
            Поставщики →
          </Link>
          <Link href="/admin/orders" className="text-sm font-medium text-brand hover:underline">
            Заказы →
          </Link>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-border bg-surface p-5">
        <p className="text-sm text-muted">Совместный баланс (все юрлица)</p>
        <p className="mt-1 text-3xl font-semibold">{money(combinedBalance)}</p>
      </div>

      <h2 className="mt-10 font-display text-xl font-semibold">Счета и кассы по юрлицам</h2>
      <div className="mt-4 flex flex-col gap-4">
        {sellers.map((seller) => {
          const sellerAccounts = accounts.filter((a) => a.sellerId === seller.id);
          const sellerBalance = sellerAccounts.reduce((sum, a) => sum + a.balance, 0);
          return (
            <div key={seller.id} className="rounded-xl border border-border bg-surface p-4">
              <div className="flex items-center justify-between">
                <p className="font-medium">
                  {seller.shortName} <span className="text-sm font-normal text-muted">— {money(sellerBalance)}</span>
                </p>
                <AccountFormModal sellerId={seller.id} />
              </div>
              {sellerAccounts.length === 0 ? (
                <p className="mt-2 text-sm text-muted">Счетов пока нет.</p>
              ) : (
                <ul className="mt-2 space-y-1 text-sm">
                  {sellerAccounts.map((a) => (
                    <li key={a.id} className="flex items-center justify-between">
                      <span className={a.isActive ? "" : "text-muted line-through"}>
                        {a.name} <span className="text-xs text-muted">({accountKindLabel(a.kind)})</span>
                      </span>
                      <span className="font-medium">{money(a.balance)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      <h2 className="mt-10 font-display text-xl font-semibold">Новая проводка</h2>
      <TransactionForm accounts={accounts.map((a) => ({ id: a.id, label: `${sellerById.get(a.sellerId)?.shortName ?? ""} — ${a.name}` }))} />

      <h2 className="mt-10 font-display text-xl font-semibold">Последние проводки</h2>
      {transactions.length === 0 ? (
        <p className="mt-4 text-sm text-muted">Проводок пока нет.</p>
      ) : (
        <div className="mt-4 divide-y divide-border rounded-xl border border-border bg-surface">
          {transactions.map((t) => {
            const account = accountById.get(t.accountId);
            const seller = account ? sellerById.get(account.sellerId) : undefined;
            return (
              <div key={t.id} className="flex items-center justify-between gap-3 p-3 text-sm">
                <div>
                  <p>
                    {transactionCategoryLabel(t.category)}
                    {t.description ? ` — ${t.description}` : ""}
                  </p>
                  <p className="text-xs text-muted">
                    {seller?.shortName ?? ""} — {account?.name ?? "?"} ·{" "}
                    {new Date(t.occurredAt).toLocaleDateString("ru-RU")}
                  </p>
                </div>
                <span className={`font-medium ${t.amount >= 0 ? "text-green-700" : "text-red-600"}`}>
                  {t.amount >= 0 ? "+" : ""}
                  {money(t.amount)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <h2 className="mt-10 font-display text-xl font-semibold">Займы</h2>
      <LoanFormModal
        sellers={sellers.map((s) => ({ id: s.id, name: s.shortName }))}
        accounts={accounts.map((a) => ({ id: a.id, sellerId: a.sellerId, label: `${sellerById.get(a.sellerId)?.shortName ?? ""} — ${a.name}` }))}
      />
      {loans.length === 0 ? (
        <p className="mt-4 text-sm text-muted">Займов пока нет.</p>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {loans.map((loan) => (
            <div key={loan.id} className="rounded-xl border border-border bg-surface p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">
                  {sellerById.get(loan.sellerId)?.shortName} — {loan.counterparty}{" "}
                  <span className="text-xs font-normal text-muted">({loanDirectionLabel(loan.direction)})</span>
                </p>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${loan.isClosed ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                  {loan.isClosed ? "Закрыт" : "Действует"}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted">
                Сумма: {money(loan.principal)} · Остаток: {money(loan.remaining)}
                {loan.interestRate ? ` · ${loan.interestRate}% годовых` : " · без процентов"}
              </p>
              <p className="text-xs text-muted">
                С {new Date(loan.startedAt).toLocaleDateString("ru-RU")}
                {loan.dueAt ? ` до ${new Date(loan.dueAt).toLocaleDateString("ru-RU")}` : ""}
              </p>
              {!loan.isClosed && (
                <LoanPaymentForm
                  loanId={loan.id}
                  accounts={accounts
                    .filter((a) => a.sellerId === loan.sellerId)
                    .map((a) => ({ id: a.id, name: a.name }))}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
