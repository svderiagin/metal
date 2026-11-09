import {getCategoryById, getProductTypeById, getProductVariantById, getSubcategoryById} from "./cartCatalog";
import {revalidateCartPrice} from "./cartPricing";
import {getQuantityUnit, requiresWholeMetalMeshQuantity, requiresWholeRozmetQuantity} from "./variantPresentation";
import type {CartItem, CartLine, CartMeasurement} from "@/types/cart";
import {normalizePieceOrder} from "./profilePipe";
import {isProfileSheetVariant} from "./profileSheet";
import {isDemonstrationProduct} from "./catalogOffer";
import {tonsToMeters} from "./orderMeasurement";

export function normalizeCartItems(value: unknown): CartItem[] {
  if (!Array.isArray(value)) return [];
  // A product has one editable cart line. For legacy duplicates keep its last saved state.
  const items = new Map<string, CartItem>();
  for (const item of value) {
    if (!item || typeof item.productId !== "string" || !Number.isFinite(item.quantity) || item.quantity <= 0) continue;
    const measurement = normalizeMeasurement(item.measurement);
    const pieceOrder = normalizePieceOrder(item.pieceOrder);
    if (item.measurement !== undefined && !measurement) continue;
    if (item.pieceOrder !== undefined && !pieceOrder || measurement && pieceOrder) continue;
    items.set(item.productId, pieceOrder
      ? {productId: item.productId, quantity: pieceOrder.pieces * pieceOrder.lengthMeters, pieceOrder}
      : measurement
      ? {productId: item.productId, quantity: measurement.inputMode === "meter" ? measurement.meters : measurement.weightTons, measurement}
      : {productId: item.productId, quantity: item.quantity});
  }
  return [...items.values()];
}

export function normalizeMeasurement(value: unknown): CartMeasurement | undefined {
  if (typeof value !== "object" || value === null) return undefined;
  const input = value as Partial<CartMeasurement>;
  if (input.inputMode !== "meter" && input.inputMode !== "ton") return undefined;
  if (typeof input.meters !== "number" || !Number.isFinite(input.meters) || input.meters <= 0
    || typeof input.weightTons !== "number" || !Number.isFinite(input.weightTons) || input.weightTons <= 0) return undefined;
  // Cached money is never trusted: createCartLines recalculates it from local catalog data.
  return {inputMode: input.inputMode, meters: input.meters, weightTons: input.weightTons, pricePerTon: 0, estimatedTotal: 0};
}

export function createCartLines(items: CartItem[]): CartLine[] {
  return items.map(item => {
    const product = getProductVariantById(item.productId);
    if (!product) return {...item, name: "Позиция больше не доступна в каталоге", slug: "", categorySlug: "", subcategorySlug: "", productTypeSlug: "", sku: item.productId, price: 0, priceUnit: "", quantityUnit: "", estimatedTotal: 0, invalidReason: "Удалите позицию или уточните замену."};
    const category = getCategoryById(product.categoryId);
    const subcategory = getSubcategoryById(product.subcategoryId);
    const productType = getProductTypeById(product.productTypeId);
    let pricingInput = item;
    if (!item.measurement && !item.pieceOrder && product.unit === "ton" && !isDemonstrationProduct(product)
      && product.weightPerMeterKg !== undefined && Number.isFinite(product.weightPerMeterKg) && product.weightPerMeterKg > 0
      && product.pricePerTon !== undefined && Number.isFinite(product.pricePerTon) && product.pricePerTon > 0) {
      const meters = tonsToMeters(item.quantity, product.weightPerMeterKg);
      // Derive a canonical order projection without rewriting saved state or correcting its volume.
      if (meters !== null && meters > 0) pricingInput = {...item, measurement: {inputMode: "ton", meters,
        weightTons: item.quantity, pricePerTon: 0, estimatedTotal: 0}};
    }
    const pricing = revalidateCartPrice(product, pricingInput);
    // Keep the saved units visible if current catalog data can no longer convert them.
    // Cached money still has no authority and an invalid line cannot reach checkout.
    const measurement = pricing.measurement ?? (pricing.invalidReason && item.measurement
      ? {...item.measurement, pricePerTon: 0, estimatedTotal: 0} : undefined);
    return {
      ...item,
      ...pricing,
      measurement,
      name: product.name,
      slug: product.slug,
      categorySlug: category?.slug ?? "catalog",
      subcategorySlug: subcategory?.slug ?? "catalog",
      productTypeSlug: productType?.slug ?? "variants",
      sku: product.sku,
      price: product.price ?? 0,
      priceUnit: product.priceUnit,
      quantityUnit: getQuantityUnit(product),
      wholeQuantity: isProfileSheetVariant(product) || requiresWholeMetalMeshQuantity(product) || requiresWholeRozmetQuantity(product),
    };
  });
}
