import type {CustomerType} from "@/types/order";

export function CustomerTypeSelector({value, onChange}: { value: CustomerType; onChange: (v: CustomerType) => void }) {
  return <fieldset>
    <legend className="mb-2 font-bold">Тип покупателя</legend>
    <div className="grid gap-2 sm:grid-cols-2">{([{v: "INDIVIDUAL", l: "Физическое лицо"}, {
      v: "COMPANY",
      l: "Организация"
    }] as const).map(x => <label key={x.v}
                                 className={`flex cursor-pointer gap-3 rounded-md border p-4 ${value === x.v ? "border-red-700 bg-red-50" : "border-slate-200"}`}><input
      type="radio" name="customerType" checked={value === x.v} onChange={() => onChange(x.v)}
      className="accent-red-700"/>{x.l}</label>)}</div>
  </fieldset>
}
