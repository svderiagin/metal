# Catalog images

## Памятка: цвета разметки товаров

| Элемент | HEX | RGB |
| --- | --- | --- |
| Заголовок, подписи и значения | `#41464D` | `65, 70, 77` |
| Стрелки, размерные и выносные линии | `#59636F` | `89, 99, 111` |

Это цвета разметки внутри изображений, используемые в эталоне квадрата и примере
рифлёного листа. При подготовке следующих иллюстраций сохранять эти значения.

## Image quality review (required)

Image quality is a completion criterion for image tasks. Check the appearance
and labels against the owner's reference. Apply this review to replacements,
annotation fixes and new image sets.
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
5. **Review the generated variants.** Compare labels with catalog specifications
   and inspect the photo outside the annotation patches. Review any native-size
   crops or pixel-preservation reports produced by the renderer.
6. **Record evidence and finish honestly.** Save a readable crop/comparison or
   screenshot showing the corrected detail and show it in the result. Keep QA
   intermediates under `.tmp/`; retain the required source and production assets
   in the project. State which views were actually checked and any unresolved
   mismatch. Matching incoming files to stored files alone is insufficient to
   declare the existing image set visually correct.

## Структура каталога изображений

Категории и подкатегории используют те же имена папок, что и адреса страниц.

```text
public/images/catalog/armatura/
├── main/                          # основной кадр категории
├── cover/                         # дополнительные кадры категории
├── originals/                     # общие исходники и авторские эталоны
└── armatura-a500s/
    ├── cover/                     # титульное фото и галерея подкатегории
    └── measurement/               # фотографии товаров с разметкой
```

Подкатегория хранит свои исходники в `originals/`. Для категорий с товарами
на основной странице `measurement/` находится сразу в папке категории.
Если несколько страниц используют один кадр, все ссылки ведут к одному файлу.
Общий заполнитель и исходники без единственного владельца лежат в `shared/`.
Адаптивные копии под `public/images/prepared/` создаются при сборке.

Имена в `measurement/` состоят из вида товара и подтверждённых параметров.
Используйте латиницу, `x` для размеров и дефис для десятичного разделителя
в значениях. Например, `truba-vgp-du15x2-8mm-6m.webp` и
`armatura-gladkaya-a240s-20mm-prutok-11-7m.webp`. Марка стали, покрытие и форма
поставки входят в имя, когда они помогают определить позицию. Для отдельных
файлов с одинаковым описанием правило добавляет ID к совпавшему имени.
Имена для генераторов задаёт `scripts/catalog-measurement-path.mjs`.

## VGP pipe product illustrations

The ВГП table uses the owner's marked and clean 2400 × 1800 photographs in
`public/images/catalog/truba-kruglaya/truba-vodogazoprovodnaya/originals/`. The bottom dimension shows the
outside diameter from `diameterMm`. The Ду15 master has «50 мм» at this location.
The published Ду15 illustration uses its catalog value «Ø 21,3 мм».
The upper-left arrows mark one wall. All variants retain the same photograph.

Preview a variant with `node scripts/render-vgp-images.mjs --preview local-54870`.
Use `--write` to refresh the table images and their catalog signatures, then run
`node scripts/catalog-image-versions.mjs` to refresh image versions.

The galvanized DN25×2.8 offer (`local-984`) uses the owner's marked JPG in
`public/images/catalog/truba-kruglaya/truba-vodogazoprovodnaya-otsinkovannaya/originals/` directly, with no pixel
changes. Its 33.5 mm outside diameter and 2.18 kg/m label match the table.
`data/vgp-galvanized-specifications.json` records GOST 3262-75 table 1 and the
3% zinc allowance: 2.12 × 1.03 = 2.1836 kg/m. Conversion retains all four decimal
places and follows the existing whole-pipe VGP order rule at the supplier's
nominal 7.8 m length. The supplier's ±150 mm length tolerance remains in the
description. Price is still on inquiry. The uncoated VGP renderer excludes this
subcategory, and the generic illustration renderer protects the supplied image.

## Electrowelded pipe source photographs

The owner approved reusing the VGP photographs for electrowelded pipes on
22.11.2026. The clean 2400 × 1800 JPGs are copied byte-for-byte:

- `public/images/catalog/truba-kruglaya/truba-elektrosvarnaya/originals/truba_elektrosvarnaya_2400_1800_original.jpg`
  comes from the uncoated `vgp/` original.
