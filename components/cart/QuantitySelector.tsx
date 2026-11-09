"use client";
import {Input} from "@/components/ui/Input";

export function QuantitySelector({value, onChange, whole = false, productName}: {
  value: number; onChange: (value: number) => void; whole?: boolean; productName?: string;
}) {
  const label = productName ? `Количество ${productName}` : "Количество товара";
  const buttonClass = "min-h-11 w-11 shrink-0 cursor-pointer border border-slate-300 bg-slate-100 font-semibold transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:disabled:hover:bg-slate-800";
  return <div className="inline-flex items-stretch" role="group" aria-label={label}>
    <button type="button" aria-label="Уменьшить количество" onClick={() => onChange(whole ? Math.max(1, Math.ceil(value) - 1) : value - 1)}
            disabled={value <= 1}
            className={`${buttonClass} rounded-l-lg border-r-0`}>−
    </button>
    <Input aria-label={label} type="number" min={0} step={whole ? 1 : "any"} max={999} value={value} onChange={e => {
      const v = e.currentTarget.valueAsNumber;
      if (Number.isFinite(v) && v > 0 && v <= 999 && (!whole || Number.isInteger(v))) onChange(v)
    }} className="w-16 rounded-none text-center"/>
    <button type="button" aria-label="Увеличить количество" onClick={() => onChange(Math.min(999, whole ? Math.floor(value) + 1 : value + 1))}
            disabled={value >= 999}
            className={`${buttonClass} rounded-r-lg border-l-0`}>+
    </button>
  </div>
}
