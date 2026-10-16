import {armaturaProducts} from "./armatura";
import {armaturaA500cVariants} from "./armaturaA500c";
import {balkaProducts} from "./balka";
import {katankaProducts} from "./katanka";
import {kvadratProducts} from "./kvadrat";
import {krugProducts} from "./krug";
import {listovoyProkatProducts} from "./listovoyProkat";
import {profnastilProducts} from "./profnastil";
import {metalMeshProducts} from "./metalMesh";
import {otvodyProducts} from "./otvody";
import {polosaProducts} from "./polosa";
import {provolokaProducts} from "./provoloka";
import {trubyStalnyeProducts} from "./trubyStalnye";
import {trubyNerzhaveyushchieProducts} from "./trubyNerzhaveyushchie";
import {trubyProfilnyeProducts, profilePipeProducts} from "./trubyProfilnye";
import {ugolokProducts} from "./ugolok";
import {shvellerProducts} from "./shveller";
import {shestigrannikProducts} from "./shestigrannik";
import {tsvetnoyMetalloprokatProducts} from "./tsvetnoyMetalloprokat";
import type {ProductVariant, ProductVariantSource, ProductWeight} from "@/types/product";
import importedCatalog from "../imported-catalog.json";
import catalogImages from "../catalog-images.json";
import {normalizeRebarVariant} from "@/lib/rebar";
import {normalizeBeamVariant} from "@/lib/beam";
import {isPublicProduct} from "@/data/catalog-visibility";
import {isPipeProduct, normalizePipeWeight} from "@/lib/pipeWeight";

const productSources: ProductVariantSource[] = [
  ...armaturaProducts.filter((product) => product.subcategoryId !== "cat-arm-sub-1"),
  ...armaturaA500cVariants,
  ...balkaProducts,
  ...katankaProducts,
  ...kvadratProducts,
  ...krugProducts,
  ...listovoyProkatProducts,
  ...profnastilProducts,
  ...metalMeshProducts,
  ...otvodyProducts,
  ...polosaProducts,
  ...provolokaProducts,
  ...trubyStalnyeProducts,
  ...trubyNerzhaveyushchieProducts,
  ...trubyProfilnyeProducts,
  ...profilePipeProducts,
  ...ugolokProducts,
  ...shvellerProducts,
  ...shestigrannikProducts,
  ...tsvetnoyMetalloprokatProducts,
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

export const productVariants: ProductVariant[] = [
  ...existingVariants.filter(p => !(importedCatalog.matchedIds as string[]).includes(p.id)),
  ...(importedCatalog.products as ProductVariant[]).filter(product => product.categoryId !== "cat-shv"),
].filter(isPublicProduct).map(normalizeRebarVariant).map(normalizeBeamVariant).map(normalizePipeWeight).map(product => ({
  ...product,
  imageUrls: (catalogImages.products as Record<string, string>)[product.id]
    ? [(catalogImages.products as Record<string, string>)[product.id]]
    : product.imageUrls.length ? [catalogImages.fallback] : [],
}));

function estimateDemoWeight(product: ProductVariantSource): ProductWeight | undefined {
  if (isPipeProduct(product)) return undefined;
  if (product.profileMark) return undefined;
  const size = Number.parseFloat(
    product.attributes.find((attribute) => attribute.key === "size")?.value.replace(",", ".") ?? "0",
  );

  if (product.categoryId === "cat-arm") {
    return {value: round(Math.max(0.1, 0.00617 * size * size)), unit: "кг/м"};
  }

  if (product.categoryId === "cat-lis") {
    return {value: round(Math.max(0.1, 7.85 * size)), unit: "кг/м²"};
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
