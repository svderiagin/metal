---
name: metal-frontend-quality
description: Audit metal-frontend architecture and regressions, add unit/API/browser coverage, and maintain screenshot baselines. Use for audits and test infrastructure, alongside the affected domain skill; not for every small UI edit.
---

# Metal Frontend Quality

Read `AGENTS.md` and [the testing guide](../../../docs/testing.md). Use domain skills for facts and calculations; this skill owns evidence and test selection.

## Audit boundaries

- Separate application defects, stale tests and unconfigured integrations. A historical failing test is evidence to investigate, not permission to overwrite a snapshot. The 2026-11-04 audit is recorded in `docs/development-audit-2026-11-04.md`.
- Trace an export through application imports, scripts, dynamic loaders and documents before removing it. `originalCategories`, `originalSubcategories` and `projectCartProduct` are used by import/test tooling even though runtime call counts look low.
- Preserve supplier evidence and approved public assets. `output/` is an archive of preparation assets, including rejected drafts; it is excluded from lint, not a runtime image source. Keep commit scope consistent with the user's request, including requested image sources and version manifests.
- Decompose around independently understandable behavior: family dispatch, pure filtering, row/card rendering, cart mutations and checkout transport. Avoid abstractions that merely move a few JSX lines or duplicate business rules.

## Regression evidence

- Exercise behavior or invariants. Prefer observable DOM/API contracts over source-text order, literal JSX, or mocks that duplicate the implementation. Keep financial precision and authoritative server repricing covered independently of layout.
- Browser tests use isolated browser contexts and local API mocks. Never submit real requests, create real orders or initiate payment as a side effect of testing.
- Visual baselines need stable browser/version, viewport, theme, local assets, font/image readiness and reduced motion. Scope table snapshots to visible rows; cover the rounded viewer, 1:1 zoom, mobile sidebar and table/card breakpoints. Do not use arbitrary sleeps as readiness assertions.
- Review baseline images visually before accepting them. Update only deliberately changed snapshots; compare twice before claiming deterministic screenshot coverage. A screenshot without a comparison is evidence, not a regression test.
- Report commands actually run, failures and skips, plus the practical scope of coverage. Do not claim exhaustive UI coverage or treat unconfigured provider adapters as implemented.
- Use `npm run test:unit` for a read-only test run without the generating `pretest` hook. New TypeScript behavior tests use `node --import tsx --test`; do not extend the historical VM transpilation harness for new modules. `test:coverage` measures loaded core modules, not whole-application JSX coverage.
- Browser commands share port 3100 and `.next-test`; run them sequentially. Build once after application changes with `npm run test:build`, then compare snapshots without rebuilding for test-only edits. Keep the user's development server and browser storage independent.
