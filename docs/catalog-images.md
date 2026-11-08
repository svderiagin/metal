# Catalog images

## Памятка: цвета разметки товаров

| Элемент | HEX | RGB |
| --- | --- | --- |
| Заголовок, подписи и значения | `#41464D` | `65, 70, 77` |
| Стрелки, размерные и выносные линии | `#59636F` | `89, 99, 111` |

Это цвета разметки внутри изображений, используемые в эталоне квадрата и примере
рифлёного листа. При подготовке следующих иллюстраций сохранять эти значения.

## Image quality review (required)

Image quality is a completion criterion for image tasks. Source hashes, image
dimensions, valid mappings and passing tests verify technical properties;
they do not establish that labels match the owner's reference. Apply this review
to replacements and annotation fixes as well as new image sets.
Typography and batch checks apply to annotated/generated variants. For a single
unannotated photograph, review the source and delivered views; do not add labels
or generate extra variants solely to satisfy this checklist.

1. **Establish the reference.** Inspect the supplied files and distinguish the
   marked layout reference from the clean photograph. Preserve both originals.
   Use the clean photograph for label backgrounds when provided. Keep the approved
   product surface, cut face, edges, shadows, reflection and composition intact;
   do not redraw the metal to fix text or a thumbnail frame.
2. **Review a derived preview before batch generation.** For generated annotations, choose an actual
   non-reference product with a multi-digit section, decimal mass or long label.
   Compare reference and output side by side at the same 1:1 scale. Check font
   family, visible weight and letter height, spacing, baseline, alignment and gaps
   between labels/values. Inspect arrows, units, decimal commas and clipping.
   Compare repeated unit glyphs and the reference's bold length/mass values,
   rather than assuming `weight: 700` produces the same appearance.
3. **Verify font selection and the full changed set.** A text renderer can silently
   substitute a font or ignore a variable weight axis. The channel, angle and square renderers use
   bundled Inter with `PANGOCAIRO_BACKEND=fontconfig` before loading Sharp;
   read that family's renderer before changing its typography. If a backend/font
   change affects headings or dimensions too, review those labels as well.
   For a set of variants, inspect a contact sheet of every changed image, then native-size crops of
   the smallest/largest profiles, longest labels, decimal values and any outliers.
   Match every image's values to the public product specifications; do not replace
   supplier facts with inferred formulas.
4. **Check the delivered image on the site.** After refreshing version hashes,
   open at least one changed image (a non-reference variant for generated sets) from its actual table/card
   thumbnail. Check desktop and mobile, thumbnail sharpness/crop, fit view and 1:1
   details. Confirm the viewer loads the versioned original. Check both themes
   and responsive boundaries when changing frames, backgrounds or viewer layout.
5. **Use tests for the right scope.** Run the family's image/specification checks
   and verify that pixels outside the intended label patches are unchanged where
   that invariant applies. This protects the photo but cannot approve typography
   inside the patches. Renderer regression coverage must exercise a generated
   variant: a screenshot of an unchanged 8×8 reference does not validate the new
   12×12 mass text. Review the visual result before updating affected baselines.
6. **Record evidence and finish honestly.** Save a readable crop/comparison or
   screenshot showing the corrected detail and show it in the result. Keep QA
   intermediates under `.tmp/`; retain the required source and production assets
   in the project. State which views were actually checked and any unresolved
   mismatch. Matching incoming files to stored files alone is insufficient to
   declare the existing image set visually correct.

## Product illustrations for the remaining categories

`data/product-illustration-sources.json` maps reviewed source photos to a product
or a product type. Keep these images free of printed dimensions from the donor
SKU. See [photo sources](product-illustration-sources.md). The table thumbnail
and the product viewer both show the annotated 2400 × 1800 WebP,
with native zoom and pan. The approved sheet, channel, angle and square sets
retain their separate production images and renderers.
The owner's square and rectangular profile-pipe templates also have dedicated
renderers; the generic script excludes `type-cat-trp-sub-1` and `type-cat-trp-sub-2`.

Run `node --import tsx scripts/render-product-illustrations.mjs <product-id>` to
generate previews under `.tmp/product-illustrations/`. After visual review, run
the same script with `--write`, then `node scripts/catalog-image-versions.mjs`.
The renderer reads the current catalog and uses the bundled Inter font with the
palette above. Put confirmed sizes and properties on the illustration. Keep
ambiguous supplier dimensions under the catalog designation and leave out
unverified weights. The product lookup verifies the catalog signature and falls
back to the existing product photo if the data has changed.

