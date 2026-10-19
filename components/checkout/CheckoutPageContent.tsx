"use client";
import {useCart} from "@/hooks/useCart";
import {EmptyState} from "@/components/ui/EmptyState";
import {CheckoutForm} from "./CheckoutForm";
import {formatCurrency} from "@/lib/currency";
import {formatNumber} from "@/lib/numberFormat";
import {ButtonLink} from "@/components/ui/Button";

export function CheckoutPageContent() {
  const {lines, totalAmount, hydrated} = useCart();
  if (!hydrated) return <div className="h-52 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700"/>;
  if (!lines.length) {
    return (
      <EmptyState
        title="Нечего оформлять"
        description="Корзина пуста. Выберите товары, затем вернитесь к оформлению."
      />
    );
  }
  if (lines.some(line => line.invalidReason)) {
    return <div role="alert" className="rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 p-6"><h2 className="text-xl font-bold">Расчёт заказа требует уточнения</h2><p className="mt-3">В корзине есть позиции без подтверждённой цены или данных для пересчёта. Проверьте их перед оформлением.</p><div className="mt-5 flex flex-wrap gap-3"><ButtonLink href="/cart">Проверить корзину</ButtonLink><ButtonLink href="/#request" variant="secondary">Запросить расчёт</ButtonLink></div></div>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-8">
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm sm:p-6 md:p-8">
        <CheckoutForm/>
      </div>
      <aside className="h-fit rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm sm:p-6 lg:sticky lg:top-6">
        <h2 className="text-xl font-bold">Ваш заказ</h2>
        <ul className="mt-5 space-y-4 text-sm">
          {lines.map((line) => (
            <li key={line.productId} className="flex justify-between gap-4">
              <span className="leading-5 text-slate-700 dark:text-slate-300">
                {line.name}
                {line.pieceOrder
                  ? ` — ${formatNumber(line.pieceOrder.pieces)} шт. × ${formatNumber(line.pieceOrder.lengthMeters)} м = ${formatNumber(line.quantity)} м`
                  : line.measurement
                  ? ` — ${formatNumber(line.measurement.meters)} м / ${formatNumber(line.measurement.weightTons)} т`
                  : ` × ${line.quantity} (${line.priceUnit})`}
              </span>
              <strong className="shrink-0">{formatCurrency(line.estimatedTotal)}</strong>
            </li>
          ))}
        </ul>
        <div className="mt-5 flex justify-between gap-4 border-t border-slate-200 dark:border-slate-700 pt-5 text-lg font-black">
          <span>Итого</span>
          <span>{formatCurrency(totalAmount)}</span>
        </div>
      </aside>
    </div>
  );
}