- `public/images/catalog/truba-kruglaya/truba-elektrosvarnaya-otsinkovannaya/originals/truba_elektrosvarnaya_ocinkovannaya_2400_1800_original.jpg`
  comes from the galvanized `vgp_ocinkovannaya/` original.

These folders hold the sources for subsequent annotation. At the owner's request,
save annotated outputs beside their originals as JPG, quality 100 and 4:4:4
chroma sampling. Labels must
use the electrowelded product's outside diameter, wall, steel grade, length and verified mass;
the VGP references' nominal-bore labels and values do not transfer to this family.

The electrowelded catalogue has **21 positions** across its two tables.

- The **20 ordinary positions** use annotated JPG files in
  `public/images/catalog/truba-kruglaya/truba-elektrosvarnaya/measurement/`.
  Positions with the same rendered artwork share one file.
- The **one galvanized position**, 89 × 3,5 × 7800 mm (`local-443`), currently
  uses `public/images/catalog/truba-kruglaya/truba-elektrosvarnaya-otsinkovannaya/measurement/truba-elektrosvarnaya-otsinkovannaya-89x3-5mm-7-8m.webp`, the earlier
  illustration based on the cover photograph. The JPG made from the supplied galvanized
  VGP original is stored separately at
  `public/images/catalog/truba-kruglaya/truba-elektrosvarnaya-otsinkovannaya/measurement/truba-elektrosvarnaya-otsinkovannaya-89x3-5mm-7-8m.jpg`.
  That JPG includes the caption «Без массы цинкового покрытия».

`data/product-illustrations.json` connects each image to its SKU and retains the
catalog signature. The dedicated renderer preserves the active WebP mapping for
`local-443` when it regenerates the JPGs. The generic renderer excludes both
electrowelded families.