For a targeted production update, pass the reviewed product IDs together with
`--write`. Only those files and manifest entries are replaced; other families
are preserved. Omitting IDs keeps the existing complete-set generation mode.
Profile-pipe reference masses and their exact source pages are documented in
[profile-pipe-weights.md](profile-pipe-weights.md).

### Square profile-pipe illustrations

The 28 parameterized square pipes use the owner's clean and marked photographs
under `public/images/catalog/truba-profilnia/truba_kvadratnaya/`. The source files
are retained. `scripts/render-profile-square-images.mjs` replaces only variable
numeric labels on the 2400 × 1800 marked reference, using clean-photo patches
and the confirmed catalog dimensions, wall thickness, length and theoretical
mass. Fixed captions, arrows and all pixels outside those patches stay exact.
The output is lossless WebP at the existing product URLs and is connected through
`data/product-illustrations.json`, including the current catalog signature.

Preview a non-reference item with
`node scripts/render-profile-square-images.mjs --preview profile-pipe-square-100x100x5`.
After visual review, generate with `--write` and refresh image versions. See the
[template notes](../imports/profile-square-image-template/README.md) and
`imports/profile-square-image-template/rendered.json` for patch geometry, exact
labels, typography and protected-pixel checks. This renderer leaves rectangular
pipe images unchanged.

### Rectangular profile-pipe illustrations

The 23 parameterized rectangular pipes use the owner's clean original and marked
reference under `public/images/catalog/truba-profilnia/truba_priamougolnaya/`.
`scripts/render-profile-rectangular-images.mjs` follows the square-pipe lossless
patch workflow: confirmed catalog values replace only variable labels, and the
supplied heading's leftover word “квадратная” is corrected to “прямоугольная”.
The tube photograph, cut face, inner walls, arrows, shadow and reflection outside
those patches remain exact. Outputs are 2400 × 1800 lossless WebP at the existing
product URLs, merged into `data/product-illustrations.json`.

Preview `profile-pipe-rectangular-100x60x3` with `--preview`, review the native
details, then run `--write` and refresh image versions. See the
[template notes](../imports/profile-rectangular-image-template/README.md) and
`imports/profile-rectangular-image-template/rendered.json` for the exact sources,
labels, typography and pixel-preservation evidence.

The owner-renamed image directory is `public/images/catalog/truba-profilnia/`:
the category title photo is `truba-main.jpg`, family photos are
`truba-kvadratnaya.jpg` and `truba-priamougolnaya.jpg`, square templates are in
`truba_kvadratnaya/`, rectangular templates in `truba_priamougolnaya/`, and title
gallery photos in `cover/`. Image references use these names; public catalog page
slugs retain `truby-profilnye`.

## Historical supplier mapping

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

`node --test scripts/catalog-image-labels.test.mjs` compares native 1:1 length/mass
crops of generated channel No. 6.5, angle 160×100×10 and square 12×12 against reviewed
PNG baselines in `tests/visual/label-baselines/`. These asset checks are independent
of browser screenshot scaling and protect typography on derived variants.
On failure the current crop is saved under `.tmp/catalog-image-qa/`; compare it
with the supplied source before accepting a new baseline. The same test verifies
that all channel photos remain unchanged outside their permitted label patches.

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

Generated length/mass values use bundled Inter at 44 px / weight 750, matched
to the reference. Fontconfig is selected before Sharp loads, including on macOS.
The renderer also checks label bounds and exact photo preservation outside patches;
the existing soft thickness-label backing is clipped to its permitted region.
Previews are written to `.tmp/catalog-image-qa/shveller-preview/`.

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

Generated length/mass values use 44 px / weight 750 and the Fontconfig backend,
matching the bold reference values. Other variable labels are reviewed with the
same bundled font. Previews go to `.tmp/catalog-image-qa/ugolok-preview/`.
The exact generation prompt is stored in the template's `generation.json`.

