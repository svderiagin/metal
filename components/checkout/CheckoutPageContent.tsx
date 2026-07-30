"use client";
import {useCart} from "@/hooks/useCart";
import {EmptyState} from "@/components/ui/EmptyState";
import {CheckoutForm} from "./CheckoutForm";
import {formatCurrency} from "@/lib/currency";

export function CheckoutPageContent() {
  const {lines, totalAmount, hydrated} = useCart();
  if (!hydrated) return <div className="h-52 animate-pulse rounded-xl bg-slate-200"/>;
  if (!lines.length) {
    return (
      <EmptyState
        title="Нечего оформлять"
        description="Корзина пуста. Выберите товары, затем вернитесь к оформлению."
      />
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-8">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 md:p-8">
        <CheckoutForm/>
      </div>
      <aside className="h-fit rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:sticky lg:top-6">
        <h2 className="text-xl font-bold">Ваш заказ</h2>
        <ul className="mt-5 space-y-4 text-sm">
          {lines.map((line) => (
            <li key={line.productId} className="flex justify-between gap-4">
              <span className="leading-5 text-slate-700">
                {line.name}
                {line.measurement
                  ? ` — ${line.measurement.meters} м / ${line.measurement.weightTons} т`
                  : ` × ${line.quantity}`}
              </span>
              <strong className="shrink-0">{formatCurrency(line.estimatedTotal)}</strong>
            </li>
          ))}
        </ul>
        <div className="mt-5 flex justify-between gap-4 border-t border-slate-200 pt-5 text-lg font-black">
          <span>Итого</span>
          <span>{formatCurrency(totalAmount)}</span>
        </div>
      </aside>
    </div>
  );
}
