# Project map

Read only the section relevant to the current request.

## Catalog data and routes

- Categories: `data/categories.ts`
- Subcategories: `data/subcategories.ts`
- Derived product types: `data/productTypes.ts`
- Public variants and normalization: `data/products/index.ts`
- Category sources: `data/products/{armatura,armaturaA500c,balka,metalMesh,profnastil,trubaKruglayaLegacy,trubyProfilnye}.ts`
- Generated retained supplier data: `data/imported-catalog.json`
- Image overlay: `data/catalog-images.json`; versioning: `scripts/catalog-image-versions.mjs`
- Catalog selectors: `lib/catalog.ts`
- Routes: `app/catalog/page.tsx` and the three dynamic directories below it

Route resolution depends on category, subcategory, and product-type IDs agreeing. A removed category must disappear from categories, subcategories, variants, generated static params, navigation, search, and image mappings.

## Specialized product tables

- Shared dispatcher: `components/catalog/ProductVariantCatalog.tsx`
- Rebar, beam, and VGP: `components/catalog/RebarVariantCatalog.tsx`, `MeasuredVariantItem.tsx`
- Profile pipes: `ProfilePipeVariantItem.tsx`, `lib/profilePipe.ts`
- Profile sheets: `ProfileSheetVariantCatalog.tsx`, `lib/profileSheet.ts`
- Metal mesh: `MetalMeshVariantCatalog.tsx`, `lib/metalMesh.ts`
- Generic presentation and filters: `lib/variantPresentation.ts`, `components/catalog/FilterPanel.tsx`

Keep desktop tables and mobile cards behaviorally equivalent. Quantity validation must agree with cart and server repricing.

## Cart, prices, and ordering

- Browser state: `context/CartContext.tsx`, `lib/cart.ts`
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

Prefer one focused test while iterating. Run the full suite once before completion when code or catalog data changed.
