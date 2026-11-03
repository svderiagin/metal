---
name: metal-frontend-orders
description: Maintain metal-frontend cart, quantity controls, pricing conversions, inquiry forms, checkout and order/payment API. Use for purchase and request behavior in this repository; pure styling and supplier imports have separate skills.
---

# Metal Frontend Orders

## Read the affected path

- Cart UI/state: `components/cart/`, `context/CartContext.tsx`, `hooks/useCart.ts`, `lib/cart.ts`; validated add/update mutations: `lib/cartMutations.ts`.
- Client product lookup: `lib/cartCatalog.ts` → generated `data/cart-catalog.json`; projection: `lib/cartProjection.ts`, `scripts/cart-catalog.mjs`.
- Shared authoritative price calculation: `lib/cartPricing.ts`, `lib/orderMeasurement.ts`. Specialized constraints: `lib/rebar.ts`, `beam.ts`, `vgp.ts`, `profilePipe.ts`, `profileSheet.ts`, `metalMesh.ts`.
- Table/card order controls: `ProductOrderControls.tsx`, `MeasuredVariantItem.tsx`, `ProfilePipeVariantItem.tsx`, specialized catalogs in `components/catalog/`.
- Inquiry prefilling: `lib/quoteRequest.ts`, `lib/quoteValidation.ts`, `components/forms/QuoteRequestContext.tsx`, `QuoteRequestForm.tsx`, `components/catalog/QuoteRequestButton.tsx`.
- Other forms: `components/forms/ContactForm.tsx`, `PhoneInput.tsx`; checkout: `components/checkout/`.
- Checkout field UI: `CheckoutFields.tsx`; payload/limits: `lib/checkout.ts`; HTTP/payment redirects: `lib/checkoutClient.ts`; validated receipt storage with an in-memory fallback: `lib/orderConfirmation.ts`.
- API boundary: `app/api/{contact,quote,orders}/route.ts`, `app/api/payments/{create,webhook}/route.ts`; `lib/server/{validation,orders,payments,notifications}.ts`, `lib/apiResponse.ts`.

Read only the path relevant to the request. Before changing Route Handlers, read the local Next.js guide `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md` and the matching API reference if needed.

## Preserve calculation and trust rules

- Saved cart state is input, not a trusted price list. Restore IDs/quantities/measurements and reprice using current variants. Unknown IDs remain visible and block checkout. Storage failures must leave an in-memory cart usable.
- Keep full precision through weight conversion and round monetary lines at the established boundary. Do not duplicate formulas in components or fall back from an invalid total to zero.
- Profile pipes preserve piece count and selected pipe length; VGP rounds up to whole pipe lengths. Mesh/piece and measured products have different quantity constraints. Change the corresponding helper and verify both cart and server behavior when changing these rules.
- Distinguish unknown/from/quote-only prices from ordinary purchase prices. Keep inquiry quantity, unit and computed tonnes consistent with the selected variant.
- API success requires both an appropriate HTTP status and the expected `ok: true` payload. Preserve entered form data/cart on failure; clear stale success messages before resubmission.
- Order requests must include `consent: true` and unique product IDs. Contact/checkout phone validation is shared in `lib/validation.ts`; the quote form intentionally has its own Russian-mobile contract. JSON endpoints use `lib/server/request.ts` to cap the actual body at 64 KiB, not just trust Content-Length. Webhooks retain their provider-owned raw-body boundary.
- Receipt storage is untrusted. A direct visit to `/order/success` is not proof of an order; use `readOrderConfirmation`. A storage exception must not convert an already accepted order into an apparent submission failure. Hosted payment redirects must be absolute HTTPS URLs; provider-specific allowlisting belongs to the configured adapter.
- Server totals come from current catalog data. Payment status is confirmed by a verified webhook, not a redirect or browser flag; secrets remain server-only.

## Integration boundaries

At the 2026-10-30 audit, notification and payment adapters were unconfigured; production order storage was unconfigured and development storage was process-local. Inspect the current adapters before assuming this is still true. A deliberate 503 must not become a fake success. Environment placeholders alone do not implement a provider.

UI testing does not require sending real inquiries or initiating payments. Use focused tests and, when the browser tool supports it, explicit local response mocks. Real external delivery/provider setup must belong to the user's requested task.

## Verify

Follow [the shared check matrix](../../../docs/development-workflow.md), including regenerating the cart projection after source price/product changes. Focused tests in `scripts/`: `cart-and-order`, `cart-projection`, `product-order-controls`, `measured-order-controls`, `quote-request`, `quote-validation`, `quote-form` (all `.test.mjs`), plus the affected product family's test.

For changed behavior verify one normal path and the relevant invalid quantity, stale/unknown product, unavailable storage or API rejection. Do not run every edge case for a copy edit. Report actual checks and any remaining unconfigured integration.

Direct imports of current TypeScript behavior are tested in `tests/unit/{catalog-and-cart,checkout,api}.test.ts`; mocked browser submissions and persistence in `tests/e2e/orders.spec.ts`. Use the commands in [testing.md](../../../docs/testing.md). Avoid new source-text/VM assertions for behavior that can be imported or exercised through the DOM.