`data/angle-images.json` is a separate ID/source-URL image overlay applied at
`data/products/index.ts`, so supplier imports do not overwrite the illustrations.
`getAngleProductSpecifications` derives the displayed equal/unequal-leg type from
the explicit section dimensions: 100×63×6 and 160×100×10 show «Неравнополочный».
The contradictory raw supplier type is preserved in the import, while desktop
and mobile specifications use the same presentation helper.
`imports/ugolok-image-template/rendered.json` records labels, patches, hashes and
pixel checks. These are shared family photographs with nominal dimension labels,
including the two unequal-leg profiles; they are not scaled manufacturing drawings.
Validate with `node --test scripts/ugolok-images.test.mjs scripts/images.test.mjs`.

## Sheet illustration candidates

[Sheet source selection](../imports/listovoy-image-sources/README.md) contains five
reviewed, unannotated product images for the four sheet subcategories, with a
separate PVL image for the expanded-metal variants inside the hot-rolled group.
These preparation assets are not connected to the storefront. The manifest
records source URLs, native file dimensions, hashes, candidate product IDs and
restrictions. Confirm the tread pattern, PVL 306/406 association and the conflicting
cold-rolled group description before generating dimension labels; use project
specifications rather than donor sizes or grades.

The owner-selected Cronvall tread plate also has a clean, unannotated layout for
manual dimension work: `public/images/catalog/listovoy-prokat/list-rifleniy_2400_1800_original.png`.
Its source, exact imagegen prompt, generation dimensions and review notes are in
[`imports/list-rifleniy-image-template/`](../imports/list-rifleniy-image-template/README.md).
The owner approved the smaller placement and requested a 200 px shift to the left.
The final composition was rebuilt with the original Cronvall PNG as its appearance
source and the approved placement as a composition reference. The final canvas is
2400 × 1800; the built-in imagegen result was 1448 × 1086 and was exported uniformly,
then translated exactly -200 px horizontally without resampling the retained pixels.
This is an AI-recomposed illustration, not a pixel-identical source transform.
The next revision increases the plate footprint by about 20%, keeping its left
boundary at x=854 and bottom boundary at y=1338. All four corners remain visible.
The first oversized attempt is recorded as rejected.

An owner-requested example annotation is saved separately as
`listovoy-prokat/list-rifleniy-4-1500x6000-marked.png`. It uses the public
rozmet-2202 parameters: 4 mm base thickness, 1500 mm width and 6000 mm length.
`imports/list-rifleniy-image-template/render-annotations.mjs` draws the same bundled
Inter typography and slate lines as the square family. Dimension lines follow the
projected length/width edges; external thickness arrows identify the base sheet
at its nearest cut edge, excluding the raised tread. Footer labels show length
and width. The inherited mass value is omitted pending confirmation for the
actual treaded product. `annotations.json` records all placements and verifies
unchanged photo pixels outside the transparent annotation layer. These are
nominal catalog dimensions on a family illustration, not a manufacturing drawing.
The clean source remains separate; no product-table mappings have been changed.

## Tread plate product illustrations

The active 2400 × 1800 templates are the owner's marked and clean JPGs in
`public/images/catalog/listovoy-prokat/list-refleniy/`. The marked JPG serves
«Лист № 3 ТУ» unchanged. `node scripts/render-tread-plate-images.mjs --write`
renders the other three products as lossless WebP and records their associations
in `data/tread-plate-images.json`. Run without `--write` for previews under
`.tmp/list-refleniy-qa/`.

The renderer uses clean photo patches and bundled Inter only for changed labels.
It verifies that all pixels outside those patches match the marked reference.
Arrows, unit glyphs, and the plate composition stay in place. Width, length,
thickness, and mass come from the saved catalog. The № 4 and № 5 illustrations
label the supplied kg/m² value as «Масса по каталогу». The four images share one
illustrative plate shape and tread pattern, with nominal dimensions for each SKU.

The product table and mobile cards reuse the profile thumbnails and viewer.
Quantity units remain specific to each row, and the cash-only price condition
appears next to the corresponding price.

## Galvanized sheet product illustrations

The supplied clean and marked 2400 × 1800 JPGs are in
`public/images/catalog/listovoy-prokat/list_ocinkovanniy/`. The marked JPG
sets the layout and the title «Лист оцинкованный № 0,5». Its decoded pixels are
used for the 0,5 mm illustration.

Run `node scripts/render-galvanized-sheet-images.mjs --write` to generate three
lossless WebP illustrations and the source-matched `data/galvanized-sheet-images.json`.
The renderer uses clean photo patches to replace the designation, thickness
and mass for the 0,7 mm and 1 mm illustrations. It reads the values from the
saved supplier data and checks that all pixels outside the edited labels
match the marked reference.

