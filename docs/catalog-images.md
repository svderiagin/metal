# Catalog images

Regenerate with:

1. `node scripts/scan-images.mjs`
2. `node scripts/supplement-content-images.mjs`
3. `node scripts/map-catalog-images.mjs`

The downloaded mirror is read only. Runtime mappings are separate from the catalog import so re-importing prices and specifications preserves images. The scanner extracts product files, gallery URLs (including renamed download extensions), categories and source page evidence. Editorial image alt text and surrounding descriptions are inventoried separately and checked visually before use.

- sourceDirectory: brokinvest.ru
- sourceHtmlPages: 2005
- discoveredImageFiles: 327
- discoveredUniqueImageContents: 263
- uniqueImagesIntegrated: 19
- totalProducts: 688
- productsUpdated: 505
- categoriesUpdated: 13
- productTypesUpdated: 23
- productsWithImageBefore: 0
- productsWithImageAfter: 505
- coverageBeforePercent: 0
- coverageAfterPercent: 73.4
- originalProductsWithImageReferences: 122
- originalProductsWithBrokenImageReferences: 122
- productsWithNewSourcePhotos: 505
- productsWithoutReliableNewMatch: 183

Coverage counts resolvable real images only: 0% before, 73.4% after. All 122 original product image references pointed to missing SVG files; absent images are now represented by a shared neutral placeholder where a fallback previously existed. Placeholders are excluded from coverage. Images illustrate reviewed form and surface, not certified grade, standard or exact dimensions.

Full per-target provenance, confidence and unassigned products: [mapping report](../imports/image-mapping-report.json). Recursive source inventory: [source inventory](../imports/image-source-inventory.json). Browser results: [browser verification](../imports/image-browser-verification.json).

## Rejected or uncertain source associations

- Полоса: Rejected for strip products: photograph shows broad stacked plates; source association alone does not establish narrow strip geometry.
- Арматура А1 / А240: Rejected inherited ribbed bar image. Verified smooth-bar editorial photo used for straight A1/A240 bars; coils remain unmatched.
- Лист с рифлением: Lentil pattern verified visually; rejected for rhombus pattern and unspecified pattern.
- Электроды: Packaging photo not assigned to named brands/models. Generic coated-stick electrode illustration represents the shared visible product type without asserting brand, coating chemistry or standard.
- Уголок: Original category file absent. Editorial equal-leg angle photograph used for equal-leg variants only; unequal-leg, galvanized and stainless variants remain unmatched.
- Рулоны: Silver unpainted coil illustration excluded from RAL/polymer coated and hot rolled variants.
- Editorial images: Some editorial alt labels contradict the visible product (angles labelled channels, ribbed bars labelled smooth). These contradictory images were rejected; only visually corroborated descriptions were used.

No uncertain matches are automatically assigned. Medium confidence means a reviewed family illustration reused for visually equivalent variants, rather than a photograph of that exact size. Mixed families retain their existing card placeholder. There are seven rejected or restricted source association groups above, all documented for optional manual review.

## Validation

- `node --test scripts/images.test.mjs`: image paths, decoding, source byte identity, incompatible subtype exclusions and preservation of every non-image product field.
- `npm run catalog:check`: catalog and cart checks, including byte-identical re-import.
- `npm run lint -- --ignore-pattern 'brokinvest.ru/**'`: application lint. Unscoped lint also scans downloaded donor JavaScript, which contains unrelated lint errors.
- `npm run build`: production build and TypeScript validation.
- `node scripts/check-catalog-images-browser.mjs`: running local server on port 3000 and headless Chrome debugging on port 9223; desktop/mobile checks for loaded images, alt text, expected mapping, preserved aspect ratio and horizontal overflow.

## Image filenames

Catalog images in `public/images/catalog/` use descriptive Latin filenames (for example, `armatura.png`, `balka.jpeg`, and `truby-profilnye.jpeg`). Shared product and category references are maintained in `data/catalog-images.json`. The mapping script preserves these names during regeneration. Homepage banner files in `public/images/hero/` are separate.

## Replacing images and cache updates

Replace the image at its existing path. `npm run dev` checks catalog image contents every second and updates `data/catalog-image-versions.json` when files change. Image components and original-image links append a content version to the URL, so a replacement gets a new browser and Next.js image cache entry. Restart the dev server once after installing this workflow; subsequent image replacements need no restart. Refresh an already open page if necessary.

`npm run build` regenerates the versions automatically before building. For production, rebuild and deploy both the application and public images together; copying a file alone does not update pre-rendered pages. Changing a filename or extension still requires updating `data/catalog-images.json`.
