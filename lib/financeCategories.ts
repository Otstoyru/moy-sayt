// Клиент-safe константы (без импорта lib/db) — см. lib/sellerForms.ts,
// тот же паттерн: value-импорт из файла с БД в клиентском компоненте
// протаскивает подключение к Postgres в браузерный бандл.

export const ACCOUNT_KINDS = [
  { value: "bank", label: "Банковский счёт" },
  { value: "cash", label: "Касса" },
] as const;

export function accountKindLabel(value: string): string {
  return ACCOUNT_KINDS.find((k) => k.value === value)?.label ?? value;
}

export const TRANSACTION_CATEGORIES = [
  { value: "sale", label: "Продажа" },
  { value: "purchase", label: "Закупка материалов" },
  { value: "salary", label: "Зарплата" },
  { value: "rent", label: "Аренда" },
  { value: "tax", label: "Налоги" },
  { value: "loan_received", label: "Получен займ" },
  { value: "loan_given", label: "Выдан займ" },
  { value: "loan_repayment", label: "Погашение займа" },
  { value: "loan_interest", label: "Проценты по займу" },
  { value: "transfer", label: "Перевод между своими счетами" },
  { value: "other", label: "Прочее" },
] as const;

export function transactionCategoryLabel(value: string): string {
  return TRANSACTION_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

export const LOAN_DIRECTIONS = [
  { value: "borrowed", label: "Мы взяли (кредит/займ)" },
  { value: "lent", label: "Мы дали (выдан займ)" },
] as const;

export function loanDirectionLabel(value: string): string {
  return LOAN_DIRECTIONS.find((d) => d.value === value)?.label ?? value;
}
