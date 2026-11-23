# Project map

Read only the section relevant to the current request.

## Catalog data and routes

- Categories: `data/categories.ts`
- Subcategories: `data/subcategories.ts`
- Derived product types: `data/productTypes.ts`
- Public variants and normalization: `data/products/index.ts`
- Category sources: `data/products/{armatura,armaturaA500c,balka,metalMesh,profnastil,trubaKruglayaLegacy,trubyProfilnye}.ts`
- Additional local variants: `data/catalog-positions.json` for the six protected categories and `data/additional-catalog.json` for the remaining categories. Scope and visibility: `data/catalog-scope.ts` and `data/catalog-visibility.ts`.
- Overrides for section specifications and images: `lib/catalogOverrides.ts` matches category and variant IDs. Technical references: `lib/catalogStandards.ts`.
- Product artwork: `data/catalog-images.json` and `data/product-illustrations.json`; gallery frames: `data/catalog-cover-galleries.ts`. File layout and version updates are in [catalog images](../../../../docs/catalog-images.md).
- Direct category routes: `data/direct-catalog-routes.json`. Legacy product key resolution: `lib/catalogIdentity.ts`.
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

Remove aliases and category-specific rules when their category is removed.

## Verification

Use the catalog state helper for counts and protected offer data. See
`docs/development-workflow.md` for type checks, builds and manual browser checks.
