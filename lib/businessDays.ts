// Официальные нерабочие праздничные дни РФ. Базовый ежегодный набор без
// учёта переносов выходных (публикуется отдельным постановлением каждый
// год) — требует ручного обновления при появлении официального
// производственного календаря на следующий год.
const RU_HOLIDAYS: Record<number, string[]> = {
  2026: [
    "2026-01-01", "2026-01-02", "2026-01-03", "2026-01-06", "2026-01-07", "2026-01-08",
    "2026-02-23",
    "2026-03-08",
    "2026-05-01", "2026-05-09",
    "2026-06-12",
    "2026-11-04",
  ],
};

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function isBusinessDay(d: Date): boolean {
  const day = d.getUTCDay();
  if (day === 0 || day === 6) return false;
  const holidays = RU_HOLIDAYS[d.getUTCFullYear()];
  if (holidays && holidays.includes(dateKey(d))) return false;
  return true;
}

/**
 * Дедлайн оплаты резерва: следующий рабочий день, то же время (сутки,
 * но с учётом рабочих дней — если резерв оформлен в пятницу вечером,
 * дедлайн — понедельник в то же время).
 */
export function nextBusinessDayDeadline(from: Date): Date {
  const d = new Date(from);
  d.setUTCDate(d.getUTCDate() + 1);
  while (!isBusinessDay(d)) {
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return d;
}
