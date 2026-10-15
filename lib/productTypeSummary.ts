import {isPublicProduct} from "@/data/catalog-visibility";
import type {ProductType, ProductVariant} from "@/types/product";

export function getProductTypeSummary(productType: ProductType, variants: ProductVariant[]) {
  // Cards may receive a filtered subset; never include another family or archived data.
  const products = variants.filter(product => product.productTypeId === productType.id
    && product.subcategoryId === productType.subcategoryId && product.categoryId === productType.categoryId
    && isPublicProduct(product));
  const attributeValues = (key: "material" | "standard") => [...new Set(products.filter(product => !product.demo).flatMap(product =>
    product.attributes.filter(attribute => attribute.key === key && attribute.value.trim())
      .map(attribute => attribute.value),
  ))].join(", ") || "Уточняется";
  // Owner-confirmed offers can supply a price without validating old demo specifications.
  const priced = products.filter(product => (!product.demo || product.priceConfirmed)
    && !product.quoteOnly && product.priceQualifier !== "from" && product.price !== null
    && Number.isFinite(product.price) && product.price > 0);
  // Use the internal unit as well as its public label; mixed bases require a quote.
  const sameBasis = new Set(priced.map(product => `${product.unit}:${product.priceUnit}`)).size === 1;
  const priceUnit = sameBasis ? priced[0].priceUnit : "";
  const minimumPrice = sameBasis ? Math.min(...priced.map(product => product.price!)) : null;

  return {
    material: productType.materialDescription ?? attributeValues("material"),
    standard: productType.referenceStandard ?? attributeValues("standard"),
    standardLabel: productType.referenceStandard ? "ГОСТ класса" : "Стандарт",
    minimumPrice,
    priceUnit,
  };
}
