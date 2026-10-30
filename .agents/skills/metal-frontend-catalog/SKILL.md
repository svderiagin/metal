---
name: metal-frontend-catalog
description: Maintain metal-frontend catalog data, hierarchy, category routes, product tables, search, and supplier imports. Use for catalog changes in this repository; pure styling and checkout/API work have separate skills.
---

# Metal Frontend Catalog

Work from the repository root. Preserve the existing visual system and data model unless the user explicitly changes them.

## Start cheaply

Run these before opening large catalog files:

```bash
node .agents/skills/metal-frontend-catalog/scripts/catalog_state.mjs --summary
git status --short
```

Use the summary for totals and protected-data checks; omit `--summary` only when category counts help. Search with `rg`, then read only the component, data module, and focused test for the requested area. Do not print full imported JSON, snapshots, or broad documentation. For a supplier record, select the ID and relevant fields programmatically.

Follow `AGENTS.md`. When changing a Next.js API or convention, read the matching file in `node_modules/next/dist/docs/` first. Ordinary copy or catalog-data edits do not require broad Next.js documentation review.

## Catalog invariants

- The hierarchy is `Category → Subcategory → ProductType → ProductVariant`.
- `data/categories.ts` and `data/subcategories.ts` define navigation. `data/productTypes.ts` derives product types. `data/products/index.ts` is the public product boundary. `lib/catalog.ts` is the read API used by pages.
- These six protected category IDs stay first in this order: `cat-arm`, `cat-trp`, `cat-trk`, `cat-pnf`, `cat-mesh`, `cat-bal`. Owner-approved rozmet.ru content follows them; see `docs/rozmet-import.md` for its separate data files and source evidence.
- Treat `imports/protected-catalog.snapshot.json` and `scripts/catalog-pruning.test.mjs` as the regression guard. Update them only when the user explicitly requests a change to the retained catalog.
- Keep identifiers, slugs, units, prices, and cart calculations stable unless the request changes them. Never infer missing commercial or technical facts.
- Reuse the existing category-specific table closest to the requested product family. Direct-product categories use the table at category level; `internal: true` subcategories are adapters, not extra navigation levels.
- Import tooling must not restore removed categories. Run `npm run catalog:import` only when the user requests import work; it rewrites generated data.

Read [references/project-map.md](references/project-map.md) when the task changes catalog structure, product ordering, search, tables, cart calculations, or imports.

## Verification

Follow [the shared check matrix](../../../docs/development-workflow.md) (repository `docs/development-workflow.md`). Start with the area's test from the project map. Recheck counts/protected data when the edit can affect them. Price/product edits also need the generated cart projection refreshed before browser checks; do not regenerate supplier imports for that.

Verify desktop tables and mobile cards when behavior or layout changes. Preserve search/cart links using `#variant-<id>` and their mobile targets; `hooks/useLinkedVariant.ts` reveals filtered or collapsed rows.

Report changed behavior, relevant checks and limitations; include counts only when catalog membership changed or was at risk.
