"use client";
import Link from "next/link";
import {catalogProductPath} from "@/lib/catalogLinks";
import type {CartLine, OrderInputMode} from "@/types/cart";
import {useCart} from "@/hooks/useCart";
import {formatCurrency, formatUnitPrice} from "@/lib/currency";
import {formatNumber} from "@/lib/numberFormat";
import {QuantitySelector} from "./QuantitySelector";
import {getProductVariantById} from "@/lib/cartCatalog";
import {getCartMeasurementQuantityOptions, tonsToMeters} from "@/lib/orderMeasurement";
import {formatCartQuantity} from "@/lib/cartQuantityInput";
import {isVgpVariant, wholeVgpOrder} from "@/lib/vgp";
import {isDemonstrationProduct, requiresOfferConfirmation} from "@/lib/catalogOffer";
import {CartAmount} from "./CartAmount";
import styles from "./CartItemRow.module.css";

export function CartItemRow({line}: { line: CartLine }) {
  const {updateQuantity, updatePieceOrder, removeItem} = useCart();
  const product = getProductVariantById(line.productId);
  const canConvert = !!product && !isDemonstrationProduct(product) && Number.isFinite(product.weightPerMeterKg)
    && (product.weightPerMeterKg ?? 0) > 0 && Number.isFinite(product.pricePerTon) && (product.pricePerTon ?? 0) > 0;
  const measurement = line.measurement ?? (product?.unit === "ton" && canConvert ? {
    inputMode: "ton" as const, meters: tonsToMeters(line.quantity, product.weightPerMeterKg!)!, weightTons: line.quantity,
  } : undefined);
  const vgp = !!product && isVgpVariant(product);
  const meterOptions = product && measurement ? getCartMeasurementQuantityOptions(product, "meter") : undefined;
  const tonOptions = product && measurement ? getCartMeasurementQuantityOptions(product, "ton") : undefined;
  const priceRequiresQuote = !product || requiresOfferConfirmation(product) || product.price === null || product.quoteOnly || product.priceQualifier === "from";
  return (
    <article data-cart-row={line.productId} className={`${styles.row} border-b border-slate-200 dark:border-slate-700 last:border-0`}>
      <div className="min-w-0 break-words">
        {line.slug ? <Link
          href={catalogProductPath(line.categorySlug, line.subcategorySlug, line.productTypeSlug, line.productId)}
          className="inline-block font-bold transition-colors hover:text-brand-700 dark:hover:text-brand-300"
        >
          {line.name}
        </Link> : <p className="font-bold">{line.name}</p>}
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {priceRequiresQuote ? "Цена требует уточнения" : <CartAmount>{formatUnitPrice(line.price, line.priceUnit)}</CartAmount>}
        </p>
        {line.invalidReason && <p role="alert" className="mt-2 text-sm text-amber-900 dark:text-amber-200">{line.invalidReason} <Link href="/#request" className="underline">Запросить расчёт</Link></p>}
      </div>
      <div className={styles.order}>{line.pieceOrder ? (
        <div className="space-y-2">
          <QuantitySelector whole fieldLabel="Количество труб" productName={line.name} unit="шт." disabled={!product} value={line.pieceOrder.pieces}
            onChange={pieces => updatePieceOrder(line.productId, pieces, line.pieceOrder!.lengthMeters)}/>
          {product?.lengthRangeMeters ? <QuantitySelector fieldLabel="Длина одной трубы" productName={line.name} unit="м"
            minimum={product.lengthRangeMeters[0]} maximum={product.lengthRangeMeters[1]}
            value={line.pieceOrder.lengthMeters}
            onChange={length => updatePieceOrder(line.productId, line.pieceOrder!.pieces, length)}/>
            : <p className="text-sm text-slate-600 dark:text-slate-300">Длина трубы: {formatNumber(line.pieceOrder.lengthMeters)} м</p>}
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Общая длина: {formatNumber(line.quantity)} м
          </p>
        </div>
      ) : measurement ? (
        <div className="space-y-2">
          {(["meter", "ton"] as const).map((mode: OrderInputMode) => {
            const options = mode === "meter" ? meterOptions : tonOptions;
            return <QuantitySelector key={mode} fieldLabel={mode === "meter" ? "Длина заказа" : "Масса заказа"}
              productName={line.name} unit={mode === "meter" ? "м" : "т"}
              value={mode === "meter" ? measurement.meters : measurement.weightTons}
              onChange={quantity => updateQuantity(line.productId, quantity, mode)} disabled={!product || !canConvert}
              {...options}
              step={vgp ? options?.minimum : mode === "meter" ? 1 : 0.001}
              formatValue={quantity => formatCartQuantity(Number(quantity.toPrecision(8)))}
              normalizeQuantity={product && vgp ? quantity => {
                const order = wholeVgpOrder(product, quantity, mode);
                if (!order) return null;
                const exact = mode === "meter" ? order.meters : order.weightTons;
                return {value: exact, ...(Math.abs(exact - quantity) > Math.max(1, quantity) * 1e-9
                  ? {message: `Объём округлён вверх до целых труб · ${order.pieces} шт.`} : {})};
              } : undefined}/>;
          })}
          {meterOptions && tonOptions && <p className="max-w-64 text-xs text-slate-600 dark:text-slate-400">
            Максимум: {formatCartQuantity(tonOptions.maximum)} т
            {vgp && product?.lengthMeters ? ` · целыми трубами по ${formatCartQuantity(product.lengthMeters)} м` : ""}
          </p>}
        </div>
      ) : (
        <QuantitySelector fieldLabel={product?.unit === "ton" || product?.unit === "kg" ? "Масса заказа"
          : product?.unit === "meter" ? "Длина заказа" : "Количество"}
          productName={line.name} unit={line.quantityUnit} whole={line.wholeQuantity}
          step={!line.wholeQuantity && product?.unit === "ton" ? 0.001 : 1}
          disabled={!product} value={line.quantity} onChange={(value) => updateQuantity(line.productId, value)}/>
      )}</div>
      <div className={styles.price}>
        <strong className={styles.total}>{line.invalidReason ? "Расчёт недоступен" : <CartAmount>{formatCurrency(line.estimatedTotal)}</CartAmount>}</strong>
        <button
          type="button"
          onClick={() => removeItem(line.productId)}
          className={`${styles.remove} block min-h-11 text-sm font-medium text-red-700 dark:text-red-400 underline underline-offset-2`}
        >
          Удалить
        </button>
      </div>
    </article>
  );
}