Mass values were checked against
[GOST 10704-91, table 1](https://meganorm.ru/mega_doc/norm/gost_gosudarstvennyj-standart/0/gost_10704-91_mezhgosudarstvennyy_standart_truby_stalnye.html#Par53).
The dedicated renderer produces **2400 × 1800 JPGs, quality 100, 4:4:4** from the
exact supplied clean originals. `node scripts/render-electrowelded-images.mjs
--write` adds a transparent annotation layer using the same bundled Inter renderer
as VGP. Arrow and extension-line coordinates follow the respective marked references.
Headings use spaces around `×`: `57 × 3` and `89 × 3,5`.
The photograph is never resized, regenerated or retouched. Before final JPG
encoding, the renderer checks every pixel outside the annotation alpha mask
against the decoded source: **zero changed pixels**. JPEG encoding is lossy,
so this invariant applies to the composition before encoding, not the final
decoded JPG. Source hashes, labels and verification
results are recorded in `imports/electrowelded-image-template/rendered.json`;
native crops, the complete contact sheet and annotation masks are in
`.tmp/electrowelded-original-qa/`. Use `--preview local-58634` for a non-reference
325 × 10 mm variant without changing published mappings.

The tabulated mass for each illustration is recorded in
`imports/electrowelded-image-template/mass-reference.json`.
The three supplier offers with a nominal length range retain **11–12 м**;
this is not replaced with a fixed 12 m value. At the owner's request, the legacy
demonstration records `prd-073` and `prd-074` were removed from the public catalog
on 2026-11-22, including their illustration mappings. They remain archived in
source data through `data/catalog-visibility.ts`, as do the earlier VGP demos.

The actual versioned JPGs were checked from table/card thumbnails at desktop
and mobile sizes, including fitted and native-zoom dialogs, for the smallest
section, a decimal wall, the largest section/range length and galvanized pipe.
Screenshots are in `.tmp/electrowelded-image-preview/`.

## Разметка арматуры

Эталоны для рифлёной А500С и А400 лежат в `public/images/catalog/armatura/originals/riflenaya/`, для гладкой А240 — в соседней папке `gladkaya/`. Обе папки содержат чистую фотографию и авторский JPG с разметкой. Рендерер использует образец с разметкой для нужной подкатегории и меняет только подписи и просвет в размерной линии. Профиль А240 определяется по подкатегории, поскольку в старом импорте у разных классов указана одна и та же поверхность.

У прутка подписаны номинальный диаметр, длина по каталогу и теоретическая масса метра. У бунта на месте длины стоит «Форма поставки — В бунтах». Для А400 заголовок различает 35ГС и 25Г2С. Суффикс «С» у А240С берётся из класса конкретного товара. У демонстрационных позиций для заголовка и размерной линии берётся номинальный диаметр из публичного названия товара. Поля длины и массы у этих позиций остаются пустыми.

Для предпросмотра выполните `node scripts/render-rebar-images.mjs --preview rebar-a500c-18-bar`. Иллюстрация появится в `.tmp/rebar-image-render/`. После визуальной проверки `node scripts/render-rebar-images.mjs --write` пересобирает изображения всех подкатегорий и их привязку к товарам. Затем выполните `node scripts/catalog-image-versions.mjs`, чтобы обновить версии для браузера.

## Beam product illustrations

The 38 beam rows use the four marked 2400 × 1800 JPGs supplied for Б, Ш, К and М.
The dedicated renderer preserves reference pixels outside changed labels and
checks each SKU's assortment standard before printing numerical dimensions.
The seven supplier rows with a reference mass show the catalogue calculator's
kg/m value under «Справочная масса» and keep symbolic dimension labels.
The [beam template guide](../imports/beam-image-template/README.md) lists the
source tables, preview and write commands, and treatment of incomplete records.

## Steel strip product illustrations

The 19 «Полоса стальная» rows use the owner's 20×4 mm marked reference and
clean photograph from `public/images/catalog/polosa/originals/`. Each row shows its
width below the cut face and its thickness on the left. The length comes
from the product specifications, including the 5,85–6 м range for 100×4 mm.

All 19 supplier cards were checked on 21.11.2026. Their source URLs, page
hashes, dimensions, delivery lengths and mass discrepancies are recorded in
`data/flat-steel-specifications.json`. Seven masses differ substantially from
the nominal calculation and two differ by 0.01 kg/m. The public catalog applies
these verified parameters by ID, source URL and section through `lib/flatSteel.ts`.
It also supplies the mass to the compact cart catalog. The image renderer reads
the same mass, rounding its label to two decimals. Product characteristics keep
three-decimal precision, matching the standard's tables.

The nominal formula is `width × thickness × 0.00785` kg/m for dimensions in
millimetres. The density convention (7 850 kg/m³) comes from
ГОСТ 103-2006, Table 1, Note 1.
40×3 lies outside this standard's thickness scope and uses a geometric mass
calculation. Clause 2.3 covers 80×4 and 100×4 by agreed specification.
The public descriptions use each product's confirmed dimensions and remove
copied sizes and obsolete ГОСТ 103-76 claims. Steel grade, manufacturing method,
accuracy class and the shipment's actual standard require supplier documentation.

Preview the 100×4 mm image with
`node scripts/render-flat-steel-images.mjs --preview catalog-12050`.
After visual review run `node scripts/render-flat-steel-images.mjs --write`,
then `node scripts/catalog-image-versions.mjs`.

## Product illustrations for the remaining categories

Owner-requested corrections from 08.11.2026 removed the number sign from all 152
product illustrations that contained it at that date. This is the historical
correction scope; the eight categories removed on 09.11.2026 and their image
records are no longer part of the active catalog. Dedicated templates keep the
original following raster glyphs and shift them left; generic illustrations
replace only their text-only heading region. All product-photo pixels stay exact.
The renderers retain these corrections on regeneration. The cold-rolled 0.5 mm
sheet also uses the shared text and dimension-line palette through an annotation
mask that protects the metal photograph. Original marked reference files remain
archived intact; the first tread plate uses a corrected WebP. See
[the correction record](../imports/number-sign-removal/README.md) for scope,
patches, saved before/after comparisons and visual verification.

Family-specific descriptions below document the original numeric annotation
pass. The final heading and palette corrections described above follow it.

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

The parameterized square pipes use the owner's clean and marked photographs
under `public/images/catalog/truby-profilnye/truba-profilnaya-kvadratnaya/originals/`. The source files
are retained. `scripts/render-profile-square-images.mjs` replaces only variable
numeric labels on the 2400 × 1800 marked reference, using clean-photo patches
and the confirmed catalog dimensions, wall thickness, length and theoretical
mass. Fixed captions, arrows and all pixels outside those patches stay exact.
The output is lossless WebP at the existing product URLs and is connected through
`data/product-illustrations.json`, including the current catalog signature.

Preview a non-reference item with
`node scripts/render-profile-square-images.mjs --preview profile-pipe-square-100x100x5`.
After visual review, generate with `--write` and optional product IDs, then
refresh image versions. See the
[template notes](../imports/profile-square-image-template/README.md) and
`imports/profile-square-image-template/rendered.json` for patch geometry, exact
labels, typography and protected-pixel checks. This renderer leaves rectangular
pipe images unchanged.

### Rectangular profile-pipe illustrations

The 23 parameterized rectangular pipes use the owner's clean original and marked
reference under `public/images/catalog/truby-profilnye/truba-profilnaya-pryamougolnaya/originals/`.
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

The profile tube directory is `public/images/catalog/truby-profilnye/`.
The category title photo is in `main/`. Family directories contain their own
`cover/`, `originals/` and `measurement/` folders.

## Validation

- Verify image paths, filename case, dimensions and associations with the corresponding products.
- `npm run lint` checks the application code.
- `npm run build`: production build and TypeScript validation.
- Open the changed catalog pages and verify loaded images, galleries and viewer behavior in the browser.

## Image filenames

Catalog images in `public/images/catalog/` use descriptive Latin filenames (for example, `armatura.png`, `balka.jpeg`, and `truby-profilnye.jpeg`). Shared product and category references are maintained in `data/catalog-images.json`. The mapping script preserves these names during regeneration. Homepage banner files in `public/images/hero/` are separate.

## Replacing images and cache updates

Replace the image at its existing path. `npm run dev` checks catalog image contents every second and updates `data/catalog-image-versions.json` when files change. Image components and original-image links append a content version to the URL, so a replacement gets a new browser and Next.js image cache entry. Restart the dev server once after installing this workflow; subsequent image replacements need no restart. Refresh an already open page if necessary.

`npm run build` regenerates the versions automatically before building. For production, rebuild and deploy both the application and public images together; copying a file alone does not update pre-rendered pages. Changing a filename or extension still requires updating `data/catalog-images.json`.

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
`public/images/catalog/ugolok/measurement/ugolok-stalnoy-*.webp`. The table and mobile cards
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

## Sheet illustration candidates

The unannotated sheet references in `imports/listovoy-image-sources/` are preparation assets.
Confirm the tread pattern and PVL 306/406 geometry against the intended variant
before generating new labels. Use dimensions and grades from the local catalog.

The owner-selected tread plate previously had a separate clean layout.
Its source, exact imagegen prompt, generation dimensions and review notes are in
[`imports/list-rifleniy-image-template/`](../imports/list-rifleniy-image-template/README.md).
The owner approved the smaller placement and requested a 200 px shift to the left.
The final composition was rebuilt with the original PNG as its appearance
source and the approved placement as a composition reference. The final canvas is
2400 × 1800; the built-in imagegen result was 1448 × 1086 and was exported uniformly,
then translated exactly -200 px horizontally without resampling the retained pixels.
This is an AI-recomposed illustration, not a pixel-identical source transform.
The next revision increases the plate footprint by about 20%, keeping its left
boundary at x=854 and bottom boundary at y=1338. All four corners remain visible.
The first oversized attempt is recorded as rejected.

The historical annotation example used the `catalog-2202` dimensions of 4 mm
base thickness, 1500 mm width and 6000 mm length. It used the same bundled
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
`public/images/catalog/listovoy-prokat/list-riflennyj/originals/`. The marked JPG serves
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
`public/images/catalog/listovoy-prokat/galvanized-steel-sheet/originals/`. The marked JPG
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
`public/images/catalog/listovoy-prokat/list-ocynkovannyj/originals/`.
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
`public/images/catalog/listovoy-prokat/list-goryachekatanyj/originals/`.
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


## Angle and steel square category covers

The category and product-type cards use the supplied 1200 × 600 warehouse
photographs: `ugolok/ugolok-main.jpg` and `kvadrat/kvadrat_main.jpg` under
`public/images/catalog/`. The same covers appear at the top of the category pages.
These unannotated covers are separate from individual product illustrations.

The square category is displayed as **Квадрат стальной**, including its internal
subcategory, navigation, metadata and product descriptions. Its URL remains
`/catalog/kvadrat`. The catalog data and cover gallery provide the names and images.

## Steel square product illustrations

The seven products on `/catalog/kvadrat` use the same six-column profile table
and mobile previews as channels and angles. Each row shows its section, supplier
length, theoretical mass and its own 2400 × 1800 lossless WebP illustration.
The section filter uses the profile number (8×8 through 20×20 mm), separately
from the supplier's `Размер` field, which means length (6 m for all seven).

The owner's marked `public/images/catalog/kvadrat/originals/kvadrat_2400_1800_marked.jpg` and
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
