"use client";
import Link from "next/link";
import {catalogProductPath} from "@/lib/catalogLinks";
import type {CartLine, OrderInputMode} from "@/types/cart";
import {useCart} from "@/hooks/useCart";
import {formatCurrency, formatUnitPrice} from "@/lib/currency";
import {formatNumber} from "@/lib/numberFormat";
import {Icon} from "@/components/ui/Icon";
import {QuantitySelector} from "./QuantitySelector";
import {getProductVariantById} from "@/lib/cartCatalog";
import {calculateLineTotal, calculateMeasuredLineTotal, getCartMeasurementQuantityOptions, requiresWholeLengthOrder, tonsToMeters, wholeLengthOrder} from "@/lib/orderMeasurement";
import {formatCartQuantity, formatMeasuredQuantity, formatQuantityForInput, formatRebarOrderTons,
  measuredTonFractionDigits, productOrderFractionDigits, rebarMinimumMeterEntry, rebarMinimumTonEntry, rebarTonFractionDigits} from "@/lib/cartQuantityInput";
import {isVgpVariant} from "@/lib/pipeFamily";
import {isDemonstrationProduct} from "@/lib/catalogOffer";
import {isSquareProfilePipe, profilePipeMaximumPieces} from "@/lib/profilePipe";
import {CartAmount} from "./CartAmount";
import styles from "./CartItemRow.module.css";

