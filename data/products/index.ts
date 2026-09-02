import {armaturaProducts} from "./armatura";
import {armaturaA500cVariants} from "./armaturaA500c";
import {balkaProducts} from "./balka";
import {katankaProducts} from "./katanka";
import {kvadratProducts} from "./kvadrat";
import {krugProducts} from "./krug";
import {listovoyProkatProducts} from "./listovoyProkat";
import {otvodyProducts} from "./otvody";
import {polosaProducts} from "./polosa";
import {provolokaProducts} from "./provoloka";
import {trubyStalnyeProducts} from "./trubyStalnye";
import {trubyNerzhaveyushchieProducts} from "./trubyNerzhaveyushchie";
import {trubyProfilnyeProducts} from "./trubyProfilnye";
import {ugolokProducts} from "./ugolok";
import {shvellerProducts} from "./shveller";
import {shestigrannikProducts} from "./shestigrannik";
import {tsvetnoyMetalloprokatProducts} from "./tsvetnoyMetalloprokat";
import type {ProductVariant, ProductVariantSource, ProductWeight} from "@/types/product";

const productSources: ProductVariantSource[] = [
  ...armaturaProducts.filter((product) => product.subcategoryId !== "cat-arm-sub-1"),
  ...armaturaA500cVariants,
  ...balkaProducts,
  ...katankaProducts,
  ...kvadratProducts,
  ...krugProducts,
  ...listovoyProkatProducts,
  ...otvodyProducts,
  ...polosaProducts,
  ...provolokaProducts,
  ...trubyStalnyeProducts,
  ...trubyNerzhaveyushchieProducts,
  ...trubyProfilnyeProducts,
  ...ugolokProducts,
  ...shvellerProducts,
  ...shestigrannikProducts,
  ...tsvetnoyMetalloprokatProducts,
];

export const productVariants: ProductVariant[] = productSources.map((product) => ({
  ...product,
  productTypeId: `type-${product.subcategoryId}`,
  unit: normalizeUnit(product.priceUnit),
  material: attributeValue(product, "material"),
  standard: attributeValue(product, "standard"),
  availability: product.inStock ? "IN_STOCK" : "ON_ORDER",
  weight: product.weightPerMeterKg !== undefined
    ? {value: product.weightPerMeterKg, unit: "кг/м"}
    : estimateDemoWeight(product),
}));

function estimateDemoWeight(product: ProductVariantSource): ProductWeight {
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
