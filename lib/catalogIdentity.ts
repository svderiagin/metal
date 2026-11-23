import aliases from "@/data/catalog-key-aliases.json";

function resolveCatalogKey(value: string, keys: Readonly<Record<string, string>>): string {
  // Saved URLs and carts can still refer to keys from before the catalog migration.
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index++) {
    hash = Math.imul(hash ^ value.charCodeAt(index), 0x01000193);
  }
  return keys[(hash >>> 0).toString(16)] ?? value;
}

export const resolveCatalogProductId = (id: string) => resolveCatalogKey(id, aliases.ids);
export const resolveCatalogProductSlug = (slug: string) => resolveCatalogKey(slug, aliases.slugs);
