"use client";

import {useId, useState} from "react";
import {Input} from "@/components/ui/Input";
import {correctOrderQuantity, formatCatalogNumber, parseOrderQuantity} from "@/lib/catalogNumberInput";
import styles from "./QuantitySelector.module.css";

export function QuantitySelector({value, onChange, whole = false, productName, unit,
  minimum = whole ? 1 : undefined, maximum = 999, decimalPlaces, step = 1, disabled = false,
  normalizeQuantity, formatValue = formatCatalogNumber}: {
  value: number;
  onChange: (value: number) => void;
  whole?: boolean;
  productName?: string;
  unit?: string;
  minimum?: number;
  maximum?: number;
  decimalPlaces?: number;
  step?: number;
  disabled?: boolean;
  normalizeQuantity?: (quantity: number) => {value: number; message?: string} | null;
  formatValue?: (quantity: number) => string;
}) {
  const statusId = useId();
  const [draft, setDraft] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const label = `${productName ? `Количество ${productName}` : "Количество товара"}${unit ? `, ${unit}` : ""}`;
  const text = draft ?? formatValue(value);
  const parsed = parseOrderQuantity(text);
  const options = {whole, minimum, maximum, decimalPlaces};
  const invalid = draft !== null && text.trim() !== "" && (parsed === null || parsed <= 0
    || !!correctOrderQuantity(text, options).message);
  const current = draft === null ? value : parsed !== null && parsed > 0 ? parsed : value;
  const buttonClass = "min-h-11 w-11 shrink-0 cursor-pointer border border-slate-300 bg-slate-100 font-semibold transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:disabled:hover:bg-slate-800";

  function commit(direction = 0) {
    if (disabled || (draft === null && !direction)) return;
    // An untouched displayed measurement may be rounded; the saved value remains authoritative.
    const raw = draft ?? formatCatalogNumber(value);
    const restoreZero = minimum === undefined && parseOrderQuantity(raw) === 0;
    const corrected = draft === null && direction ? {value: raw, message: undefined} : correctOrderQuantity(restoreZero ? "" : raw, {
      ...options, decimalPlaces: draft === null ? undefined : decimalPlaces, fallback: value,
    });
    let next = parseOrderQuantity(corrected.value);
    let feedback = corrected.message ?? "";
    if (next === null || next <= 0) {
      next = value;
      feedback = `Восстановлено количество ${formatValue(value).replace(".", ",")}.`;
    }
    if (direction) {
      const stepped = correctOrderQuantity(formatCatalogNumber(next + direction * step), {
        ...options, decimalPlaces: undefined, fallback: value,
      });
      next = parseOrderQuantity(stepped.value) ?? value;
      feedback = stepped.message ?? "";
    }
    const normalized = normalizeQuantity?.(next);
    if (normalizeQuantity && !normalized) {
      setDraft(null);
      setMessage("Не удалось пересчитать количество. Сохранено прежнее значение.");
      return;
    }
    const quantity = normalized?.value ?? next;
    setDraft(null);
    setMessage(normalized?.message ?? feedback);
    if (quantity !== value) onChange(quantity);
  }

  const validationMessage = whole
    ? `Введите целое количество от ${minimum ?? 1} до ${maximum}.`
    : minimum !== undefined
      ? `Введите количество от ${formatCatalogNumber(minimum).replace(".", ",")} до ${formatCatalogNumber(maximum).replace(".", ",")}.`
      : `Введите количество больше 0 и не больше ${maximum}.`;

  return <div className={styles.editor}>
    <div className={styles.row}>
      <div className={styles.controls} role="group" aria-label={label}>
        <button type="button" aria-label="Уменьшить количество" onClick={() => commit(-1)}
          onMouseDown={event => event.preventDefault()} disabled={disabled || current <= (minimum ?? step)}
          className={`${buttonClass} rounded-l-lg border-r-0`}>−</button>
        <Input aria-label={label} aria-invalid={invalid || undefined} aria-describedby={statusId}
          type="text" inputMode={whole ? "numeric" : "decimal"} disabled={disabled} value={text}
          onChange={event => {setDraft(event.target.value); setMessage("");}}
          onBlur={() => commit()}
          onKeyDown={event => {
            if (event.nativeEvent.isComposing) return;
            if (event.key === "Enter") {event.preventDefault(); commit();}
            if (event.key === "Escape") {event.preventDefault(); setDraft(null); setMessage("");}
          }}
          className={`${styles.input} tabular-nums`}/>
        <button type="button" aria-label="Увеличить количество" onClick={() => commit(1)}
          onMouseDown={event => event.preventDefault()} disabled={disabled || current >= maximum}
          className={`${buttonClass} rounded-r-lg border-l-0`}>+</button>
      </div>
      {unit && <span className="text-sm text-slate-500 dark:text-slate-400">{unit}</span>}
    </div>
    <span id={statusId} aria-live="polite" className={`${styles.status} ${invalid ? styles.error : ""}`}>
      {message || (invalid ? validationMessage : "")}
    </span>
  </div>;
}
