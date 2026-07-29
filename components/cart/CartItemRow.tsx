"use client";
import Link from "next/link";
import type {CartLine} from "@/types/cart";
import {useCart} from "@/hooks/useCart";
import {formatCurrency} from "@/lib/currency";
import {QuantitySelector} from "./QuantitySelector";

export function CartItemRow({line}: { line: CartLine }) {
  const {updateQuantity, removeItem} = useCart();
  return <article
    className="grid gap-4 border-b border-slate-200 py-5 last:border-0 md:grid-cols-[1fr_auto_auto] md:items-center">
    <div><p className="text-xs text-slate-500">{line.sku}</p><Link
      href={`/catalog/${line.categorySlug}/${line.slug}`}
      className="font-bold hover:text-red-700">{line.name}</Link><p
      className="mt-1 text-sm text-slate-500">{formatCurrency(line.price)} {line.priceUnit}</p></div>
    <QuantitySelector value={line.quantity} onChange={v => updateQuantity(line.productId, v)}/>
    <div className="flex items-center justify-between gap-5 md:block md:min-w-32 md:text-right">
      <strong>{formatCurrency(line.price * line.quantity)}</strong>
      <button type="button" onClick={() => removeItem(line.productId)}
              className="block text-sm text-red-700 underline md:ml-auto md:mt-2">Удалить
      </button>
    </div>
  </article>
}
