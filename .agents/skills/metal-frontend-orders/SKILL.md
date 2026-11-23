---
name: metal-frontend-orders
description: Maintain metal-frontend cart, quantity controls, price calculations, inquiry forms, checkout and order/payment APIs.
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
- API boundary: `app/api/{contact,quote,orders}/route.ts`, `app/api/payments/{create,webhook}/route.ts`. Invoice downloads use `app/api/orders/[reference]/invoice/route.ts` and `lib/server/invoices.ts`.

Read only the path relevant to the request. Before changing Route Handlers, read the local Next.js guide `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md` and the matching API reference if needed.

## Preserve calculation and trust rules

- Saved cart state is input, not a trusted price list. Restore IDs/quantities/measurements and reprice using current variants. Unknown IDs remain visible and block checkout. Storage failures must leave an in-memory cart usable.
- Apply the [shared input rules](../../../docs/catalog-order-inputs.md) to new or changed fields in the table, mobile cards and cart. Resolve legacy product IDs with `lib/catalogIdentity.ts` when reading saved carts and orders.
- Keep full precision through weight conversion and round monetary lines at the established boundary. Do not duplicate formulas in components or fall back from an invalid total to zero.
- Profile pipes preserve piece count and selected pipe length; VGP rounds up to whole pipe lengths. Mesh/piece and measured products have different quantity constraints. Change the corresponding helper and verify both cart and server behavior when changing these rules.
- For VGP catalogue controls, [check the accepted order behaviour](../../../docs/catalog-product-pages-prompt.md#4-точность-расчётов-и-состояния-заказа). The tonne field accepts and shows up to three decimal places; conversions, whole-pipe count and price use exact values. Verify typing, paste and focus, and show «Не сохранено» below the piece count when an order has been edited.
- Distinguish unknown/from/quote-only prices from ordinary purchase prices. Keep inquiry quantity, unit and computed tonnes consistent with the selected variant.
- API success requires both an appropriate HTTP status and the expected `ok: true` payload. Preserve entered form data/cart on failure; clear stale success messages before resubmission.
- Order requests must include `consent: true` and unique product IDs. Contact/checkout phone validation is shared in `lib/validation.ts`; the quote form intentionally has its own Russian-mobile contract. JSON endpoints use `lib/server/request.ts` to cap the actual body at 64 KiB, not just trust Content-Length. Webhooks retain their provider-owned raw-body boundary.
- Receipt storage is untrusted. Resolve accepted orders using `readOrderConfirmation`. Preserve the successful result if browser storage fails. Payment navigation stays on the storefront origin according to `lib/paymentRedirect.ts`.
- Server totals come from current catalog data. Payment status is confirmed by a verified webhook, not a redirect or browser flag; secrets remain server-only.

## Integration boundaries

Orders use the configured file or PostgreSQL repository. Development defaults to `.local/orders`. For live invoices and SMTP configuration, read [deployment](../../../docs/deployment.md) and [invoice generation](../../../docs/invoice-generation.md). The card payment adapter is currently a placeholder.

For local UI checks, use local response mocks when the browser tool supports them. Real external delivery or provider setup must belong to the user's requested task.

## Verify

Follow [the shared check matrix](../../../docs/development-workflow.md), including regenerating the cart projection after source price or product changes.

For changed behavior verify one normal path and the relevant invalid quantity, stale/unknown product, unavailable storage or API rejection. Do not run every edge case for a copy edit. Report actual checks and any remaining unconfigured integration.
