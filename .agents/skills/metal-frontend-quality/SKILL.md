---
name: metal-frontend-quality
description: Audit metal-frontend architecture, behavior, and storefront changes. Use alongside the affected domain skill for audits and cross-cutting changes.
---

# Metal Frontend Quality

Read `AGENTS.md` and [the development workflow](../../../docs/development-workflow.md). Use domain skills for product facts and calculations.

## Audit boundaries

- Distinguish application defects from unconfigured integrations. The 2026-11-04 audit is recorded in `docs/development-audit-2026-11-04.md`.
- Trace an export through application imports, generators, dynamic loaders and documents before removing it. Include image manifests and the generated cart projection when tracing consumers.
- Preserve approved public assets and local image-generation inputs. See [catalog images](../../../docs/catalog-images.md#структура-каталога-изображений) for the active directories and path conventions.
- Decompose around independently understandable behavior: family dispatch, pure filtering, row/card rendering, cart mutations and checkout transport. Avoid abstractions that merely move a few JSX lines or duplicate business rules.

## Verification

- The project uses lint, type checking, builds and manual browser checks. Automated test suites and screenshot baselines were removed. Check cart and server pricing separately from layout when the change affects both.
- For interface changes, check the affected routes and states using [the UI workflow](../../../docs/development-workflow.md#локальные-задачи-по-интерфейсу-и-изображениям). Preserve the user's browser storage. Use local mocks when checking form submission without external delivery.
- For images, follow the [reference-to-result quality review](../../../docs/catalog-images.md#image-quality-review-required). Include a generated variant when checking a renderer change.
- Report the checks performed and any remaining limitations.
