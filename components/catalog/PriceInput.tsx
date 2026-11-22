import {useState} from "react";
import {Input} from "@/components/ui/Input";
import {parseCatalogPrice} from "@/lib/catalogFilters";
import {quantityTransferHandlers} from "@/lib/cartQuantityInput";

const emptyRange = {minimumPrice: "", maximumPrice: ""};
type PriceBound = keyof typeof emptyRange;

const {format: formatPrice} = new Intl.NumberFormat("ru-RU", {useGrouping: false, maximumFractionDigits: 2});

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

  return {...range, edit, commit, reset, message, onRejectedTransfer: setMessage};
}

export function PriceRangeInputs({range, unit}: {range: ReturnType<typeof useCatalogPriceRange>; unit?: string}) {
  const suffix = unit ? ` за ${unit}` : "";
  const unitLabel = unit === "тонну" ? "₽/т" : unit === "метр" ? "₽/м" : "₽";
  return <fieldset>
    <legend className="text-sm font-semibold">Цена, {unitLabel}</legend>
    <div className="mt-1 grid grid-cols-2 gap-2">
      <PriceInput value={range.minimumPrice} prefix="от"
        label={`Минимальная цена${suffix} в рублях`}
        onRejectedTransfer={range.onRejectedTransfer}
        onChange={value => range.edit("minimumPrice", value)} onCommit={() => range.commit("minimumPrice")}/>
      <PriceInput value={range.maximumPrice} prefix="до"
        label={`Максимальная цена${suffix} в рублях`}
        onRejectedTransfer={range.onRejectedTransfer}
        onChange={value => range.edit("maximumPrice", value)} onCommit={() => range.commit("maximumPrice")}/>
    </div>
  </fieldset>;
}

export function PriceRangeFeedback({message}: {message: string}) {
  return <p role="status" aria-atomic="true"
    className={message ? "w-full text-xs text-slate-600 dark:text-slate-300" : "sr-only"}>{message}</p>;
}

function PriceInput({value, prefix, label, onChange, onCommit, onRejectedTransfer}: {
  value: string;
  prefix: "от" | "до";
  label: string;
  onChange: (value: string) => void;
  onCommit: () => void;
  onRejectedTransfer: (message: string) => void;
}) {
  return (
    <span className="relative block min-w-0">
      <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-sm text-slate-500 dark:text-slate-400">{prefix}</span>
      <Input type="text" inputMode="decimal" value={value} aria-label={label}
        aria-invalid={(!!value.trim() && parseCatalogPrice(value) === null) || undefined}
        {...quantityTransferHandlers(onRejectedTransfer)}
        onChange={event => onChange(event.currentTarget.value)} onBlur={onCommit}
        onKeyDown={event => {
          if (event.key === "Enter" && !event.nativeEvent.isComposing) {
            event.preventDefault();
            event.currentTarget.blur();
          }
        }}
        className="pl-10 tabular-nums"
      />
    </span>
  );
}
