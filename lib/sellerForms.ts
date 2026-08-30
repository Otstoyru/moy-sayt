// Клиент-безопасный модуль: НЕ импортирует lib/db (иначе попытка подключения
// к базе данных попадает в браузерный бандл и падает с "No database
// connection string was provided to `neon()`", т.к. переменные окружения
// сервера не видны клиенту).
export const SELLER_LEGAL_FORMS = [
  { value: "ooo", label: "ООО" },
  { value: "ip", label: "ИП" },
  { value: "self_employed", label: "Самозанятый" },
] as const;

export function sellerLegalFormLabel(value: string): string {
  return SELLER_LEGAL_FORMS.find((f) => f.value === value)?.label ?? value;
}
