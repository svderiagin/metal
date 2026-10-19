"use client";
import {useCart} from "@/hooks/useCart";
import {formatCurrency} from "@/lib/currency";
import {Button, ButtonLink} from "@/components/ui/Button";

export function CartSummary() {
  const {lineItemCount, totalAmount, clearCart, lines} = useCart();
  const invalid = lines.some(line => line.invalidReason);
  return (
    <aside className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm sm:p-6 lg:sticky lg:top-6">
      <h2 className="text-xl font-bold">Итого</h2>
      <dl className="mt-5 space-y-4 text-sm">
        <div className="flex justify-between gap-4">
          <dt>Позиций</dt>
          <dd>{lineItemCount}</dd>
        </div>
        <div className="flex justify-between gap-4 border-t border-slate-200 dark:border-slate-700 pt-4 text-lg font-black">
          <dt>Сумма</dt>
          <dd>{invalid ? "Требует уточнения" : formatCurrency(totalAmount)}</dd>
        </div>
      </dl>
      <p className="mt-4 text-xs leading-5 text-slate-500 dark:text-slate-400">
        Стоимость доставки и обработки уточняется при подтверждении заказа.
      </p>
      <ButtonLink href={invalid ? "/#request" : "/checkout"} className="mt-6 w-full">
        {invalid ? "Запросить расчёт" : "Перейти к оформлению"}
      </ButtonLink>
      <Button
        type="button"
        onClick={clearCart}
        className="mt-3 w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 shadow-none hover:bg-slate-100 dark:hover:bg-slate-800"
      >
        Очистить корзину
      </Button>
    </aside>
  );
}
