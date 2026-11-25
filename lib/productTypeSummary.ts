import {isPublicProduct} from "@/data/catalog-visibility";
import type {ProductType, ProductVariant} from "@/types/product";
import {isDemonstrationProduct, requiresCatalogPriceQuote} from "./catalogOffer";
import {isMetalMeshVariant, metalMeshSpecification} from "./metalMesh";
import {isProfilePipeVariant, profilePipePricePerTon} from "./profilePipe";
import {getSheetParameters, isIllustratedSheet} from "./sheetPresentation";

type PricedProduct = ProductVariant & {price: number};

export function getProductTypeSummary(productType: ProductType, variants: ProductVariant[]) {
  // Cards may receive a filtered subset; never include another family or archived data.
  const products = variants.filter(product => product.productTypeId === productType.id
    && product.subcategoryId === productType.subcategoryId && product.categoryId === productType.categoryId
    && isPublicProduct(product));
  const attributeValues = (key: "material" | "standard") => [...new Set(products.filter(product => !isDemonstrationProduct(product)).flatMap(product =>
    product.attributes.filter(attribute => attribute.key === key && attribute.value.trim())
      .map(attribute => attribute.value),
  ))].join(", ") || "Уточняется";
  // Owner-confirmed offers can supply a price without validating old demo specifications.
  const priced = products.filter((product): product is PricedProduct =>
    product.price !== null && product.price > 0 && !requiresCatalogPriceQuote(product));

  return {
    material: productType.materialDescription ?? attributeValues("material"),
    standard: productType.referenceStandard ?? attributeValues("standard"),
    standardLabel: productType.referenceStandard ? "ГОСТ класса" : "Стандарт",
    ...summarizePrices(priced),
  };
}

function summarizePrices(products: PricedProduct[]) {
  if (products.length === 0) return {minimumPrice: null, priceUnit: ""};

  if (products[0].categoryId === "cat-trp") {
    const pricesPerTon = products.filter(isProfilePipeVariant).map(profilePipePricePerTon)
      .filter(price => price !== undefined);
    return {minimumPrice: pricesPerTon.length ? Math.min(...pricesPerTon) : null, priceUnit: "за тонну"};
  }

  const byUnit = Map.groupBy(products, product => `${product.unit}:${product.priceUnit}`);
  if (byUnit.size > 1 && products.every(isIllustratedSheet)) {
    const pricesPerSquareMeter = products.flatMap(product => {
      if (product.unit === "square_meter") return [product.price];
      if (product.unit !== "piece" && product.unit !== "sheet") return [];
      const sheet = getSheetParameters(product);
      const area = sheet ? Number(sheet.width) * Number(sheet.length) / 1e6 : 0;
      return Number.isFinite(area) && area > 0 ? [product.price / area] : [];
    });
    if (pricesPerSquareMeter.length) {
      return {minimumPrice: Math.min(...pricesPerSquareMeter), priceUnit: "за квадратный метр"};
    }
  }

  if (byUnit.size > 1 && products.every(isMetalMeshVariant) && products.some(product => product.priceUnit === "за рулон")) {
    const pricesPerRoll = products.flatMap(getRollPrice);
    if (pricesPerRoll.length) return {minimumPrice: Math.min(...pricesPerRoll), priceUnit: "за рулон"};
  }

  // A family without a shared conversion displays the price for its most common unit.
  const [primary] = [...byUnit.values()].sort((left, right) => right.length - left.length);
  return {minimumPrice: Math.min(...primary.map(product => product.price)), priceUnit: primary[0].priceUnit};
}

function getRollPrice(product: PricedProduct) {
  if (product.unit === "piece" && product.priceUnit === "за рулон") return [product.price];
  if (product.unit !== "meter") return [];
  const length = metalMeshSpecification(product, "Размер рулона")
    .match(/^(?:\d+(?:[.,]\d+)?\s*[хx×]\s*)?(\d+(?:[.,]\d+)?)\s*м\.?$/iu)?.[1];
  const meters = Number(length?.replace(",", "."));
  return Number.isFinite(meters) && meters > 0 ? [product.price * meters] : [];
}
