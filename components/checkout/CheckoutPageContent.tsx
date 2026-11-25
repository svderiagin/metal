"use client";
import {useState} from "react";
import {useCart} from "@/hooks/useCart";
import {EmptyState} from "@/components/ui/EmptyState";
import {CheckoutForm} from "./CheckoutForm";
import {ButtonLink} from "@/components/ui/Button";
import {MAX_CHECKOUT_ITEMS} from "@/lib/checkout";
import {CheckoutOrderSummary} from "./CheckoutOrderSummary";
import type {CartLine} from "@/types/cart";

export function CheckoutPageContent() {
  const {lines, totalAmount, hydrated} = useCart();
  const [orderCreated, setOrderCreated] = useState(false);
  const [priceReview, setPriceReview] = useState<{lines: CartLine[]; totals: number[]}>();
  const revisedTotals = priceReview?.lines === lines ? priceReview.totals : undefined;
  const reviewedTotal = revisedTotals ? revisedTotals.reduce((sum, amount) => sum + amount, 0) / 100 : totalAmount;
  if (orderCreated) return <p role="status" className="rounded-xl border border-slate-200 bg-white p-5 text-sm dark:border-slate-700 dark:bg-slate-900">
    Заказ создан. Открываем подтверждение…
  </p>;
  if (!hydrated) return <div role="status" className="h-52 animate-pulse rounded-xl bg-slate-200 motion-reduce:animate-none dark:bg-slate-700"><span className="sr-only">Загружаем корзину…</span></div>;
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
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-8">
      <div className="min-w-0 lg:col-start-2 lg:row-start-1">
        <CheckoutOrderSummary lines={lines} totalAmount={reviewedTotal} revisedTotals={revisedTotals}/>
      </div>
      <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6 md:p-8 lg:col-start-1 lg:row-start-1">
        <CheckoutForm onOrderCreated={() => setOrderCreated(true)} revisedTotals={revisedTotals}
          onPriceChanged={totals => setPriceReview({lines, totals})}/>
      </div>
    </div>
  );
}
