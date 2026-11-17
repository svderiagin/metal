import type {PaymentMethod} from "@/types/order";
import {isCheckoutPaymentAvailable} from "@/lib/checkout";
import styles from "./CheckoutChoices.module.css";

const options = [{
  v: "INVOICE" as const,
  l: "Счёт на оплату",
  d: "PDF можно скачать после создания заказа. Копия отправляется на электронную почту."
}, {
  v: "CARD" as const,
  l: "Банковская карта",
  d: "Онлайн-оплата пока недоступна."
}];

export function PaymentMethodSelector({value, onChange}: {
  value: PaymentMethod;
  onChange: (v: PaymentMethod) => void
}) {
  return (
    <fieldset>
      <legend className="mb-3 font-bold">Способ оплаты</legend>
      <div className="space-y-3">
        {options.map((option) => {
          const available = isCheckoutPaymentAvailable(option.v);
          return <label
            key={option.v}
            className={`${styles.option} flex gap-3 rounded-lg border p-4 transition-colors sm:p-5 ${available ? "cursor-pointer" : "cursor-not-allowed"} ${
              value === option.v
                ? "border-brand-700 bg-brand-50 dark:border-brand-300 dark:bg-brand-950/40"
                : available
                  ? "border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500"
                  : "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-950"
            }`}
          >
            <input
              type="radio"
              name="paymentMethod"
              disabled={!available}
              checked={value === option.v}
              onChange={() => onChange(option.v)}
              className={`${styles.radio} mt-1 size-4 shrink-0 accent-brand-700 dark:accent-brand-300`}
            />
            <span>
              <strong className="block">{option.l}</strong>
              <span className="mt-1 block text-sm leading-6 text-slate-600 dark:text-slate-300">{option.d}</span>
            </span>
          </label>
        })}
      </div>
    </fieldset>
  );
}
