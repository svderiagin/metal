"use client";
import {useCart} from "@/hooks/useCart";
import {EmptyState} from "@/components/ui/EmptyState";
import {CheckoutForm} from "./CheckoutForm";
import {CheckoutOrderSummary} from "./CheckoutOrderSummary";
import {ButtonLink} from "@/components/ui/Button";

export function CheckoutPageContent() {
  const {lines, totalAmount, hydrated} = useCart();
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
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-8">
      <div className="min-w-0 lg:col-start-2 lg:row-start-1">
        <CheckoutOrderSummary lines={lines} totalAmount={totalAmount}/>
      </div>
      <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6 md:p-8 lg:col-start-1 lg:row-start-1">
        <CheckoutForm/>
      </div>
    </div>
  );
}
