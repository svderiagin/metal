import type {CustomerType} from "@/types/order";

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
            className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors ${
              value === option.value
                ? "border-red-700 bg-red-50"
                : "border-slate-200 hover:border-slate-400"
            }`}
          >
            <input
              type="radio"
              name="customerType"
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="size-4 accent-red-700"
            />
            <span className="font-medium">{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
