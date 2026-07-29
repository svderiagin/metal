import type {Product} from "@/types/product";
import {ProductCard} from "./ProductCard";

export function ProductGrid({products}: { products: Product[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:gap-6 xl:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product.id} product={product}/>
      ))}
    </div>
  );
}
