---
name: metal-frontend-ui
description: Edit metal-frontend layout, responsive styling, theme, navigation, images, home and informational pages. Use for visual and accessibility changes in this repository; catalog facts and order calculations have separate skills.
---

# Metal Frontend UI

Preserve the existing visual language unless the user requests a redesign: red actions, slate surfaces, locally hosted Inter, rounded panels, light/dark/system themes. Reuse the nearest existing component rather than adding a UI library.

## Find the owner

| Task | Start here |
| --- | --- |
| Page width, header/menu/footer | `components/layout/`; `PageContainer.tsx` sets 1360 px maximum; links in `lib/constants.ts` |
| Company facts | `lib/companyDetails.ts`; do not invent contact or commercial details |
| Home sections/carousel | `components/home/`, `data/hero-slides.ts`; `docs/hero-carousel.md` only for carousel changes |
| Shared controls | `components/ui/`; catalog controls also use `FilterPanel.module.css`, `RebarTable.module.css` |
| Typography | `app/typography.css`, `app/layout.tsx`, `app/fonts/`; read `docs/typography.md` when changing fonts, type scale or text density. |
| Themes | `app/globals.css`, `lib/theme.ts`, `components/layout/ThemeSwitch.tsx`; details: `docs/theme.md` |
| Product photos/dialog | `CatalogImage.tsx`, `ProductImageViewer.tsx`, `ChannelProductPreview.tsx`, `lib/catalog-image.ts` |
| Category/family title gallery | `CatalogCoverGallery.tsx`, `CatalogCoverViewer.tsx`, `data/catalog-cover-galleries.ts`; behavior and adding supplied photos: `docs/catalog-cover-gallery.md` |
| Generic product rows/cards | `VariantCatalogResults.tsx`; filters: `GenericProductVariantCatalog.tsx` and `lib/variantCatalog.ts` |
| Category layout | `app/catalog/[categorySlug]/page.tsx`; contains special layout branches. Table/card markup lives in `components/catalog/`. |
| About/delivery/services/contacts/privacy | Corresponding `app/<route>/page.tsx`; form behavior is covered by the orders skill |

## Non-obvious constraints

- Typography uses shared `text-page-title`, `text-section-title`, `text-card-title` and `text-eyebrow` roles. `text-sm` is 15 px and `text-xs` is 13 px; editable controls keep 16 px. Preserve local Cyrillic font loading and tabular figures for quantities/prices. Font changes need native-size text review, font-failure/200% text checks, and deliberate screenshot baseline review. Do not regenerate approved bitmap labels for an interface-font change.
- Theme initialization runs before paint in `app/layout.tsx`; preserve the stable server snapshot and existing `suppressHydrationWarning` on `html`. Add dark surfaces, borders, text and state colors together. Do not recolor product photos with filters.
- Use `variant="secondary"` for secondary `Button`/`ButtonLink` controls. Do not append conflicting `text-white` and dark-text utilities to the same element: Tailwind's generated order, not JSX class order, chooses the winner. Check readable labels on both themes.
- Table and mobile-card markup often coexist in one component. Change both presentations when the request affects shared behavior; scope browser locators to the visible control. Check where the category/sidebar appears before assuming no horizontal overflow means good mobile usability.
- Keep image geometry reserved, use the existing URL version helper, and size downloads to rendered width. For new/replaced files read the relevant part of `docs/catalog-images.md`; for loading regressions read `docs/image-performance.md`. Old image-coverage counts are historical.
- Before changing `next/image`, read `node_modules/next/dist/docs/01-app/03-api-reference/02-components/image.md`. Measure the actual visible LCP candidate; avoid preloading every image or copying deprecated `priority` usage.
- Product previews use a native dialog portaled to the body, Escape, scroll locking and focus return. Preserve the approved rounded window, native 1:1 zoom and panning. A gallery for product-row photos was explicitly cancelled; do not add one during unrelated changes. Category/family title photos have a separate approved gallery: click opens a rounded overlay, click on the photo closes it, additional supplied photos enable arrows. Keep these two viewers separate. Frames overlay the thumbnail, preserving its 4:3 content box; adding a layout border creates fractional white gaps.
- Mobile category navigation is collapsed in `CatalogSidebar`; desktop navigation remains expanded. Do not restore the full category list above the mobile H1. The desktop table starts at 1280 px, the sidebar at 1024 px; test both boundaries when changing their ownership or visibility.
- `output/` contains historical preparation assets and rejected variants; public images and the documented templates are authoritative. Do not select a visually plausible draft by filename. Do not retouch an approved product surface to fix CSS geometry.

## Verify proportionally

For local image/viewer/UI tasks, use [the focused UI workflow](../../../docs/development-workflow.md#локальные-задачи-по-интерфейсу-и-изображениям). Choose affected consumers and focused checks before coding, reuse the existing browser fixtures/runtime, and rebuild production only when application changes invalidate it. Preserve the visual review below while limiting reruns to changed behavior and affected screenshots; broaden to full suites when impact or task requirements justify it.

For every product-image replacement, generation or annotation change, follow
[Image quality review](../../../docs/catalog-images.md#image-quality-review-required)
before reporting completion. For generated annotations, compare the supplied
reference with a **regenerated, non-reference variant**, including native-size
crops of typography. Check the actual thumbnail/expanded view for image tasks.
A declared font weight, matching source hash or passing
image-decode test does not establish visual fidelity. Preserve the photo while
correcting labels; inspect every label affected by a renderer/font-backend change.

Use [the shared check matrix](../../../docs/development-workflow.md). Check the changed route at desktop and mobile for responsive edits; check both themes for new colors. Test one relevant empty/error/interaction state. Menu/dialog changes need keyboard and focus verification. Existing focused tests: `theme.test.mjs`, `hero-loading.test.mjs`, `images.test.mjs`, `product-image-preview.test.mjs` in `scripts/`.

Automated browser/image cases live in `tests/e2e/images.spec.ts` and `tests/visual/catalog.visual.spec.ts`; commands and baseline platform are documented in [testing.md](../../../docs/testing.md). Compare existing baselines before deciding to update them. Include deliberately updated PNGs in the commit.

Do not change product prices, identifiers or supplier evidence to achieve a visual result. Report what changed, what was actually viewed/tested, and material limitations.
