"use client";
import {useState} from "react";
import {useCart} from "@/hooks/useCart";
import {EmptyState} from "@/components/ui/EmptyState";
import {CheckoutForm} from "./CheckoutForm";
import {ButtonLink} from "@/components/ui/Button";
import {MAX_CHECKOUT_ITEMS} from "@/lib/checkout";
import {CheckoutOrderSummary} from "./CheckoutOrderSummary";
import type {CartLine} from "@/types/cart";
import restoreStyles from "@/components/cart/CartRestore.module.css";

const checkoutLayout = "grid items-start gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-8";
const summaryPosition = "min-w-0 lg:col-start-2 lg:row-start-1";
const formPanel = "min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6 md:p-8 lg:col-start-1 lg:row-start-1";

export function CheckoutPageContent() {
  const {lines, totalAmount, hydrated} = useCart();
  const [orderCreated, setOrderCreated] = useState(false);
  const [priceReview, setPriceReview] = useState<{lines: CartLine[]; totals: number[]}>();
  const revisedTotals = priceReview?.lines === lines ? priceReview.totals : undefined;
  const reviewedTotal = revisedTotals ? revisedTotals.reduce((sum, amount) => sum + amount, 0) / 100 : totalAmount;
  if (orderCreated) return <p role="status" className="rounded-xl border border-slate-200 bg-white p-5 text-sm dark:border-slate-700 dark:bg-slate-900">
    Заказ создан. Открываем подтверждение…
  </p>;
  if (!hydrated) return (
    <div key="cart-restoration" role="status" className={`${checkoutLayout} ${restoreStyles.loading} content-start`}>
      <span className="sr-only">Загружаем корзину…</span>
      <div aria-hidden="true" className={`${summaryPosition} h-60 rounded-xl bg-slate-200 motion-safe:animate-pulse dark:bg-slate-700 lg:h-64`}/>
      <div aria-hidden="true" className={`${formPanel} grid gap-6 motion-safe:animate-pulse`}>
        <div className="h-7 w-2/5 rounded bg-slate-200 dark:bg-slate-700"/>
        {[1, 2, 3, 4].map(field => (
          <div key={field} className="grid gap-2">
            <div className="h-4 w-1/4 rounded bg-slate-200 dark:bg-slate-700"/>
            <div className={`${field === 4 ? "h-24" : "h-11"} rounded-lg bg-slate-200 dark:bg-slate-700`}/>
          </div>
        ))}
      </div>
    </div>
  );
  if (!lines.length) {
    return (
      <EmptyState
        compact
        title="Нечего оформлять"
        description="Корзина пуста. Выберите товары, затем вернитесь к оформлению."
      />
    );
  }
  const overLimit = lines.length > MAX_CHECKOUT_ITEMS;
  if (overLimit || lines.some(line => line.invalidReason || line.priceRequiresQuote)) {
    return <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6">
      <h2 className="text-card-title">{overLimit ? "Слишком много позиций в заказе" : "Расчёт заказа требует уточнения"}</h2>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{overLimit
        ? `В одном заказе может быть до ${MAX_CHECKOUT_ITEMS} позиций. Сократите список в корзине.`
        : "Откройте корзину, чтобы проверить объём и цены отмеченных позиций."}</p>
      <ButtonLink href="/cart" className="mt-5">Вернуться в корзину</ButtonLink>
    </section>;
  }

  return (
    <div className={checkoutLayout}>
      <div className={summaryPosition}>
        <CheckoutOrderSummary lines={lines} totalAmount={reviewedTotal} revisedTotals={revisedTotals}/>
      </div>
      <div className={formPanel}>
        <CheckoutForm onOrderCreated={() => setOrderCreated(true)} revisedTotals={revisedTotals}
          onPriceChanged={totals => setPriceReview({lines, totals})}/>
      </div>
    </div>
  );
}
