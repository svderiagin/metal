import type {PaymentMethod} from "@/types/order";

const options = [{
  v: "CARD" as const,
  l: "Банковская карта",
  d: "После создания заказа пользователь будет перенаправлен на защищённую страницу платёжного провайдера."
}, {
  v: "INVOICE" as const,
  l: "Счёт на оплату",
  d: "Счёт будет сформирован после проверки заказа и отправлен на указанный email."
}];

export function PaymentMethodSelector({value, onChange}: {
  value: PaymentMethod;
  onChange: (v: PaymentMethod) => void
}) {
  return (
    <fieldset>
      <legend className="mb-3 font-bold">Способ оплаты</legend>
      <div className="space-y-3">
        {options.map((option) => (
          <label
            key={option.v}
            className={`flex cursor-pointer gap-3 rounded-lg border p-4 transition-colors sm:p-5 ${
              value === option.v
                ? "border-red-700 bg-red-50"
                : "border-slate-200 hover:border-slate-400"
            }`}
          >
            <input
              type="radio"
              name="paymentMethod"
              checked={value === option.v}
              onChange={() => onChange(option.v)}
              className="mt-1 size-4 shrink-0 accent-red-700"
            />
            <span>
              <strong className="block">{option.l}</strong>
              <span className="mt-1 block text-sm leading-6 text-slate-600">{option.d}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
