---
name: metal-frontend-catalog
description: Maintain metal-frontend catalog data, category routes, product tables and search. Use for catalog changes in this repository. Interface styling and order behavior have separate skills.
---

# Metal Frontend Catalog

Work from the repository root. Preserve the existing visual system and data model unless the user explicitly changes them.

## Start cheaply

Run these before opening large catalog files:

```bash
node .agents/skills/metal-frontend-catalog/scripts/catalog_state.mjs --summary
git status --short
```

Use the summary for totals and protected-data checks. Omit `--summary` when category counts help. Search with `rg`, then read the relevant components and data modules. For a supplier record, select the ID and relevant fields programmatically.

Follow `AGENTS.md`. When changing a Next.js API or convention, read the matching file in `node_modules/next/dist/docs/` first. Ordinary copy or catalog-data edits do not require broad Next.js documentation review.

## Catalog invariants

- The hierarchy is `Category → Subcategory → ProductType → ProductVariant`.
- `data/categories.ts` and `data/subcategories.ts` define navigation. `data/productTypes.ts` derives product types. `data/products/index.ts` is the public product boundary. `lib/catalog.ts` is the read API used by pages.
- These six protected category IDs stay first in this order: `cat-arm`, `cat-trp`, `cat-trk`, `cat-pnf`, `cat-mesh`, `cat-bal`. The additional categories and variants live in `data/additional-catalog.json`. Their direct category routes use `data/direct-catalog-routes.json`.
- Edit the project's local data, as described in [catalog data](../../../docs/catalog-data.md). Keep supplier identities, sites and contact details out of the catalog. Route GOST links through `lib/catalogStandards.ts` to Meganorm.
- `lib/catalogOverrides.ts` applies approved section specifications and image overrides by category and product ID. A change to a section designation must agree with the matching specification record.
- `imports/protected-catalog.snapshot.json` records approved catalog data. Update it only when the user explicitly requests a change to the retained catalog.
- Keep identifiers, slugs, units, prices, and cart calculations stable unless the request changes them. Preserve saved cart and product link resolution through `lib/catalogIdentity.ts` when migrating existing keys. Never infer missing commercial or technical facts.
- `ProductVariantCatalog.tsx` dispatches product families; `GenericProductVariantCatalog.tsx` owns filter state, `lib/variantCatalog.ts` selection/sorting, and `VariantCatalogResults.tsx` rows/cards. Fix shared selection rules in the pure helper, not in both layouts. Direct-product categories use the table at category level; `internal: true` subcategories are adapters, not extra navigation levels.

Read the relevant section of [the project map](references/project-map.md) when tracing catalog routes, tables, search or cart calculations.

For the requested [VGP-style catalogue rollout](../../../docs/catalog-product-pages-prompt.md#таблица-и-карточки), use the nine logical desktop columns defined there. Choose the visible characteristics for how buyers compare each family, keep exact values searchable, and move secondary facts to «Подробнее». Check the longest real labels, values and totals at 1280 px.

## Verification

Follow [the shared check matrix](../../../docs/development-workflow.md). Recheck counts and protected data when the edit can affect them. After changes to prices or products, refresh the cart projection before checking the storefront.

Check affected links, filters and product views manually in the browser.

Verify desktop tables and mobile cards when behavior or layout changes. Preserve search/cart links using `#variant-<id>` and their mobile targets; `hooks/useLinkedVariant.ts` reveals filtered or collapsed rows.

For product-image tasks, also apply the UI skill's [image quality review](../../../docs/catalog-images.md#image-quality-review-required). Compare rendered labels with the variant's actual catalog values.

Report changed behavior, relevant checks and limitations; include counts only when catalog membership changed or was at risk.
