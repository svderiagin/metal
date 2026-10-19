import {ProductTypeGrid} from "./ProductTypeGrid";
import type {ProductType, ProductVariant} from "@/types/product";

export function ProductTypeResults({
  productTypes,
  variants,
}: {
  productTypes: ProductType[];
  variants: ProductVariant[];
}) {
  if (!productTypes.length) return null;

  // Сохраняем прежний порядок карточек при первом открытии категории.
  const availableCounts = new Map<string, number>();
  for (const variant of variants) {
    if (variant.inStock) {
      availableCounts.set(variant.productTypeId, (availableCounts.get(variant.productTypeId) ?? 0) + 1);
    }
  }
  const preserveOrder = productTypes.every(type => type.categoryId === "cat-trk")
    || productTypes.every(type => type.categoryId.startsWith("rozmet-cat-"))
    || productTypes.every(type => type.categoryId === "cat-bal")
    || productTypes.every(type => type.categoryId === "cat-pnf")
    || productTypes.every(type => type.categoryId === "cat-mesh");
  const orderedTypes = preserveOrder ? productTypes : [...productTypes].sort((left, right) =>
    (availableCounts.get(right.id) ?? 0) - (availableCounts.get(left.id) ?? 0),
  );

  return (
    <section className="mt-8" aria-label="Типы продукции">
      <ProductTypeGrid productTypes={orderedTypes} variants={variants}/>
    </section>
  );
}
