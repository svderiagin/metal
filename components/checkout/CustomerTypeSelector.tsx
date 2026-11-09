import type {CustomerType} from "@/types/order";
import styles from "./CheckoutChoices.module.css";

export function CustomerTypeSelector({value, onChange}: { value: CustomerType; onChange: (v: CustomerType) => void }) {
  const options = [
    {value: "INDIVIDUAL", label: "Физическое лицо"},
    {value: "COMPANY", label: "Организация"},
  ] as const;

  return (
    <fieldset>
      <legend className="mb-3 font-bold">Тип покупателя</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((option) => (
          <label
            key={option.value}
            className={`${styles.option} flex min-h-14 cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors ${
              value === option.value
                ? "border-brand-700 bg-brand-50 dark:border-brand-300 dark:bg-brand-950/40"
                : "border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500"
            }`}
          >
            <input
              type="radio"
              name="customerType"
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className={`${styles.radio} size-4 shrink-0 accent-brand-700 dark:accent-brand-300`}
            />
            <span className="font-medium">{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
