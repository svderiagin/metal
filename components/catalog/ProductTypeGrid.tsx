import type {ProductType, ProductVariant} from "@/types/product";
import {ProductTypeCard} from "./ProductTypeCard";

export function ProductTypeGrid({
  productTypes,
  variants,
}: {
  productTypes: ProductType[];
  variants: ProductVariant[];
}) {
  return (
    <div className="grid auto-rows-fr gap-4 md:grid-cols-2">
      {productTypes.map((productType) => (
        <ProductTypeCard
          key={productType.id}
          productType={productType}
          variants={variants.filter((variant) => variant.productTypeId === productType.id)}
          categorySlug={productType.categorySlug}
          subcategorySlug={productType.subcategorySlug}
        />
      ))}
    </div>
  );
}
