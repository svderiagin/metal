/** Payment navigation stays on the storefront that created the order. */
export function isPaymentRedirect(value: unknown, storefrontOrigin: string): value is string {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.origin === storefrontOrigin && !url.username && !url.password;
  } catch {
    return false;
  }
}
