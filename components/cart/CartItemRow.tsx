"use client";
import Link from "next/link";
import type {CartLine} from "@/types/cart";
import {useCart} from "@/hooks/useCart";
import {formatCurrency} from "@/lib/currency";
import {QuantitySelector} from "./QuantitySelector";

export function CartItemRow({line}: { line: CartLine }) {
  const {updateQuantity, removeItem} = useCart();
  return (
    <article className="grid gap-4 border-b border-slate-200 py-5 last:border-0 sm:py-6 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center md:gap-6">
      <div>
        <p className="text-xs font-medium text-slate-500">{line.sku}</p>
        <Link
          href={`/catalog/${line.categorySlug}/${line.slug}`}
          className="mt-1 inline-block font-bold transition-colors hover:text-red-700"
        >
          {line.name}
        </Link>
        <p className="mt-1 text-sm text-slate-500">
          {formatCurrency(line.price)} {line.priceUnit}
        </p>
      </div>
      <QuantitySelector value={line.quantity} onChange={(value) => updateQuantity(line.productId, value)}/>
      <div className="flex items-center justify-between gap-5 md:block md:min-w-32 md:text-right">
        <strong className="text-lg">{formatCurrency(line.price * line.quantity)}</strong>
        <button
          type="button"
          onClick={() => removeItem(line.productId)}
          className="block min-h-11 text-sm font-medium text-red-700 underline underline-offset-2 md:ml-auto md:mt-1"
        >
          Удалить
        </button>
      </div>
    </article>
  );
}
