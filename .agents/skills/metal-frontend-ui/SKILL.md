---
name: metal-frontend-ui
description: Edit metal-frontend layout, responsive styling, theme, navigation, images, home and informational pages. Use for visual and accessibility changes in this repository; catalog facts and order calculations have separate skills.
---

# Metal Frontend UI

Use the current visual language from [docs/theme.md](../../../docs/theme.md): graphite surfaces, steel-blue primary actions, red for errors and removal, locally hosted Inter, and light, dark and system themes. Reuse the nearest existing component.

## Find the owner

| Task | Start here |
| --- | --- |
| Page width, header/menu/footer | `components/layout/`; `PageContainer.tsx` sets 1360 px maximum; links in `lib/constants.ts` |
| Company facts | `lib/companyDetails.ts`; do not invent contact or commercial details |
| Home sections/carousel | `components/home/`, `data/hero-slides.ts`; `docs/hero-carousel.md` only for carousel changes |
| Shared controls | `components/ui/`; catalog controls also use `FilterPanel.module.css`, `RebarTable.module.css` |
| Typography | `app/typography.css`, `app/layout.tsx`, `app/fonts/`; read `docs/typography.md` when changing fonts, type scale or text density. |
| Themes | `app/globals.css`, `lib/theme.ts`, `components/layout/ThemeSwitch.tsx`; details: `docs/theme.md` |
| Product photos/dialog | `CatalogVariantLayout.tsx`, `ProductImageViewer.tsx`, `ChannelProductPreview.tsx`, `lib/catalog-image.ts` |
| Category/family title gallery | `CatalogCoverGallery.tsx`, `CatalogCoverViewer.tsx`, `data/catalog-cover-galleries.ts`; behavior and adding supplied photos: `docs/catalog-cover-gallery.md` |
| Generic product rows/cards | `VariantCatalogResults.tsx`; filters: `GenericProductVariantCatalog.tsx` and `lib/variantCatalog.ts` |
| Category layout | `app/catalog/[categorySlug]/page.tsx`; contains special layout branches. Table/card markup lives in `components/catalog/`. |
| Product-listing layout | [Ordinary VGP reference](../../../docs/catalog-product-pages-prompt.md#2-общая-композиция-страницы); see the relevant section for spacing, navigation, tables, cards, or buying guidance. |
| About/delivery/services/contacts/privacy | Corresponding `app/<route>/page.tsx`; form behavior is covered by the orders skill |

## Non-obvious constraints

- Typography uses shared `text-page-title`, `text-section-title`, `text-card-title` and `text-eyebrow` roles. `text-sm` is 15 px and `text-xs` is 13 px. Editable controls keep 16 px. Preserve local Cyrillic font loading and tabular figures for quantities and prices. Review changed type at native size and 200% zoom. Bitmap product labels use their own templates.
- Theme initialization runs before paint in `app/layout.tsx`; preserve the stable server snapshot and existing `suppressHydrationWarning` on `html`. Add dark surfaces, borders, text and state colors together. Do not recolor product photos with filters.
- Use `variant="secondary"` for secondary `Button`/`ButtonLink` controls. Do not append conflicting `text-white` and dark-text utilities to the same element: Tailwind's generated order, not JSX class order, chooses the winner. Check readable labels on both themes.
- Table and mobile-card markup often coexist in one component. Change both presentations when the request affects shared behavior; scope browser locators to the visible control. Verify that catalogue order-field widths stay stable at a fixed viewport with empty, short and maximum values. Measure the rendered width and text clearance separately. Check where the category/sidebar appears before assuming no horizontal overflow means good mobile usability.
- Keep image geometry reserved, use the existing URL version helper, and size downloads to rendered width. For new/replaced files read the relevant part of `docs/catalog-images.md`; for loading regressions read `docs/image-performance.md`. Old image-coverage counts are historical.
- Before changing `next/image`, read `node_modules/next/dist/docs/01-app/03-api-reference/02-components/image.md`. Measure the actual visible LCP candidate; avoid preloading every image or copying deprecated `priority` usage.
- Product previews use a native dialog portaled to the body, Escape, scroll locking and focus return. Preserve the approved rounded window, native 1:1 zoom and panning. A gallery for product-row photos was explicitly cancelled; do not add one during unrelated changes. Category/family title photos have a separate approved gallery: click opens a rounded overlay, click on the photo closes it, additional supplied photos enable arrows. Keep these two viewers separate. Frames overlay the thumbnail, preserving its 4:3 content box; adding a layout border creates fractional white gaps.
- Mobile category navigation is collapsed in `CatalogSidebar`; desktop navigation remains expanded. Do not restore the full category list above the mobile H1. The desktop table starts at 1280 px, the sidebar at 1024 px; test both boundaries when changing their ownership or visibility.
- Follow the [catalog image layout](../../../docs/catalog-images.md#структура-каталога-изображений). Category card files live at the root of `catalog/`, subcategory card files in their category, and page frames in `gallery/`. Reuse image URLs for shared frames. Keep named product artwork in `measurement/` and the original and marked reference together in `originals/`. Update the local maps and run `node scripts/catalog-image-versions.mjs` after moving assets.

## Verify proportionally

For local image, viewer or UI work, use [the focused UI workflow](../../../docs/development-workflow.md#локальные-задачи-по-интерфейсу-и-изображениям). Identify affected components and check the relevant routes on the local server.

For every product-image replacement, generation or annotation change, follow
[Image quality review](../../../docs/catalog-images.md#image-quality-review-required)
before reporting completion. For generated annotations, compare the supplied
reference with a **regenerated, non-reference variant**, including native-size
crops of typography. Check the actual thumbnail/expanded view for image tasks.
A declared font weight and matching source hash provide technical evidence.
Inspect every label affected by a renderer or font change and preserve the photo
while correcting labels.

Use [the shared check matrix](../../../docs/development-workflow.md). Check the changed route at desktop and mobile widths for responsive edits and both themes for new colors. Verify one relevant empty, error or interaction state. Menu and dialog changes need keyboard and focus verification.

Keep product prices and identifiers stable in visual changes. Report the screens and states checked.
