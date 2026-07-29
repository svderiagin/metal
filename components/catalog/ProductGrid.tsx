import type {Product} from "@/types/product";
import {ProductCard} from "./ProductCard";

export function ProductGrid({products}: { products: Product[] }) {
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{products.map(p => <ProductCard key={p.id}
                                                                                                   product={p}/>)}</div>
}
