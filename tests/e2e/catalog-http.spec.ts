import {expect, test} from "@playwright/test";
import {getAllCategories, getAllProductTypes} from "../../lib/catalog";
import {catalogProductPath} from "../../lib/catalogLinks";

test("every category and product-family URL serves its catalog page", async ({request}) => {
  const pages = new Map(getAllCategories().map(category => [`/catalog/${category.slug}`, category.name]));
  for (const type of getAllProductTypes()) {
    const path = catalogProductPath(type.categorySlug, type.subcategorySlug, type.slug);
    if (!pages.has(path)) pages.set(path, type.name);
  }

  for (const [path, title] of pages) {
    const response = await request.get(path, {maxRedirects: 0});
    expect(response.status(), path).toBe(200);
    const html = await response.text();
    expect(html.match(/<title>([^<]+)<\/title>/u)?.[1]?.split(" | ")[0], path).toBe(title);
    expect(/<h1\b/u.test(html), path).toBe(true);
    // Next can render a not-found page after the 200 response has started streaming.
    expect(/<meta name="robots" content="noindex/u.test(html), path).toBe(false);
  }
});
