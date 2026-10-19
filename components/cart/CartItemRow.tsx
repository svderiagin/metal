"use client";
import Link from "next/link";
import {catalogProductPath} from "@/lib/catalogLinks";
import type {CartLine} from "@/types/cart";
import {useCart} from "@/hooks/useCart";
import {formatCurrency, formatUnitPrice} from "@/lib/currency";
import {formatNumber} from "@/lib/numberFormat";
import {QuantitySelector} from "./QuantitySelector";

export function CartItemRow({line}: { line: CartLine }) {
  const {updateQuantity, removeItem} = useCart();
  return (
    <article className="grid gap-4 border-b border-slate-200 dark:border-slate-700 py-5 last:border-0 sm:py-6 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center md:gap-6">
      <div>
        {line.slug ? <Link
          href={catalogProductPath(line.categorySlug, line.subcategorySlug, line.productTypeSlug, line.productId)}
          className="inline-block font-bold transition-colors hover:text-red-700 dark:hover:text-red-400"
        >
          {line.name}
        </Link> : <p className="font-bold">{line.name}</p>}
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {line.invalidReason ? "Цена требует уточнения" : formatUnitPrice(line.price, line.priceUnit)}
        </p>
        {line.invalidReason && <p role="alert" className="mt-2 text-sm text-amber-900 dark:text-amber-200">{line.invalidReason} <Link href="/#request" className="underline">Запросить расчёт</Link></p>}
      </div>
      {line.pieceOrder ? (
        <div>
          <QuantitySelector whole value={line.pieceOrder.pieces}
            onChange={value => updateQuantity(line.productId, value * line.pieceOrder!.lengthMeters)}/>
          <span className="ml-2 text-sm text-slate-500 dark:text-slate-400">шт.</span>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            {formatNumber(line.pieceOrder.pieces)} × {formatNumber(line.pieceOrder.lengthMeters)} м = {formatNumber(line.quantity)} м
          </p>
        </div>
      ) : line.measurement ? (
        <p className="text-sm text-slate-600 dark:text-slate-300 md:text-right">
          <strong className="block text-slate-900 dark:text-slate-100">
            {formatNumber(line.measurement.meters)} м / {formatNumber(line.measurement.weightTons)} т
          </strong>
          Ввод: {line.measurement.inputMode === "meter" ? "метры" : "тонны"}
        </p>
      ) : (
        <div><QuantitySelector whole={line.wholeQuantity} value={line.quantity} onChange={(value) => updateQuantity(line.productId, value)}/>
          <span className="ml-2 text-sm text-slate-500 dark:text-slate-400">{line.quantityUnit}</span></div>
      )}
      <div className="flex items-center justify-between gap-5 md:block md:min-w-32 md:text-right">
        <strong className="text-lg">{line.invalidReason ? "Расчёт недоступен" : formatCurrency(line.estimatedTotal)}</strong>
        <button
          type="button"
          onClick={() => removeItem(line.productId)}
          className="block min-h-11 text-sm font-medium text-red-700 dark:text-red-400 underline underline-offset-2 md:ml-auto md:mt-1"
        >
          Удалить
        </button>
      </div>
    </article>
  );
}
