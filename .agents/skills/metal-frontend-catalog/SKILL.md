---
name: metal-frontend-catalog
description: Maintain the metal-frontend catalog, product tables, cart behavior, search, and category pages in this repository. Use for code or data changes under /Users/sergei/Projects/metal-frontend; do not use for unrelated websites.
---

# Metal Frontend Catalog

Work from the repository root. Preserve the existing visual system and data model unless the user explicitly changes them.

## Start cheaply

Run these before opening large catalog files:

```bash
node .agents/skills/metal-frontend-catalog/scripts/catalog_state.mjs
git status --short
```

Use the compact state output to identify the relevant category and invariants. Search with `rg`, then read only the component, data module, and focused test for the requested area. Do not inspect `data/imported-catalog.json`, snapshots, or broad documentation unless the task actually changes imported data or the audit fails.

Follow `AGENTS.md`. When changing a Next.js API or convention, read the matching file in `node_modules/next/dist/docs/` first. Ordinary copy or catalog-data edits do not require broad Next.js documentation review.

## Catalog invariants

- The hierarchy is `Category → Subcategory → ProductType → ProductVariant`.
- `data/categories.ts` and `data/subcategories.ts` define navigation. `data/productTypes.ts` derives product types. `data/products/index.ts` is the public product boundary. `lib/catalog.ts` is the read API used by pages.
- These six protected category IDs stay first in this order: `cat-arm`, `cat-trp`, `cat-trk`, `cat-pnf`, `cat-mesh`, `cat-bal`. Owner-approved rozmet.ru content follows them; see `docs/rozmet-import.md` for its separate data files and source evidence.
- Treat `imports/protected-catalog.snapshot.json` and `scripts/catalog-pruning.test.mjs` as the regression guard. Update them only when the user explicitly requests a change to the retained catalog.
- Keep identifiers, slugs, units, prices, and cart calculations stable unless the request changes them. Never infer missing commercial or technical facts.
- Reuse the existing category-specific table closest to the requested product family. Do not add dependencies or create another design system.
- Import tooling must not restore removed categories. Run `npm run catalog:import` only when the user requests import work; it rewrites generated data.

Read [references/project-map.md](references/project-map.md) when the task changes catalog structure, product ordering, search, tables, cart calculations, or imports.

## Efficient workflow

1. Identify the smallest affected data module/component and its focused test.
2. Record a baseline only for invariants at risk. Use the state script instead of printing product arrays.
3. Make the narrow edit. Keep unrelated uncommitted work intact.
4. Run the focused test first. Use `node --test scripts/<area>.test.mjs`.
5. After the implementation is stable, run `npx tsc --noEmit`, `npm run lint`, `npm test`, and `npm run build` once. Do not repeat full checks after changes that cannot affect their result; run the focused check instead.
6. Use the browser only for visual or interaction changes. Verify the relevant localhost route and one failure/edge state, then stop.

Report the changed behavior, retained catalog counts, focused/full checks, and any real limitation. Avoid command transcripts and large data dumps.
