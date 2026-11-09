"use client";
import Link from "next/link";
import {catalogProductPath} from "@/lib/catalogLinks";
import type {CartLine} from "@/types/cart";
import {useCart} from "@/hooks/useCart";
import {formatCurrency, formatUnitPrice} from "@/lib/currency";
import {formatNumber} from "@/lib/numberFormat";
import {QuantitySelector} from "./QuantitySelector";
import {getProductVariantById} from "@/lib/cartCatalog";
import {formatDecimal, getMeasurementQuantityOptions} from "@/lib/orderMeasurement";
import {formatCartQuantity} from "@/lib/cartQuantityInput";
import {isVgpVariant, wholeVgpOrder} from "@/lib/vgp";

export function CartItemRow({line}: { line: CartLine }) {
  const {updateQuantity, removeItem} = useCart();
  const product = getProductVariantById(line.productId);
  const measurement = line.measurement;
  const measurementOptions = product && measurement ? getMeasurementQuantityOptions(product, measurement.inputMode) : undefined;
  const vgp = !!product && isVgpVariant(product);
  return (
    <article className="grid min-w-0 gap-4 border-b border-slate-200 dark:border-slate-700 py-5 last:border-0 sm:py-6 md:grid-cols-[minmax(0,1fr)_13.75rem_8rem] md:items-center md:gap-6">
      <div className="min-w-0 break-words">
        {line.slug ? <Link
          href={catalogProductPath(line.categorySlug, line.subcategorySlug, line.productTypeSlug, line.productId)}
          className="inline-block font-bold transition-colors hover:text-brand-700 dark:hover:text-brand-300"
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
          <QuantitySelector whole productName={line.name} unit="шт." disabled={!product} value={line.pieceOrder.pieces}
            onChange={value => updateQuantity(line.productId, value * line.pieceOrder!.lengthMeters)}/>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            {formatNumber(line.pieceOrder.pieces)} × {formatNumber(line.pieceOrder.lengthMeters)} м = {formatNumber(line.quantity)} м
          </p>
        </div>
      ) : measurement ? (
        <div>
          <QuantitySelector productName={line.name} unit={measurement.inputMode === "meter" ? "м" : "т"}
            value={measurement.inputMode === "meter" ? measurement.meters : measurement.weightTons}
            onChange={quantity => updateQuantity(line.productId, quantity)} disabled={!product}
            {...measurementOptions}
            step={vgp ? measurementOptions?.minimum : measurement.inputMode === "meter" ? 1 : 0.001}
            formatValue={vgp ? quantity => formatCartQuantity(Number(quantity.toPrecision(12))) : undefined}
            normalizeQuantity={product && vgp ? quantity => {
              const order = wholeVgpOrder(product, quantity, measurement.inputMode);
              if (!order) return null;
              const exact = measurement.inputMode === "meter" ? order.meters : order.weightTons;
              return {value: exact, ...(Math.abs(exact - quantity) > Math.max(1, quantity) * 1e-9
                ? {message: `Объём округлён вверх до целых труб · ${order.pieces} шт.`} : {})};
            } : undefined}/>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            {formatMeasuredQuantity(measurement.meters, 2)} м / {formatMeasuredQuantity(measurement.weightTons, 6)} т
          </p>
        </div>
      ) : (
        <QuantitySelector productName={line.name} unit={line.quantityUnit} whole={line.wholeQuantity}
          step={!line.wholeQuantity && product?.unit === "ton" ? 0.001 : 1}
          disabled={!product} value={line.quantity} onChange={(value) => updateQuantity(line.productId, value)}/>
      )}
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-5 gap-y-1 md:block md:min-w-32 md:text-right">
        <strong className="break-words text-lg tabular-nums">{line.invalidReason ? "Расчёт недоступен" : formatCurrency(line.estimatedTotal)}</strong>
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

function formatMeasuredQuantity(value: number, decimalPlaces?: number) {
  const text = decimalPlaces === undefined ? "" : formatDecimal(value, decimalPlaces);
  return formatCartQuantity(text && Number(text) > 0 ? Number(text) : Number(value.toPrecision(12)));
}
