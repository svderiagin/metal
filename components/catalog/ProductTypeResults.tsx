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

  return (
    <section id="catalog-types" className="scroll-mt-6" aria-label="Типы продукции">
      <ProductTypeGrid productTypes={productTypes} variants={variants}/>
    </section>
  );
}
