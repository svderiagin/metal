// Archived records remain in the local catalog data.
const hiddenProductIds = new Set([
  "prd-071", "prd-072", "prd-073", "prd-074",
  "catalog-26569", "catalog-28931", "catalog-28971",
  "local-118826",
  // A500C duplicates of original positions with the same diameter, form and length.
  "local-44188", "local-17091", "local-1555", "local-73160", "local-1421",
  "local-6340", "local--684", "local-6346", "local-6352", "local-17412",
  "local-6359", "local-1758", "local-17482", "local-61299",
  // Incorrect A500C Ø10 × 12 m position.
  "local-122766",
  // Smooth rebar is offered as A240C for these diameters, forms and lengths.
  "local-6123", "local--705", "prd-007", "prd-008",
  // Profile pipe demos without a complete section, wall thickness or length.
  "prd-087", "prd-088", "prd-089", "prd-090",
  // The 57 × 3 × 12 m electrowelded offer is now represented by local-62388.
  "local-302",
]);
export function isPublicProduct(product: {id: string}): boolean {
  return !hiddenProductIds.has(product.id);
}
