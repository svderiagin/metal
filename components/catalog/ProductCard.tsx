import Link from "next/link";
import type {Product} from "@/types/product";
import {getCategoryById, getSubcategoryById} from "@/lib/catalog";
import {formatCurrency} from "@/lib/currency";
import {AddToCartButton} from "@/components/cart/AddToCartButton";

export function ProductCard({product}: { product: Product }) {
  const category = getCategoryById(product.categoryId);
  const subcategory = getSubcategoryById(product.subcategoryId);
  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="flex h-40 items-center justify-center border-b border-slate-200 bg-[linear-gradient(135deg,#f8fafc_25%,#e2e8f0_25%,#e2e8f0_50%,#f8fafc_50%,#f8fafc_75%,#e2e8f0_75%)] bg-[length:20px_20px] p-4">
        <span className="rounded-lg bg-slate-900/90 px-4 py-2 text-center text-sm font-bold text-white">
          {subcategory?.name}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{product.sku}</p>
        <h3 className="mt-1 text-lg font-bold text-slate-950">
          <Link
            href={`/catalog/${category?.slug}/${product.slug}`}
            className="rounded-sm transition-colors hover:text-red-700"
          >
            {product.name}
          </Link>
        </h3>
        <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">{product.shortDescription}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {product.attributes.slice(0, 2).map((attribute) => (
            <span key={attribute.key} className="rounded-md bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
              {attribute.value}
            </span>
          ))}
        </div>
        <div className="mt-5 flex items-end justify-between gap-4 border-t border-slate-100 pt-5">
          <div>
            <strong className="block text-xl">{formatCurrency(product.price)}</strong>
            <span className="text-xs text-slate-500">{product.priceUnit}</span>
          </div>
          <AddToCartButton productId={product.id} compact disabled={!product.inStock}/>
        </div>
      </div>
    </article>
  );
}
