import {Input} from "@/components/ui/Input";
import type {OrderInputMode} from "@/types/cart";
import {quantityTransferHandlers} from "@/lib/cartQuantityInput";
import filterStyles from "./FilterPanel.module.css";
import tableStyles from "./RebarTable.module.css";

export function CatalogOrderInput({
  mode, label, placeholder, visibleLabel, value, onChange, onBlur, onRejectedTransfer, invalid, statusId, disabled,
  keepPlaceholderOnFocus,
}: {
  label: string;
  placeholder: string;
  mode: OrderInputMode;
  visibleLabel?: string;
  value: string;
  onChange: (value: string) => void | false;
  onBlur: () => void;
  onRejectedTransfer?: (message: string) => void;
  invalid: boolean;
  statusId: string;
  disabled?: boolean;
  keepPlaceholderOnFocus?: boolean;
}) {
  const alignment = visibleLabel ? "px-2" : "px-2 text-center";
  const placeholderStyle = keepPlaceholderOnFocus ? "" : "focus:placeholder:text-transparent";
  return (
    <label className="block text-sm font-semibold">
      {visibleLabel && <span className="mb-1 block">{visibleLabel}</span>}
      <Input aria-label={label} aria-invalid={invalid || undefined} aria-describedby={statusId} type="text" inputMode="decimal"
        disabled={disabled} value={value} data-long-value={mode === "ton" && value.length >= 10 || undefined} onChange={event => {
          const input = event.target;
          const attempted = input.value;
          if (onChange(attempted) !== false) return;
          // Restore the selection before React resets the controlled value and moves the caret.
          const suffixLength = attempted.length - (input.selectionEnd ?? attempted.length);
          const end = Math.max(0, value.length - suffixLength);
          let start = 0;
          while (start < end && value[start] === attempted[start]) start++;
          input.value = value;
          input.setSelectionRange(start, end);
        }} onBlur={onBlur}
        {...quantityTransferHandlers(onRejectedTransfer)}
        onKeyDown={event => {
          if (event.key === "Enter" && !event.nativeEvent.isComposing) {
            event.preventDefault();
            event.currentTarget.blur();
          }
        }}
        className={`${filterStyles.field} ${mode === "ton" ? tableStyles.tonInput : tableStyles.meterInput} w-full min-w-0 ${alignment} tabular-nums ${placeholderStyle}`}
        placeholder={placeholder}/>
    </label>
  );
}