The illustrated sheet families use the same table, filters, cards and image viewer.
Galvanized sheets are ordered by the piece. The price notes for № 0,5 and № 0,7
appear in the row and mobile card.

## Cold-rolled sheet product illustrations

The marked and clean 2400 × 1800 JPGs are in
`public/images/catalog/listovoy-prokat/list_holodnokataniy/`.
Run `node scripts/render-cold-rolled-sheet-images.mjs --write` to generate the two
lossless WebP illustrations and `data/cold-rolled-sheet-images.json`. Without
`--write`, the generated images go to `.tmp/cold-rolled-sheet-catalog/`.

The № 0,5 illustration preserves every decoded pixel of the marked JPG. The
№ 1 illustration uses the clean JPG and bundled Inter to replace its designation,
thickness and mass. The renderer verifies that pixels outside these label patches
match the reference. The shared plate illustration uses each product's saved nominal
dimensions and mass. The storefront uses the title «Лист холоднокатаный» at the
existing `list-ocynkovannyj` route.

## Hot-rolled sheet product illustrations

The marked and clean 2400 × 1800 JPGs are in
`public/images/catalog/listovoy-prokat/list_goriachekataniy/`.
The marked № 2 source supplies the composition for the 13 smooth variants.
The product images use saved thicknesses, nominal sheet formats and masses,
including kg per piece for the smaller format and kg per square metre for the
larger format. The 3 mm illustrations distinguish «ТУ» and «ГОСТ».

Run `node scripts/render-hot-rolled-sheet-images.mjs --write` to regenerate
the lossless WebP files and `data/hot-rolled-sheet-images.json`. The renderer
checks that the photo pixels outside the changed labels match the marked source.

## Shared product image viewer

`ProductImageViewer.tsx` opens a viewport-sized native dialog for page images.
Table previews and mobile cards retain the centered rounded window with a
soft frame, close control over the image and a maximum outer width of 1000 px.
`CatalogImage.tsx` also uses it for product
photographs that previously had no enlargement control. Category and type
navigation cards retain their navigation links.

Only the clicked image's original, versioned file is loaded in the dialog
(`unoptimized`); thumbnails retain responsive Next.js optimization. The dialog
fits the image into the available viewing area, preserves its aspect
ratio and does not upscale small originals. A click on the image (or the
**100%** control in the full-screen page viewer) switches to native dimensions.
One source pixel corresponds to one CSS pixel. This uses
`naturalWidth`/`naturalHeight`, not a fixed zoom factor or optimized thumbnail
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

## Steel square product illustrations

The seven products on `/catalog/kvadrat` use the same six-column profile table
and mobile previews as channels and angles. Each row shows its section, supplier
length, theoretical mass and its own 2400 × 1800 lossless WebP illustration.
The section filter uses the profile number (8×8 through 20×20 mm), separately
from the supplier's `Размер` field, which means length (6 m for all seven).

The owner's marked `public/images/catalog/kvadrat/kvadrat_2400_1800_marked.jpg` and
clean `kvadrat_2400_1800_original.jpg` are saved unchanged as `reference-8x8.jpg` and
`photo.jpg` in `imports/kvadrat-image-template/`. The 8×8 illustration preserves
every decoded reference pixel. Other images replace only differing labels,
using background crops from the clean photograph and Inter text. Arrow segments
through the replaced dimension labels are restored in place. No AI editing,
resizing or new metal texture is used. These are shared family illustrations,
not scaled manufacturing drawings.

The renderer explicitly selects the Fontconfig backend so macOS uses the bundled
variable Inter font and its actual weight axis. Mass values use 44 px / weight 750,
matched visually to the supplied reference; the original 8×8 pixels remain intact.

Regenerate with `node scripts/render-kvadrat-images.mjs --write`; preview with
`node scripts/render-kvadrat-images.mjs --preview 20`. The manifest `rendered.json`
records labels, patches, hashes and zero changes outside those patches.
`data/square-images.json` associates images by product ID and matching supplier
URL, independently of supplier imports. `lib/squarePresentation.ts` supplies
consistent values to the table, filters and renderer, with decimal commas and
`кг/м`. Supplier values stay intact, including the listed **1,54 кг/м** for №16.
Validate with `node --test scripts/kvadrat-images.test.mjs scripts/images.test.mjs`.
