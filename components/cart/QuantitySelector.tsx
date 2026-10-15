"use client";
import {Input} from "@/components/ui/Input";

export function QuantitySelector({value, onChange, whole = false}: { value: number; onChange: (value: number) => void; whole?: boolean }) {
  return <div className="inline-flex items-stretch" aria-label="Количество">
    <button type="button" aria-label="Уменьшить количество" onClick={() => onChange(value - 1)}
            disabled={value <= 1}
            className="w-10 rounded-l-md border border-r-0 border-slate-300 bg-slate-100 font-bold disabled:opacity-40">−
    </button>
    <Input aria-label="Количество товара" type="number" min={0} step={whole ? 1 : "any"} max={999} value={value} onChange={e => {
      const v = e.currentTarget.valueAsNumber;
      if (Number.isFinite(v) && v > 0 && v <= 999 && (!whole || Number.isInteger(v))) onChange(v)
    }} className="w-16 rounded-none text-center"/>
    <button type="button" aria-label="Увеличить количество" onClick={() => onChange(Math.min(999, value + 1))}
            disabled={value >= 999}
            className="w-10 rounded-r-md border border-l-0 border-slate-300 bg-slate-100 font-bold">+
    </button>
  </div>
}
