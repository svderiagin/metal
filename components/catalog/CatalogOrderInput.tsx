import {Input} from "@/components/ui/Input";
import type {OrderInputMode} from "@/types/cart";
import {normalizeCartQuantityDraft, quantityTransferHandlers} from "@/lib/cartQuantityInput";
import filterStyles from "./FilterPanel.module.css";
import tableStyles from "./RebarTable.module.css";

export function CatalogOrderInput({
  mode, label, placeholder = "0", visibleLabel, value, onChange, onBlur, invalid, statusId, disabled,
  keepPlaceholderOnFocus, inputMode = "decimal", className = "px-2",
}: {
  label: string;
  placeholder?: string;
  mode?: OrderInputMode;
  inputMode?: "decimal" | "numeric";
  visibleLabel?: string;
  value: string;
  onChange: (value: string) => void | false;
  onBlur: () => void;
  invalid: boolean;
  statusId: string;
  disabled?: boolean;
  keepPlaceholderOnFocus?: boolean;
  className?: string;
}) {
  const measurementStyle = mode === "ton" ? tableStyles.tonInput : mode === "meter" ? tableStyles.meterInput : "";
  const placeholderStyle = keepPlaceholderOnFocus ? "" : "focus:placeholder:text-transparent";
  const field = <Input aria-label={label} aria-invalid={invalid || undefined} aria-describedby={statusId} type="text" inputMode={inputMode}
    disabled={disabled} value={value} data-long-value={mode === "ton" && value.length >= 10 || undefined} onChange={event => {
      const input = event.currentTarget;
      const attempted = input.value;
      const next = normalizeCartQuantityDraft(attempted, input.selectionStart, input.selectionEnd);
      if (next.accepted && (attempted === "" || next.value !== "") && onChange(next.value) !== false) {
        if (next.value !== attempted) {
          input.value = next.value;
          input.setSelectionRange(next.selectionStart, next.selectionEnd);
        }
        return;
      }
      // Restore the selection before React resets the controlled value and moves the caret.
      const suffixLength = attempted.length - (input.selectionEnd ?? attempted.length);
      const end = Math.max(0, value.length - suffixLength);
      let start = 0;
      while (start < end && value[start] === attempted[start]) start++;
      input.value = value;
      input.setSelectionRange(start, end);
    }} onBlur={onBlur}
    {...quantityTransferHandlers()}
    onKeyDown={event => {
      if (event.key === "Enter" && !event.nativeEvent.isComposing) {
        event.preventDefault();
        event.currentTarget.blur();
      }
    }}
    className={`${filterStyles.field} ${measurementStyle} w-full min-w-0 tabular-nums ${placeholderStyle} ${className}`}
    placeholder={placeholder}/>;
  return visibleLabel ? (
    <label className="block text-sm font-semibold">
      <span className="mb-1 block">{visibleLabel}</span>
      {field}
    </label>
  ) : field;
}
