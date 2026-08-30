// Сгенерировано scripts/import-excel.mjs — не редактировать руками.
export type Category = {
  slug: string;
  name: string;
  groupSlug: string;
  groupName: string;
};

export const groups = [
  { slug: "schetki", name: "Щётки" },
  { slug: "izdeliya-iz-dereva", name: "Изделия из дерева" },
];

export const categories: Category[] = [
  { slug: "dlya-gramplastinok", name: "Для грампластинок", groupSlug: "schetki", groupName: "Щётки" },
  { slug: "dlya-zhivotnyh", name: "Для животных", groupSlug: "schetki", groupName: "Щётки" },
  { slug: "dlya-kaminov", name: "Для каминов", groupSlug: "schetki", groupName: "Щётки" },
  { slug: "dlya-konditerskih-predpriyatiy", name: "Для кондитерских предприятий", groupSlug: "schetki", groupName: "Щётки" },
  { slug: "dlya-suhogo-massazha", name: "Для сухого массажа", groupSlug: "schetki", groupName: "Щётки" },
  { slug: "maklovitsy", name: "Макловицы", groupSlug: "schetki", groupName: "Щётки" },
  { slug: "smetki", name: "Смётки", groupSlug: "schetki", groupName: "Щётки" },
  { slug: "spetszakaz", name: "Спецзаказ", groupSlug: "schetki", groupName: "Щётки" },
  { slug: "schetki-dlya-volos", name: "Щётки для волос", groupSlug: "schetki", groupName: "Щётки" },
  { slug: "schetki-dlya-pola", name: "Щётки для пола", groupSlug: "schetki", groupName: "Щётки" },
  { slug: "schetki-dlya-ruk", name: "Щётки для рук", groupSlug: "schetki", groupName: "Щётки" },
  { slug: "schetki-obuvnye", name: "Щётки обувные", groupSlug: "schetki", groupName: "Щётки" },
  { slug: "schetki-odezhnye", name: "Щётки одёжные", groupSlug: "schetki", groupName: "Щётки" },
  { slug: "schetki-s-ruchkoy", name: "Щётки с ручкой", groupSlug: "schetki", groupName: "Щётки" },
  { slug: "schetki-hozyaystvennye", name: "Щётки хозяйственные", groupSlug: "schetki", groupName: "Щётки" },
  { slug: "schity-podnozhnye", name: "Щиты подножные", groupSlug: "schetki", groupName: "Щётки" },
  { slug: "dlya-vannoy-komnaty", name: "Для ванной комнаты", groupSlug: "izdeliya-iz-dereva", groupName: "Изделия из дерева" },
  { slug: "dlya-interera", name: "Для интерьера", groupSlug: "izdeliya-iz-dereva", groupName: "Изделия из дерева" },
  { slug: "dlya-kuhni", name: "Для кухни", groupSlug: "izdeliya-iz-dereva", groupName: "Изделия из дерева" },
  { slug: "dlya-sada-i-ogoroda", name: "Для сада и огорода", groupSlug: "izdeliya-iz-dereva", groupName: "Изделия из дерева" },
  { slug: "dlya-tehniki", name: "Для техники", groupSlug: "izdeliya-iz-dereva", groupName: "Изделия из дерева" },
  { slug: "dlya-uhoda-za-telom", name: "Для ухода за телом", groupSlug: "izdeliya-iz-dereva", groupName: "Изделия из дерева" },
];

export function getCategory(slug: string) {
  return categories.find((c) => c.slug === slug);
}
