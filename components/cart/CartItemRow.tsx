"use client";
import Link from "next/link";
import {catalogProductPath} from "@/lib/catalogLinks";
import type {CartLine, OrderInputMode} from "@/types/cart";
import {useCart} from "@/hooks/useCart";
import {formatCurrency, formatUnitPrice} from "@/lib/currency";
import {formatNumber} from "@/lib/numberFormat";
import {Button} from "@/components/ui/Button";
import {Icon} from "@/components/ui/Icon";
import {QuantitySelector} from "./QuantitySelector";
import {getProductVariantById} from "@/lib/cartCatalog";
import {calculateLineTotal, calculateMeasuredLineTotal, getCartMeasurementQuantityOptions, getSimpleOrderQuantityOptions, metersToTons, requiresWholeLengthOrder, tonsToMeters, wholeLengthOrder} from "@/lib/orderMeasurement";
import {MAX_ORDER_PIECES} from "@/lib/constants";
import {hasSheetOrderMass, sheetsForOrderTons, sheetTonDecimals, sheetOrderTons} from "@/lib/sheetOrder";
import {getTreadPlateExecution} from "@/lib/sheetPresentation";
import {formatCartQuantity, formatMeasuredQuantity, formatQuantityForInput, formatRebarOrderTons, formatStockLengthBreakdown,
  measuredTonFractionDigits, productOrderFractionDigits, rebarMinimumMeterEntry, rebarMinimumTonEntry, rebarTonFractionDigits} from "@/lib/cartQuantityInput";
import {isVgpVariant, isWholePipeVariant} from "@/lib/pipeFamily";
import {isDemonstrationProduct} from "@/lib/catalogOffer";
import {profilePipeMassPerMeter, profilePipeMaximumPieces} from "@/lib/profilePipe";
import {CartAmount} from "./CartAmount";
import catalogStyles from "../catalog/FilterPanel.module.css";
import styles from "./CartItemRow.module.css";

