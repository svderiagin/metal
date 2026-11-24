import {armaturaProducts} from "./armatura";
import {armaturaA500cVariants} from "./armaturaA500c";
import {armaturaA40035gsVariants} from "./armaturaA40035gs";
import {balkaProducts} from "./balka";
import {profnastilProducts} from "./profnastil";
import {metalMeshProducts} from "./metalMesh";
import {roundPipeLegacyProducts} from "./trubaKruglayaLegacy";
import {galvanizedVgpProducts} from "./trubaVgpGalvanized";
import {galvanizedElectroweldedProducts} from "./trubaElectroweldedGalvanized";
import {trubyProfilnyeProducts, profilePipeProducts} from "./trubyProfilnye";
import type {ProductVariant, ProductVariantSource, ProductWeight} from "@/types/product";
import catalogPositions from "../catalog-positions.json";
import additionalCatalog from "../additional-catalog.json";
import catalogImages from "../catalog-images.json";
import {normalizeRebarVariant} from "@/lib/rebar";
import {normalizeBeamVariant} from "@/lib/beam";
import {normalizeGalvanizedVgpVariant} from "@/lib/vgp";
import {normalizeElectroweldedVariant, normalizeGalvanizedElectroweldedVariant} from "@/lib/electroweldedPipe";
import {isPublicProduct} from "@/data/catalog-visibility";
import {isPipeProduct, normalizePipeWeight} from "@/lib/pipeWeight";
import {isRetainedCategory} from "@/data/catalog-scope";
import {applyCatalogOverrides} from "@/lib/catalogOverrides";

const productSources: ProductVariantSource[] = [
  ...armaturaProducts.filter((product) => product.subcategoryId !== "cat-arm-sub-1"),
  ...armaturaA500cVariants,
  ...armaturaA40035gsVariants,
  ...balkaProducts,
  ...profnastilProducts,
  ...metalMeshProducts,
  ...roundPipeLegacyProducts,
  ...galvanizedVgpProducts,
  ...galvanizedElectroweldedProducts,
  ...trubyProfilnyeProducts,
  ...profilePipeProducts,
];

export const existingVariants: ProductVariant[] = productSources.map((product) => ({
  ...product,
  productTypeId: `type-${product.subcategoryId}`,
  unit: normalizeUnit(product.priceUnit),
  material: attributeValue(product, "material"),
  standard: attributeValue(product, "standard"),
  availability: product.availability ?? (product.inStock ? "IN_STOCK" : "ON_ORDER"),
  weight: product.weightPerMeterKg !== undefined
    ? {value: product.weightPerMeterKg, unit: "кг/м"}
    : estimateDemoWeight(product),
}));

const retainedProductVariants: ProductVariant[] = [
  ...existingVariants.filter(p => !(catalogPositions.matchedIds as string[]).includes(p.id)),
  ...(catalogPositions.products as ProductVariant[]).filter(product => isRetainedCategory(product.categoryId)),
].filter(product => isRetainedCategory(product.categoryId)).filter(isPublicProduct).map(normalizeRebarVariant).map(normalizeBeamVariant).map(normalizeGalvanizedVgpVariant).map(normalizeElectroweldedVariant).map(normalizeGalvanizedElectroweldedVariant).map(normalizePipeWeight).map(product => ({
  ...product,
  imageUrls: (catalogImages.products as Record<string, string>)[product.id]
    ? [(catalogImages.products as Record<string, string>)[product.id]]
    : product.imageUrls.length ? [catalogImages.fallback] : [],
}));

export const productVariants: ProductVariant[] = [
  ...retainedProductVariants,
  ...(additionalCatalog.products as ProductVariant[]).filter(isPublicProduct).map(applyCatalogOverrides),
];

function estimateDemoWeight(product: ProductVariantSource): ProductWeight | undefined {
  if (isPipeProduct(product)) return undefined;
  if (product.profileMark) return undefined;
  const size = Number.parseFloat(
    product.attributes.find((attribute) => attribute.key === "size")?.value.replace(",", ".") ?? "0",
  );

  if (product.categoryId === "cat-arm") {
    return {value: round(Math.max(0.1, 0.00617 * size * size)), unit: "кг/м"};
  }

  return {value: round(Math.max(0.1, size * 0.24)), unit: "кг/м"};
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}

function attributeValue(
  product: ProductVariantSource,
  key: ProductVariantSource["attributes"][number]["key"],
) {
  return product.attributes.find((attribute) => attribute.key === key)?.value ?? "";
}

function normalizeUnit(priceUnit: string): ProductVariant["unit"] {
  const normalized = priceUnit.toLocaleLowerCase("ru");
  if (normalized.includes("тонн")) return "ton";
  if (normalized.includes("метр")) return "meter";
  if (normalized.includes("лист")) return "sheet";
  return "piece";
}
