import {useState} from "react";
import {Input} from "@/components/ui/Input";
import {parseCatalogPrice} from "@/lib/catalogFilters";
import {formatCatalogNumber} from "@/lib/catalogNumberInput";

const emptyRange = {minimumPrice: "", maximumPrice: ""};
type PriceBound = keyof typeof emptyRange;

function formatPrice(value: number) {
  return formatCatalogNumber(value).replace(".", ",");
}

export function useCatalogPriceRange(onChange?: () => void) {
  const [range, setRange] = useState(emptyRange);
  const [message, setMessage] = useState("");

  function edit(bound: PriceBound, value: string) {
    setRange(current => ({...current, [bound]: value}));
    setMessage("");
    onChange?.();
  }

  function commit(bound: PriceBound) {
    const value = range[bound];
    const price = parseCatalogPrice(value);
    if (price === null) {
      if (value.trim()) setMessage("Некорректная граница цены сброшена. Укажите число от 0.");
      if (value) setRange(current => ({...current, [bound]: ""}));
      return;
    }

    const minimum = bound === "minimumPrice" ? price : parseCatalogPrice(range.minimumPrice);
    const maximum = bound === "maximumPrice" ? price : parseCatalogPrice(range.maximumPrice);
    if (minimum !== null && maximum !== null && minimum > maximum) {
      setRange({minimumPrice: formatPrice(maximum), maximumPrice: formatPrice(minimum)});
      setMessage("Границы цены поменялись местами.");
      return;
    }

    const formatted = formatPrice(price);
    if (formatted !== value) setRange(current => ({...current, [bound]: formatted}));
  }

  function reset() {
    setRange(emptyRange);
    setMessage("");
  }

  return {...range, edit, commit, reset, message};
}

export function PriceRangeInputs({range, unit}: {range: ReturnType<typeof useCatalogPriceRange>; unit?: string}) {
  const suffix = unit ? ` за ${unit}` : "";
  return <>
    <label className="text-sm font-semibold">
      Минимальная цена{suffix}
      <PriceInput value={range.minimumPrice} placeholder="От"
        onChange={value => range.edit("minimumPrice", value)} onCommit={() => range.commit("minimumPrice")}/>
    </label>
    <label className="text-sm font-semibold">
      Максимальная цена{suffix}
      <PriceInput value={range.maximumPrice} placeholder="До"
        onChange={value => range.edit("maximumPrice", value)} onCommit={() => range.commit("maximumPrice")}/>
    </label>
  </>;
}

export function PriceRangeFeedback({message}: {message: string}) {
  return <p role="status" aria-atomic="true"
    className={message ? "w-full text-xs text-slate-600 dark:text-slate-300" : "sr-only"}>{message}</p>;
}

function PriceInput({value, placeholder, onChange, onCommit}: {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  onCommit: () => void;
}) {
  return (
    <span className="relative mt-1 block">
      <Input type="text" inputMode="decimal" value={value} placeholder={placeholder}
        aria-invalid={(!!value.trim() && parseCatalogPrice(value) === null) || undefined}
        onChange={event => onChange(event.currentTarget.value)} onBlur={onCommit}
        onKeyDown={event => {
          if (event.key === "Enter" && !event.nativeEvent.isComposing) {
            event.preventDefault();
            event.currentTarget.blur();
          }
        }}
        className="pr-10"
      />
      <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center font-normal text-slate-500 dark:text-slate-400">₽</span>
      <span className="sr-only">в рублях</span>
    </span>
  );
}
