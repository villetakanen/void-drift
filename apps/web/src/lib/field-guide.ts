import { getCollection } from "astro:content";

export async function articles() {
  const entries = await getCollection("fieldGuide");
  const slugs = new Map<string, string>();
  for (const entry of entries) {
    const previous = slugs.get(entry.data.slug);
    if (previous)
      throw new Error(
        `Duplicate Field Guide slug "${entry.data.slug}" in ${previous} and ${entry.id}`,
      );
    slugs.set(entry.data.slug, entry.id);
  }
  return entries.sort((a, b) => a.data.title.localeCompare(b.data.title));
}
