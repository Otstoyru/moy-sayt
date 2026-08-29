export type Category = {
  slug: string;
  name: string;
  shortDescription: string;
};

export const categories: Category[] = [
  {
    slug: "uborka",
    name: "Для уборки дома и улицы",
    shortDescription: "Щётки, метлы и смётки для пола, двора и хозяйственных нужд",
  },
  {
    slug: "odezhda-obuv",
    name: "Для одежды и обуви",
    shortDescription: "Уход за тканью, замшей и кожей — от чистки до полировки",
  },
  {
    slug: "ruki-boroda",
    name: "Для рук, бороды и педикюра",
    shortDescription: "Щётки для маникюра, ухода за бородой и педикюрные пилки",
  },
  {
    slug: "massazh",
    name: "Массажные щётки для тела",
    shortDescription: "Щётки для сухого массажа и антицеллюлитных процедур",
  },
  {
    slug: "malyarnye-kisti",
    name: "Малярные кисти",
    shortDescription: "Кисти и макловицы для малярных и отделочных работ",
  },
  {
    slug: "dlya-zhivotnyh",
    name: "Для животных",
    shortDescription: "Щётки для груминга собак и кошек",
  },
  {
    slug: "avto",
    name: "Автомобильные",
    shortDescription: "Щётки для детейлинга и уборки салона",
  },
  {
    slug: "kuhnya",
    name: "Для кухни и сервировки",
    shortDescription: "Щётки для посуды, разделочные доски и подставки",
  },
  {
    slug: "dom-tehnika",
    name: "Аксессуары для дома и техники",
    shortDescription: "Щётки для клавиатуры, винила и мелкие аксессуары",
  },
  {
    slug: "krasota",
    name: "Красота и уход за лицом",
    shortDescription: "Скребки гуаша и аксессуары для домашних бьюти-ритуалов",
  },
];

export function getCategory(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}
