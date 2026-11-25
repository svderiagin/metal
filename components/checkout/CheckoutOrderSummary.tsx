"use client";

import {useId, useState} from "react";
import Link from "next/link";
import type {CartLine} from "@/types/cart";
import type {ProductVariant} from "@/types/product";
import {Icon} from "@/components/ui/Icon";
import {formatCurrency} from "@/lib/currency";
import {formatCartQuantity, formatMeasuredQuantity, formatQuantityForInput, formatRebarOrderTons} from "@/lib/cartQuantityInput";
import {getProductVariantById} from "@/lib/cartCatalog";
import {isVgpVariant} from "@/lib/pipeFamily";
import {metersToTons, sameMeasuredQuantity} from "@/lib/orderMeasurement";
import {sheetOrderTons, sheetTonDecimals} from "@/lib/sheetOrder";
import {BACKORDER_DELIVERY_ESTIMATE} from "@/lib/catalogOffer";

function orderQuantityParts(line: CartLine, product: ProductVariant | undefined) {
  const meters = line.measurement?.meters ?? (line.pieceOrder || product?.unit === "meter" ? line.quantity : undefined);
  if (meters !== undefined) {
    const parts: string[] = [];
    if (line.pieceOrder) {
      parts.push(`${formatCartQuantity(line.pieceOrder.pieces)}\u00a0шт.`);
    } else if (product?.lengthMeters) {
      const equivalentPieces = meters / product.lengthMeters;
      const wholePieces = Math.round(equivalentPieces);
      const quantity = sameMeasuredQuantity(equivalentPieces, wholePieces) ? formatCartQuantity(wholePieces)
        : `≈\u00a0${formatQuantityForInput(equivalentPieces, true, 2)}`;
      parts.push(`${quantity}\u00a0шт.`);
    }
    parts.push(`${formatMeasuredQuantity(meters, "meter", true)}\u00a0м`);
    const massPerMeter = product?.weightConfirmed ? product.weightPerMeterKg : undefined;
    const weightTons = line.measurement?.weightTons ?? (massPerMeter ? metersToTons(meters, massPerMeter) : null);
    if (weightTons !== null) {
      const mass = product && isVgpVariant(product) ? formatQuantityForInput(weightTons, true, 3)
        : product?.categoryId === "cat-arm" ? formatRebarOrderTons(weightTons, true, true)
          : formatMeasuredQuantity(weightTons, "ton", true);
      parts.push(`${mass}\u00a0т`);
    }
    return parts;
  }
  if (product?.sheetOrder) {
    const sheets = line.quantity / product.sheetOrder.quantityPerSheet;
    if (Number.isInteger(sheets)) {
      const parts = [`${formatCartQuantity(sheets)}\u00a0шт.`];
      if (product.unit === "square_meter") parts.push(`${formatCartQuantity(line.quantity)}\u00a0м²`);
      parts.push(`${formatQuantityForInput(sheetOrderTons(product.sheetOrder, sheets), true, sheetTonDecimals)}\u00a0т`);
      return parts;
    }
  }
  return [`${formatCartQuantity(line.quantity)}\u00a0${line.quantityUnit}`];
}

function CheckoutOrderItem({line}: {line: CartLine}) {
  const product = getProductVariantById(line.productId);
  const label = product?.checkoutLabel;
  return <li className="py-3 last:pb-0">
    <p className="font-semibold leading-snug">
      {label?.title ?? line.name}{label?.titleDetails && <span className="font-normal">, {label.titleDetails}</span>}
    </p>
    {label?.details && <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{label.details}</p>}
    <div className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
      <p className="tabular-nums">{orderQuantityParts(line, product).join("\u00a0· ")}</p>
      {line.deliveryEstimate && <p>
        Под заказ · доставка <span className="whitespace-nowrap">{line.deliveryEstimate}</span>
      </p>}
    </div>
    <p className="mt-1.5 text-right font-semibold tabular-nums">{formatCurrency(line.estimatedTotal)}</p>
  </li>;
}

export function CheckoutOrderSummary({lines, totalAmount}: {lines: CartLine[]; totalAmount: number}) {
  const [expanded, setExpanded] = useState(false);
  const headingId = useId();
  const itemsId = useId();
  const backorderCount = lines.filter(line => line.deliveryEstimate).length;
  return <aside aria-labelledby={headingId} className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6">
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <div>
        <h2 id={headingId} className="text-card-title">Ваш заказ</h2>
        <p className="mt-1 hidden text-xs text-slate-600 dark:text-slate-300 lg:block">Позиций: {lines.length}</p>
      </div>
      <Link href="/cart" className="inline-flex min-h-11 items-center rounded-sm text-sm font-medium text-brand-800 underline-offset-4 hover:underline dark:text-brand-300">
        Изменить корзину
      </Link>
    </div>
    <button type="button" aria-expanded={expanded} aria-controls={itemsId}
      onClick={() => setExpanded(current => !current)}
      className="mt-2 flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-sm border-t border-slate-200 text-left text-sm font-semibold text-brand-800 dark:border-slate-700 dark:text-brand-300 lg:hidden">
      Состав заказа ({lines.length}) <Icon name="chevron-down" className={expanded ? "rotate-180" : ""}/>
    </button>
    <ul id={itemsId} className={`divide-y divide-slate-200 text-sm dark:divide-slate-700 lg:mt-4 lg:border-t lg:border-slate-200 dark:lg:border-slate-700 ${expanded ? "" : "hidden lg:block"}`}>
      {lines.map(line => <CheckoutOrderItem key={line.productId} line={line}/>)}
    </ul>
    {!expanded && backorderCount > 0 && <p className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300 lg:hidden">
      <Icon name="truck" className="size-4 shrink-0"/>
      <span>{backorderCount === lines.length ? "Доставка всего заказа — "
        : `Под заказ ${backorderCount} из ${lines.length} · доставка `}<span className="whitespace-nowrap">{BACKORDER_DELIVERY_ESTIMATE}.</span>
      </span>
    </p>}
    <dl className="mt-4 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-slate-200 pt-3 text-sm dark:border-slate-700">
      <dt className="font-semibold leading-snug">Доставка</dt>
      <dd className="ml-auto text-right font-semibold">Бесплатно</dd>
    </dl>
    <dl className="mt-5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-slate-200 pt-4 dark:border-slate-700">
      <dt className="text-base font-semibold">Итого</dt>
      <dd className="ml-auto min-w-0 text-right text-xl font-bold leading-snug tabular-nums">{formatCurrency(totalAmount)}</dd>
    </dl>
  </aside>;
}