function additionalSteelGrade(name: string, grade: string | undefined) {
  if (!grade || grade === "—") return;
  if (grade === "3сп(пс)") return "Ст3сп или Ст3пс (по партии)";
  const tokens = name.toUpperCase().replaceAll("C", "С").split(/[^\p{L}\p{N}]+/u);
  const isInName = /^\d+$/u.test(grade)
    ? tokens.some((token, index) => token === `СТ${grade}` || (token === grade && tokens[index - 1] === "СТАЛЬ"))
    : tokens.includes(grade.toUpperCase().replaceAll("C", "С"));
  return isInName ? undefined : grade;
}

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
  const meterOptions = product && measurement ? getCartMeasurementQuantityOptions(product, "meter") : undefined;
  const tonOptions = product && measurement ? getCartMeasurementQuantityOptions(product, "ton") : undefined;
  const simpleOptions = getSimpleOrderQuantityOptions(product);
  const simplePrecision = simpleOptions.decimalPlaces;
  const priceRequiresQuote = !product || line.priceRequiresQuote;
  const priceStatus = line.invalidReason ? "Требует проверки" : priceRequiresQuote ? "По запросу" : undefined;
  const quantityDisabled = !product || (priceRequiresQuote && !line.deliveryEstimate);
  const pieceOrder = line.pieceOrder;
  const stockLengthBreakdown = !pieceOrder && !line.invalidReason
    ? formatStockLengthBreakdown(measurement?.meters ?? (product?.unit === "meter" ? line.quantity : undefined), product?.lengthMeters)
    : undefined;
  const maximumPieces = product && pieceOrder
    ? profilePipeMaximumPieces(product, pieceOrder.lengthMeters) ?? undefined : undefined;
  const pipeMassPerMeter = product && pieceOrder && !line.invalidReason ? profilePipeMassPerMeter(product) : null;
  const pipeOrderTons = pipeMassPerMeter === null ? null : metersToTons(line.quantity, pipeMassPerMeter);
  const sheetOrder = product?.sheetOrder;
  const sheetCount = sheetOrder ? line.quantity / sheetOrder.quantityPerSheet : 0;
  const sheetExecution = product ? getTreadPlateExecution(product) : undefined;
  const productName = sheetExecution ? `${line.name} · ${sheetExecution}` : line.name;
  const steelGrade = additionalSteelGrade(productName, product?.steelGrade);

  function updatePipeLength(length: number) {
    if (!pieceOrder) return;
    const maximum = product ? profilePipeMaximumPieces(product, length) : null;
    const pieces = maximum === null ? pieceOrder.pieces : Math.min(pieceOrder.pieces, maximum);
    updatePieceOrder(line.productId, pieces, length);
  }

  return (
    <article data-cart-row={line.productId} className={`${styles.row} rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900`}>
      <div className={styles.product}>
        <h2 className="text-card-title">
          {line.slug ? <Link
            href={catalogProductPath(line.categorySlug, line.subcategorySlug, line.productTypeSlug, line.productId)}
            className="rounded-sm transition-colors hover:text-brand-700 hover:underline dark:hover:text-brand-300"
          >{productName}</Link> : productName}
        </h2>
        {product?.sheetFormat && <p className="text-sm text-slate-600 dark:text-slate-300">
          Размер листа {product.sheetFormat}
        </p>}
        {steelGrade && <p className="text-sm text-slate-600 dark:text-slate-300">Сталь {steelGrade}</p>}
        {product && <p className="text-sm text-slate-600 dark:text-slate-400">
          {priceRequiresQuote ? "Цена по запросу" : <CartAmount>{formatUnitPrice(line.price, line.priceUnit)}</CartAmount>}
        </p>}
        {line.deliveryEstimate && <p className="flex items-start gap-2 text-sm leading-5 text-slate-700 dark:text-slate-300">
          <Icon name="truck" className="shrink-0"/>
          <span>Под заказ · Доставка <strong className="whitespace-nowrap font-semibold">{line.deliveryEstimate}</strong></span>
        </p>}
        {line.invalidReason && <p role="alert" className="rounded-md bg-[var(--danger-background)] px-3 py-2 text-sm text-[var(--danger-text)]">
          {line.invalidReason}
        </p>}
      </div>
      <div className={styles.order}>{pieceOrder ? (
        <>
          <QuantitySelector whole fieldLabel="Количество" productName={productName} unit="шт." disabled={quantityDisabled}
            value={pieceOrder.pieces} maximum={maximumPieces}
            onChange={pieces => updatePieceOrder(line.productId, pieces, pieceOrder.lengthMeters)}/>
          {product?.lengthRangeMeters && <QuantitySelector fieldLabel="Длина трубы" productName={line.name} unit="м"
            disabled={quantityDisabled} minimum={product.lengthRangeMeters[0]} maximum={product.lengthRangeMeters[1]}
            decimalPlaces={2} formatValue={(quantity, grouped) => formatQuantityForInput(quantity, grouped, 2)}
            value={pieceOrder.lengthMeters}
            onChange={updatePipeLength}/>}
          <p className={styles.orderDetail}>
            {formatCartQuantity(pieceOrder.pieces)} шт. × {formatNumber(pieceOrder.lengthMeters)} м = {formatCartQuantity(line.quantity)} м
            {pipeOrderTons !== null && <span className="block">
              Общая масса {formatMeasuredQuantity(pipeOrderTons, "ton", true)}&nbsp;т
            </span>}
          </p>
        </>
      ) : measurement ? (
        <>
          {(["meter", "ton"] as const).map((mode: OrderInputMode) => {
            const options = mode === "meter" ? meterOptions : tonOptions;
            return <QuantitySelector key={mode} fieldLabel={mode === "meter" ? "Длина" : "Масса"}
              productName={line.name} unit={mode === "meter" ? "м" : "т"}
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
                if (isWholePipeVariant(product) && Math.abs(exact - quantity) > Math.max(1, quantity) * 1e-9) {
                  return {value: exact, message: `Объём округлён вверх до целых труб · ${order.pieces} шт.`};
                }
                return {value: exact};
              } : undefined}/>;
          })}
        </>
      ) : sheetOrder && Number.isInteger(sheetCount) ? (
        <>
          <QuantitySelector whole fieldLabel="Количество" productName={line.name} unit="шт." disabled={quantityDisabled}
            value={sheetCount} maximum={MAX_ORDER_PIECES}
            onChange={pieces => updateQuantity(line.productId, pieces * sheetOrder.quantityPerSheet)}/>
          {hasSheetOrderMass(sheetOrder) && <QuantitySelector fieldLabel="Масса" productName={productName} unit="т" disabled={quantityDisabled}
            value={sheetOrderTons(sheetOrder, sheetCount)} minimum={sheetOrderTons(sheetOrder, 1)}
            maximum={sheetOrderTons(sheetOrder, MAX_ORDER_PIECES)} step={sheetOrderTons(sheetOrder, 1)}
            precision={sheetTonDecimals}
            formatValue={(tons, grouped) => formatQuantityForInput(tons, grouped, sheetTonDecimals)}
            normalizeQuantity={tons => ({value: sheetOrderTons(sheetOrder, sheetsForOrderTons(sheetOrder, tons))})}
            onChange={tons => updateQuantity(line.productId, sheetsForOrderTons(sheetOrder, tons) * sheetOrder.quantityPerSheet)}/>}
          {product?.unit === "square_meter" && <p className={styles.orderDetail}>
            Общая площадь {formatCartQuantity(line.quantity)}&nbsp;м²
          </p>}
        </>
      ) : (
        <QuantitySelector fieldLabel={product?.unit === "ton" || product?.unit === "kg" ? "Масса"
          : product?.unit === "meter" ? "Длина" : "Количество"}
          productName={line.name} unit={line.quantityUnit} whole={line.wholeQuantity}
          {...simpleOptions}
          precision={line.wholeQuantity ? undefined : simpleRebarMass ? rebarTonFractionDigits : simplePrecision ?? productOrderFractionDigits}
          displayThreshold={simpleRebarMass ? rebarMinimumTonEntry : undefined}
          formatValue={simpleRebarMass ? (quantity, grouped) => formatRebarOrderTons(quantity, true, grouped)
            : simplePrecision !== undefined ? (quantity, grouped) => formatQuantityForInput(quantity, grouped, simplePrecision) : undefined}
          step={!line.wholeQuantity && product?.unit === "ton" ? 0.001 : 1}
          hasPositiveTotal={priceRequiresQuote ? undefined : quantity => calculateLineTotal(quantity, product!.price!) !== null}
          disabled={quantityDisabled} value={line.quantity} onChange={(value) => updateQuantity(line.productId, value)}/>
      )}{stockLengthBreakdown && <p className={styles.orderDetail}>{stockLengthBreakdown}</p>}</div>
      <div className={styles.price}>
        {priceStatus ? <p className="min-w-0 text-sm font-medium text-slate-600 dark:text-slate-300">{priceStatus}</p>
          : <strong className="min-w-0 text-lg font-bold leading-6">
            <CartAmount>{formatCurrency(line.estimatedTotal)}</CartAmount>
          </strong>}
        <Button
          type="button"
          id={`cart-remove-${line.productId}`}
          aria-label={`Удалить ${productName} из корзины`}
          onClick={onRemove}
          className={`${catalogStyles.removeCartButton} ${styles.remove}`}
        >
          Удалить
        </Button>
      </div>
    </article>
  );
}
