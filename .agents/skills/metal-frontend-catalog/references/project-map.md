# Project map

Read only the section relevant to the current request.

## Catalog data and routes

- Categories: `data/categories.ts`
- Subcategories: `data/subcategories.ts`
- Derived product types: `data/productTypes.ts`
- Public variants and normalization: `data/products/index.ts`
- Category sources: `data/products/{armatura,armaturaA500c,balka,metalMesh,profnastil,trubaKruglayaLegacy,trubyProfilnye}.ts`
- Retained supplier data: `data/imported-catalog.json`; six-category scope: `data/catalog-scope.ts`; hidden legacy records: `data/catalog-visibility.ts`
- Rozmet data: `data/rozmet-catalog.json`; saved evidence: `imports/rozmet-source.json`; direct leaf routes: `data/rozmet-routes.json`. Read `docs/rozmet-import.md` for import work. Do not overwrite manual changes by reimporting.
- Channel specifications/images overlay: `data/channel-specifications.json`, applied by `data/products/index.ts` only for matching ID and source URL
- Image overlay: `data/catalog-images.json`; versioning: `scripts/catalog-image-versions.mjs`
- Approved product display overrides: `lib/catalogOverrides.ts` with channel/angle/square JSON evidence; raw Rozmet specifications retain supplier names.
- Catalog selectors: `lib/catalog.ts`
- Routes: `app/catalog/page.tsx` and the three dynamic directories below it; `lib/catalogLinks.ts` builds canonical links. Direct categories bypass the visible subcategory/type layers.

Route resolution depends on category, subcategory, and product-type IDs agreeing. A removed category must disappear from categories, subcategories, variants, generated static params, navigation, search, and image mappings.

## Specialized product tables

- Shared dispatcher: `components/catalog/ProductVariantCatalog.tsx`
- Generic filter state: `components/catalog/GenericProductVariantCatalog.tsx`; pure selection, labels and reference-column rules: `lib/variantCatalog.ts`; row/card rendering: `components/catalog/VariantCatalogResults.tsx`
- Rebar, beam, and VGP: `components/catalog/RebarVariantCatalog.tsx`, `MeasuredVariantItem.tsx`
- Profile pipes: `ProfilePipeVariantItem.tsx`, `lib/profilePipe.ts`
- Profile sheets: `ProfileSheetVariantCatalog.tsx`, `lib/profileSheet.ts`
- Metal mesh: `MetalMeshVariantCatalog.tsx`, `lib/metalMesh.ts`
- Generic presentation and filters: `lib/variantPresentation.ts`, `components/catalog/FilterPanel.tsx`
- Channel/angle/square layouts: `VariantCatalogResults.tsx`; previews: `ChannelProductPreview.tsx`, `ProductImageViewer.tsx`. Category-level layout branches live in `app/catalog/[categorySlug]/page.tsx`. Measured column geometry lives in `measuredCatalogColumns.ts`; the unused old channel-tonnage renderer has been removed.

Keep desktop tables and mobile cards behaviorally equivalent. Quantity validation must agree with cart and server repricing.

## Cart, prices, and ordering

- Browser state: `context/CartContext.tsx`, `lib/cart.ts`
- Client catalog: `lib/cartCatalog.ts` reads generated `data/cart-catalog.json`; `scripts/cart-catalog.mjs` derives it using `lib/cartProjection.ts`
- Authoritative repricing: `lib/cartPricing.ts`
- Metre/tonne conversion: `lib/orderMeasurement.ts`
- Server order validation: `lib/server/orders.ts`, `lib/server/validation.ts`
- Unit formatting: `lib/currency.ts`, `lib/variantPresentation.ts`

Never trust saved totals. Recompute from the current variant. Preserve full precision until monetary line rounding.

## Search

- Index: `lib/search/index.ts`
- Technical dimensions: `lib/search/technical.ts`
- Russian morphology and aliases: `lib/search/russian.ts`, `lib/search/terminology.ts`
- Test: `scripts/search.test.mjs`

Remove aliases and category-specific rules when their category is removed.

## Focused tests

- Catalog boundary and retained snapshot: `scripts/catalog-pruning.test.mjs`
- Rebar: `scripts/rebar-catalog.test.mjs`, `rebar-measurement.test.mjs`
- Beam: `scripts/beam-catalog.test.mjs`
- Profile pipes: `scripts/profile-pipe-catalog.test.mjs`, `profile-pipe-controls.test.mjs`
- Round/VGP pipes: `scripts/vgp-catalog.test.mjs`
- Profile sheets: `scripts/profnastil-catalog.test.mjs`
- Metal mesh: `scripts/metal-mesh-catalog.test.mjs`
- Cart/order: `scripts/cart-and-order.test.mjs`, `measured-order-controls.test.mjs`, `product-order-controls.test.mjs`
- Images: `scripts/images.test.mjs`
- Image viewer/channel captions: `scripts/product-image-preview.test.mjs`
- Channel routes and reference values: `scripts/shveller-product-pages.test.mjs`
- Rozmet source parity, reimport and image snapshot: `scripts/rozmet-catalog.test.mjs` (a different snapshot from the compact state helper)

Prefer one focused test while iterating; choose broader checks with `docs/development-workflow.md`. Historical audit failures are recorded in `docs/development-audit-2026-10-30.md`; verify the current baseline instead of assuming those failures still exist.
