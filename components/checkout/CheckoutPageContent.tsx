"use client";
import {useId, useState} from "react";
import {useCart} from "@/hooks/useCart";
import {EmptyState} from "@/components/ui/EmptyState";
import {CheckoutForm} from "./CheckoutForm";
import {formatCurrency} from "@/lib/currency";
import {formatNumber} from "@/lib/numberFormat";
import {formatCartQuantity, formatMeasuredQuantity} from "@/lib/cartQuantityInput";
import {ButtonLink} from "@/components/ui/Button";
import {Icon} from "@/components/ui/Icon";
import {BACKORDER_DELIVERY_ESTIMATE} from "@/lib/catalogOffer";

export function CheckoutPageContent() {
  const {lines, totalAmount, hydrated} = useCart();
  const [showBreakdown, setShowBreakdown] = useState(false);
  const summaryHeadingId = useId();
  const breakdownId = useId();
  if (!hydrated) return <div role="status" className="h-52 animate-pulse rounded-xl bg-slate-200 motion-reduce:animate-none dark:bg-slate-700"><span className="sr-only">Загружаем корзину…</span></div>;
  if (!lines.length) {
    return (
      <EmptyState
        title="Нечего оформлять"
        description="Корзина пуста. Выберите товары, затем вернитесь к оформлению."
      />
    );
  }
  if (lines.some(line => line.invalidReason || line.priceRequiresQuote)) {
    return <div role="alert" className="rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 p-6"><h2 className="text-xl font-bold">Расчёт заказа требует уточнения</h2><p className="mt-3">Проверьте объём и уточните цены позиций в корзине перед оформлением.</p><div className="mt-5"><ButtonLink href="/cart">Перейти в корзину</ButtonLink></div></div>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-8">
      <aside aria-labelledby={summaryHeadingId}
        className="h-fit min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6 lg:sticky lg:top-6 lg:col-start-2 lg:row-start-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h2 id={summaryHeadingId} className="text-xl font-bold">Ваш заказ</h2>
          <p className="text-lg font-bold tabular-nums lg:hidden"><span className="sr-only">Итого </span>{formatCurrency(totalAmount)}</p>
        </div>
        {lines.some(line => line.deliveryEstimate) && <p className="mt-2 text-sm text-slate-700 dark:text-slate-300 lg:hidden">
          Доставка товаров под заказ — {BACKORDER_DELIVERY_ESTIMATE}
        </p>}
        <button type="button" aria-expanded={showBreakdown} aria-controls={breakdownId}
          onClick={() => setShowBreakdown(current => !current)}
          className="mt-2 flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-sm text-left text-sm font-semibold text-brand-800 underline underline-offset-4 dark:text-brand-300 lg:hidden">
          Состав заказа <Icon name="chevron-down" className={showBreakdown ? "rotate-180" : ""}/>
        </button>
        <div id={breakdownId} className={showBreakdown ? undefined : "hidden lg:block"}>
          <ul className="mt-3 space-y-4 text-sm lg:mt-5">
            {lines.map((line) => (
              <li key={line.productId} className="flex min-w-0 flex-wrap justify-between gap-x-4 gap-y-1">
                <span className="min-w-0 flex-1 basis-44 break-words leading-5 text-slate-700 dark:text-slate-300">
                  {line.name}
                  {line.pieceOrder
                    ? ` — ${formatNumber(line.pieceOrder.pieces)} шт. × ${formatNumber(line.pieceOrder.lengthMeters)} м = ${formatNumber(line.quantity)} м`
                    : line.measurement
                    ? ` — ${formatMeasuredQuantity(line.measurement.meters, "meter", true)} м / ${formatMeasuredQuantity(line.measurement.weightTons, "ton", true)} т`
                    : ` — ${formatCartQuantity(line.quantity)} ${line.quantityUnit}`}
                  {line.deliveryEstimate && <span className="mt-1 block font-semibold">Доставка {line.deliveryEstimate}</span>}
                </span>
                <strong className="ml-auto shrink-0 whitespace-nowrap tabular-nums">{formatCurrency(line.estimatedTotal)}</strong>
              </li>
            ))}
          </ul>
          <p className="mt-5 flex justify-between gap-4 text-sm text-slate-600 dark:text-slate-300"><span>Доставка</span><strong>Бесплатно</strong></p>
          <div className="mt-5 hidden flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-slate-200 pt-5 text-lg font-bold dark:border-slate-700 lg:flex">
            <span>Итого</span>
            <span className="ml-auto tabular-nums">{formatCurrency(totalAmount)}</span>
          </div>
        </div>
      </aside>
      <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6 md:p-8 lg:col-start-1 lg:row-start-1">
        <CheckoutForm/>
      </div>
    </div>
  );
}
