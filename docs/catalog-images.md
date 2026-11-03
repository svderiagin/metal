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

Optional historical evidence (not present in every checkout): full per-target provenance, confidence and unassigned products: [mapping report](../imports/image-mapping-report.json). Recursive source inventory: [source inventory](../imports/image-source-inventory.json). Browser results: [browser verification](../imports/image-browser-verification.json).

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
- `node scripts/check-catalog-images-browser.mjs`: compatibility entry point to the shared current-interface suite, using site port 3000 and Chrome CDP 9223. It verifies visible image loading and desktop/mobile overflow without requiring supplier reports or overwriting import evidence. Results: `.tmp/local-audit/`.

## Image filenames

Catalog images in `public/images/catalog/` use descriptive Latin filenames (for example, `armatura.png`, `balka.jpeg`, and `truby-profilnye.jpeg`). Shared product and category references are maintained in `data/catalog-images.json`. The mapping script preserves these names during regeneration. Homepage banner files in `public/images/hero/` are separate.

## Replacing images and cache updates

Replace the image at its existing path. `npm run dev` checks catalog image contents every second and updates `data/catalog-image-versions.json` when files change. Image components and original-image links append a content version to the URL, so a replacement gets a new browser and Next.js image cache entry. Restart the dev server once after installing this workflow; subsequent image replacements need no restart. Refresh an already open page if necessary.

`npm run build` regenerates the versions automatically before building. For production, rebuild and deploy both the application and public images together; copying a file alone does not update pre-rendered pages. Changing a filename or extension still requires updating `data/catalog-images.json`.

Public file existence, exact path case and image metadata are always checked by `npm test`. Supplier byte/provenance checks are explicitly skipped when the optional mirror or reports are absent.

## Channel illustrations: approved template

The channel product images use the owner's approved No. 5 reference in
`imports/shveller-image-template/reference-5.jpg`. Each 2400 × 1800 lossless WebP
keeps the shared photograph, reflection, dimension arrows and layout; only the
profile title and numeric labels change. No. 5 preserves the approved image's
decoded pixels. The current reference is the owner's update without white
backplates on the labels over the light background. Values that match No. 5
are retained directly from that reference; only differing labels are replaced.
The soft contrast backing for the flange-thickness label over the dark metal
is retained as in the supplied reference. These are family illustrations with nominal dimensions, not
manufacturing drawings or photographs proving the exact profile geometry.

Regenerate with `node scripts/render-shveller-images.mjs --write`. The renderer
reads the same public specifications as the site from `data/products/index.ts`,
including supplier lengths and theoretical masses. Preview one profile with
`node scripts/render-shveller-images.mjs --preview 40`. Inter is bundled with its
OFL license in the template folder; font caches are written only under `.tmp/`.
The generated `imports/shveller-image-template/rendered.json` records every
label, product association, output size and image hash. The older ImageGen
prompts in `imports/shveller-template-images.json` describe historical assets.
Existing catalog URLs are retained; the normal image-version watcher refreshes
their cache keys. Next.js creates the smaller delivery variants as before.

## Angle illustrations: approved template

All 22 products on `/catalog/ugolok` use the owner's supplied 25×25×3 reference,
saved unchanged in `imports/ugolok-image-template/reference-25x25x3.jpg`.
The individual 2400 × 1800 lossless WebP files live in
`public/images/catalog/ugolok/ugolok-*-clean.webp`. The table and mobile cards
open the same expanded image viewer as channel products, including zoom and pan.

Regenerate with `node scripts/render-ugolok-images.mjs --write`, or preview with
`node scripts/render-ugolok-images.mjs --preview 160x100x10`. Dimensions, thickness,
supplier length and theoretical mass come from public product specifications.
The supplied reference says 0.5 kg/m for 25×25×3; the catalog says 1.12 kg/m,
so its illustration uses **1,12 кг/м**. Other source facts remain unchanged.
Decimal commas, nonbreaking spaces and `кг/м` are used in the image labels.

ImageGen supplied a clean background plate for replacing labels. Only small
background patches from that plate enter the final assets. The original product,
cut face, edges, shadow and reflection remain from the supplied reference;
the renderer verifies zero changed pixels outside the variable-label rectangles.
The background plate is resized to the native reference canvas, without resizing
the product photo. Inter and its license are shared with the channel renderer.
The exact generation prompt is stored in the template's `generation.json`.

`data/angle-images.json` is a separate ID/source-URL image overlay applied at
`data/products/index.ts`, so supplier imports do not overwrite the illustrations.
`imports/ugolok-image-template/rendered.json` records labels, patches, hashes and
pixel checks. These are shared family photographs with nominal dimension labels,
including the two unequal-leg profiles; they are not scaled manufacturing drawings.
Validate with `node --test scripts/ugolok-images.test.mjs scripts/images.test.mjs`.

## Shared product image viewer

`ProductImageViewer.tsx` opens a viewport-sized native dialog for page images,
table previews and mobile cards. `CatalogImage.tsx` also uses it for product
photographs that previously had no enlargement control. Category and type
navigation cards retain their navigation links.

Only the clicked image's original, versioned file is loaded in the dialog
(`unoptimized`); thumbnails retain responsive Next.js optimization. The dialog
fits the image into the available area below its toolbar, preserves its aspect
ratio and does not upscale small originals. The **100%** control or a click on
the image switches to native dimensions: one source pixel per CSS pixel. This
uses `naturalWidth`/`naturalHeight`, not a fixed zoom factor or optimized thumbnail
dimensions. Drag with a mouse or one finger, or use arrow keys, to move the image.
Panning is bounded by the image edges and adapts when the viewport changes.
**Вписать**, another image click, or closing/reopening restores the fitted view.
Escape/close restores page scrolling and focus to the originating thumbnail.

Geometry and interaction checks: `node --test scripts/image-viewer-geometry.test.mjs scripts/product-image-preview.test.mjs`.

## Angle and steel square category covers

The category and product-type cards use the supplied 1200 × 600 warehouse
photographs: `ugolok/ugolok-main.jpg` and `kvadrat/kvadrat_main.jpg` under
`public/images/catalog/`. The same covers appear at the top of the category pages.
These unannotated covers are separate from individual product illustrations.

The square category is displayed as **Квадрат стальной**, including its internal
subcategory, navigation, metadata and product descriptions. Its URL remains
`/catalog/kvadrat`. The cover overrides and square terminology are also applied
by `scripts/import-rozmet.mjs`, preserving the owner's changes on future imports
without modifying saved supplier evidence.