export function CartItemRow({line, onRemove}: {line: CartLine; onRemove: () => void}) {
  const {updateQuantity, updatePieceOrder} = useCart();
  const product = getProductVariantById(line.productId);
  const canConvert = !!product && !isDemonstrationProduct(product) && Number.isFinite(product.weightPerMeterKg)
    && (product.weightPerMeterKg ?? 0) > 0;
  const measurement = line.measurement ?? (product?.unit === "ton" && canConvert ? {
    inputMode: "ton" as const, meters: tonsToMeters(line.quantity, product.weightPerMeterKg!)!, weightTons: line.quantity,
  } : undefined);
  const wholeLengths = !!product && requiresWholeLengthOrder(product);
  const isRebar = product?.categoryId === "cat-arm";
  const isVgp = product && isVgpVariant(product);
  const tonPrecision = isRebar ? rebarTonFractionDigits : isVgp ? 3 : measuredTonFractionDigits;
  const simpleRebarMass = isRebar && product.unit === "ton";
  const isBar = isRebar && wholeLengths;
  const bars = isBar && measurement && !line.invalidReason ? wholeLengthOrder(product, measurement.meters, "meter") : null;
  const meterOptions = product && measurement ? getCartMeasurementQuantityOptions(product, "meter") : undefined;
  const tonOptions = product && measurement ? getCartMeasurementQuantityOptions(product, "ton") : undefined;
  const priceRequiresQuote = !product || line.priceRequiresQuote;
  const quantityDisabled = !product || (priceRequiresQuote && !line.deliveryEstimate);
  const pieceOrder = line.pieceOrder;
  const squarePipe = product && isSquareProfilePipe(product) ? product : undefined;
  const maximumPieces = squarePipe && pieceOrder
    ? profilePipeMaximumPieces(squarePipe, pieceOrder.lengthMeters) ?? undefined : undefined;

  function updatePipeLength(length: number) {
    if (!pieceOrder) return;
    const maximum = squarePipe ? profilePipeMaximumPieces(squarePipe, length) : null;
    const pieces = maximum === null ? pieceOrder.pieces : Math.min(pieceOrder.pieces, maximum);
    updatePieceOrder(line.productId, pieces, length);
  }

  return (
    <article data-cart-row={line.productId} className={`${styles.row} rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900`}>
      <div className="min-w-0 break-words">
        {line.slug ? <Link
          href={catalogProductPath(line.categorySlug, line.subcategorySlug, line.productTypeSlug, line.productId)}
          className="inline-block font-bold transition-colors hover:text-brand-700 dark:hover:text-brand-300"
        >
          {line.name}
        </Link> : <p className="font-bold">{line.name}</p>}
        {line.deliveryEstimate && <p className="mt-2 flex items-start gap-2 text-sm leading-5 text-slate-700 dark:text-slate-300">
          <Icon name="clock" className="shrink-0"/>
          <span>Под заказ · Доставка <strong className="whitespace-nowrap font-semibold">{line.deliveryEstimate}</strong></span>
        </p>}
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {priceRequiresQuote ? "Цена требует уточнения" : <CartAmount>{formatUnitPrice(line.price, line.priceUnit)}</CartAmount>}
        </p>
        {line.invalidReason && <p role="alert" className="mt-2 text-sm text-amber-900 dark:text-amber-200">{line.invalidReason} <Link href="/#request" className="underline">Запросить расчёт</Link></p>}
      </div>
      <div className={styles.order}>{pieceOrder ? (
        <div className="space-y-2">
          <QuantitySelector whole fieldLabel="Количество труб" productName={line.name} unit="шт." disabled={quantityDisabled}
            value={pieceOrder.pieces} maximum={maximumPieces}
            onChange={pieces => updatePieceOrder(line.productId, pieces, pieceOrder.lengthMeters)}/>
          {product?.lengthRangeMeters ? <QuantitySelector fieldLabel="Длина одной трубы" productName={line.name} unit="м"
            disabled={quantityDisabled} minimum={product.lengthRangeMeters[0]} maximum={product.lengthRangeMeters[1]}
            decimalPlaces={2} formatValue={(quantity, grouped) => formatQuantityForInput(quantity, grouped, 2)}
            value={pieceOrder.lengthMeters}
            onChange={updatePipeLength}/>
            : <p className="text-sm text-slate-600 dark:text-slate-300">Длина трубы: {formatNumber(pieceOrder.lengthMeters)} м</p>}
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Общая длина: {formatNumber(line.quantity)} м
          </p>
        </div>
      ) : measurement ? (
        <div className="space-y-2">
          {(["meter", "ton"] as const).map((mode: OrderInputMode) => {
            const options = mode === "meter" ? meterOptions : tonOptions;
            return <QuantitySelector key={mode} fieldLabel={mode === "meter" ? "Длина" : "Масса"}
              productName={line.name} unit={mode === "meter" ? "м" : "т"}
              wideInput
              value={mode === "meter" ? measurement.meters : measurement.weightTons}
              onChange={quantity => updateQuantity(line.productId, quantity, mode)} disabled={quantityDisabled || !canConvert}
              {...options}
              precision={mode === "meter" ? 2 : tonPrecision}
              displayThreshold={isRebar ? mode === "meter" ? rebarMinimumMeterEntry : rebarMinimumTonEntry : undefined}
              step={wholeLengths ? options?.minimum : mode === "meter" ? 1 : 0.001}
              formatValue={(quantity, grouped) => mode === "ton" && isRebar ? formatRebarOrderTons(quantity, true, grouped)
                : mode === "ton" && isVgp ? formatQuantityForInput(quantity, grouped, 3) : formatMeasuredQuantity(quantity, mode, grouped)}
              hasPositiveTotal={canConvert && !priceRequiresQuote ? quantity => (mode === "meter"
                ? calculateMeasuredLineTotal(quantity, product.weightPerMeterKg!, product.pricePerTon!)
                : calculateLineTotal(quantity, product.pricePerTon!)) !== null : undefined}
              normalizeQuantity={product && wholeLengths ? quantity => {
                const order = wholeLengthOrder(product, quantity, mode);
                if (!order) return null;
                const exact = mode === "meter" ? order.meters : order.weightTons;
                if (!isBar && Math.abs(exact - quantity) > Math.max(1, quantity) * 1e-9) {
                  return {value: exact, message: `Объём округлён вверх до целых труб · ${order.pieces} шт.`};
                }
                return {value: exact};
              } : undefined}/>;
          })}
          {wholeLengths && product?.lengthMeters ? <p className="max-w-64 text-xs text-slate-600 dark:text-slate-400">
            {bars ? `${bars.pieces} шт.` : isBar ? "Целыми прутками" : "Целыми трубами"} по {formatCartQuantity(product.lengthMeters)} м
          </p> : null}
        </div>
      ) : (
        <QuantitySelector fieldLabel={product?.unit === "ton" || product?.unit === "kg" ? "Масса"
          : product?.unit === "meter" ? "Длина" : "Количество"}
          productName={line.name} unit={line.quantityUnit} whole={line.wholeQuantity}
          precision={line.wholeQuantity ? undefined : simpleRebarMass ? rebarTonFractionDigits : productOrderFractionDigits}
          displayThreshold={simpleRebarMass ? rebarMinimumTonEntry : undefined}
          formatValue={simpleRebarMass ? (quantity, grouped) => formatRebarOrderTons(quantity, true, grouped) : undefined}
          step={!line.wholeQuantity && product?.unit === "ton" ? 0.001 : 1}
          hasPositiveTotal={priceRequiresQuote ? undefined : quantity => calculateLineTotal(quantity, product!.price!) !== null}
          disabled={quantityDisabled} value={line.quantity} onChange={(value) => updateQuantity(line.productId, value)}/>
      )}</div>
      <div className={styles.price}>
        <strong className={styles.total}>{line.invalidReason ? "Расчёт недоступен" : priceRequiresQuote ? "По запросу"
          : <CartAmount>{formatCurrency(line.estimatedTotal)}</CartAmount>}</strong>
        <button
          type="button"
          id={`cart-remove-${line.productId}`}
          aria-label={`Удалить ${line.name} из корзины`}
          onClick={onRemove}
          className={`${styles.remove} block min-h-11 text-sm font-medium text-red-700 dark:text-red-400 underline underline-offset-2`}
        >
          Удалить
        </button>
      </div>
    </article>
  );
}
