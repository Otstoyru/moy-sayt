import { sql } from "@/lib/db";

export type Category = {
  slug: string;
  name: string;
  groupSlug: string;
  groupName: string;
};

export type Group = {
  slug: string;
  name: string;
};

const GROUP_ORDER = ["schetki", "izdeliya-iz-dereva"];

export async function getCategories(): Promise<Category[]> {
  const rows = await sql`
    SELECT slug, name, group_slug, group_name FROM categories
    ORDER BY name
  `;
  return rows
    .map((r) => ({
      slug: r.slug as string,
      name: r.name as string,
      groupSlug: r.group_slug as string,
      groupName: r.group_name as string,
    }))
    .sort((a, b) => GROUP_ORDER.indexOf(a.groupSlug) - GROUP_ORDER.indexOf(b.groupSlug));
}

export async function getGroups(): Promise<Group[]> {
  const categories = await getCategories();
  const seen = new Map<string, Group>();
  for (const c of categories) {
    if (!seen.has(c.groupSlug)) seen.set(c.groupSlug, { slug: c.groupSlug, name: c.groupName });
  }
  return [...seen.values()];
}

export async function getCategory(slug: string): Promise<Category | undefined> {
  const categories = await getCategories();
  return categories.find((c) => c.slug === slug);
}
