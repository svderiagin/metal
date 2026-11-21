"use client";

import {useId, useRef, useState, type MouseEvent} from "react";
import {Input} from "@/components/ui/Input";
import {Icon} from "@/components/ui/Icon";
import {correctOrderQuantity, formatCatalogNumber, parseCatalogNumber, parseOrderQuantity} from "@/lib/catalogNumberInput";
import {cartMaximumMessage, formatQuantityForInput, normalizeCartQuantityDraft, normalizeCartQuantityText, stepCartQuantity} from "@/lib/cartQuantityInput";
import styles from "./QuantitySelector.module.css";

type QuantityDraft = {text: string; capped?: boolean};

export function QuantitySelector({value, onChange, whole = false, productName, unit, fieldLabel,
  minimum = whole ? 1 : undefined, maximum = 999, decimalPlaces, step = 1, disabled = false,
  normalizeQuantity, hasPositiveTotal, formatValue = formatQuantityForInput, wideInput = false}: {
  value: number;
  onChange: (value: number) => void;
  whole?: boolean;
  productName?: string;
  unit?: string;
  fieldLabel?: string;
  minimum?: number;
  maximum?: number;
  decimalPlaces?: number;
  step?: number;
  disabled?: boolean;
  wideInput?: boolean;
  normalizeQuantity?: (quantity: number) => {value: number; message?: string} | null;
  hasPositiveTotal?: (quantity: number) => boolean;
  formatValue?: (quantity: number, grouped?: boolean) => string;
}) {
  const statusId = useId();
  const inputId = `${statusId}-input`;
  const controls = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState<QuantityDraft | null>(null);
  const [focused, setFocused] = useState(false);
  const [message, setMessage] = useState("");
  const selection = useRef<{start: number | null; end: number | null; direction: "forward" | "backward" | "none" | null}>
    ({start: null, end: null, direction: null});
  const composition = useRef<({value: string; draft: QuantityDraft | null} & typeof selection.current) | null>(null);
  const label = `${fieldLabel ? `${fieldLabel}${productName ? ` ${productName}` : ""}`
    : productName ? `Количество ${productName}` : "Количество товара"}${unit ? `, ${unit}` : ""}`;
  const text = draft?.text ?? formatValue(value, !focused);
  const editableValue = formatValue(value, false);
  const parsed = draft?.capped ? maximum : parseOrderQuantity(normalizeCartQuantityText(text));
  const options = {whole, minimum, maximum, decimalPlaces, formatFeedback: (quantity: number) => formatValue(quantity, true)};
  const invalid = draft === null ? value > maximum + Math.max(1, maximum) * Number.EPSILON * 32
    : text.trim() !== "" && !isSavedQuantity(parsed) && (parsed === null || parsed <= 0 || parsed > maximum
      || !!correctOrderQuantity(normalizeCartQuantityText(text), options).message);
  const current = draft === null ? value : parsed !== null && parsed > 0 ? parsed : value;
  const lowerBound = minimum ?? step;
  const atMinimum = current <= lowerBound + Math.abs(lowerBound) * Number.EPSILON * 32;
  const atMaximum = current >= maximum - Math.abs(maximum) * Number.EPSILON * 32;
  const buttonClass = "inline-flex min-h-11 w-11 shrink-0 cursor-pointer items-center justify-center border border-slate-300 bg-slate-100 font-semibold transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:disabled:hover:bg-slate-800";

  function isSavedQuantity(quantity: number | null) {
    return value > 0 && value <= maximum && (!whole || Number.isInteger(value))
      && (quantity === value || quantity === parseOrderQuantity(editableValue));
  }

  function preserveOwnInputFocus(event: MouseEvent<HTMLButtonElement>) {
    if (controls.current?.contains(document.activeElement)) event.preventDefault();
  }

  function updateDraft(input: HTMLInputElement) {
    const previous = composition.current ?? {value: text, ...selection.current};
    // Rejection must not silently clamp a historical order that exceeds a newly applied limit.
    const previousDraft = normalizeCartQuantityDraft(previous.value, previous.start, previous.end);
    const next = normalizeCartQuantityDraft(input.value, input.selectionStart, input.selectionEnd, {
      maximum, formatMaximum: bound => formatValue(bound, false),
    });
    const restored = previousDraft.accepted ? previousDraft : {
      value: editableValue, selectionStart: null, selectionEnd: null,
    };
    const accepted = next.accepted ? next : restored;
    const direction = next.accepted ? input.selectionDirection : previous.direction;
    if (accepted.value !== input.value) {
      // Synchronous restoration also handles repeated rejected keys without a React state change.
      input.value = accepted.value;
      if (document.activeElement === input) input.setSelectionRange(accepted.selectionStart, accepted.selectionEnd, direction ?? undefined);
    }
    selection.current = {start: accepted.selectionStart, end: accepted.selectionEnd, direction};
    const previousState = composition.current ? composition.current.draft : draft;
    const capped = next.capped || (previousState?.capped && parseOrderQuantity(next.value) === parseOrderQuantity(previousState.text));
    const nextDraft = next.accepted ? {text: accepted.value, capped} : previousDraft.accepted ? previousState : null;
    setDraft(nextDraft);
    setMessage(next.message ?? "");
    return nextDraft;
  }

  function commit(direction = 0, candidate = draft) {
    if (disabled || composition.current || (candidate === null && !direction)) return;
    // An untouched displayed measurement may be rounded; the saved value remains authoritative.
    const raw = candidate?.capped ? formatCatalogNumber(maximum) : normalizeCartQuantityText(candidate?.text ?? editableValue);
    const rawQuantity = parseOrderQuantity(raw);
    const unchanged = isSavedQuantity(rawQuantity);
    if (!direction && unchanged) {setDraft(null); setMessage(""); return;}
    const restoreSaved = isSavedQuantity(value) && (parseCatalogNumber(raw) === null
      || (minimum === undefined && (rawQuantity === null || rawQuantity === 0)));
    const fromSaved = candidate === null || unchanged || restoreSaved;
    const corrected = fromSaved ? {value: formatCatalogNumber(value),
      message: restoreSaved ? `Восстановлено количество ${formatValue(value, true)}.` : undefined} : correctOrderQuantity(raw, {
      ...options, fallback: value,
    });
    let next = parseOrderQuantity(corrected.value);
    const feedbackFor = (result: {message?: string; capped?: boolean}) =>
      result.capped ? cartMaximumMessage(maximum, formatValue(maximum, true)) ?? "" : result.message ?? "";
    let feedback = feedbackFor(corrected);
    if (next === null || next <= 0) {
      next = value;
      feedback = `Восстановлено количество ${formatValue(value, true)}.`;
    }
    if (direction) {
      const stepped = correctOrderQuantity(formatCatalogNumber(stepCartQuantity(next, step, direction)), {
        ...options, decimalPlaces: undefined, fallback: value,
      });
      next = parseOrderQuantity(stepped.value) ?? value;
      feedback = feedbackFor(stepped);
    }
    const normalized = normalizeQuantity?.(next);
    if (normalizeQuantity && !normalized) {
      setDraft(null);
      setMessage("Не удалось пересчитать количество. Сохранено прежнее значение.");
      return;
    }
    const quantity = normalized?.value ?? next;
    setDraft(null);
    if (quantity !== value && hasPositiveTotal && !hasPositiveTotal(quantity)) {
      setMessage("Увеличьте количество. Сумма позиции должна быть больше 0 ₽. Прежнее количество сохранено.");
      return;
    }
    setMessage(normalized?.message ?? (feedback || (candidate?.capped ? message : "")));
    if (quantity !== value) onChange(quantity);
  }

  const validationMessage = whole
    ? `Введите целое количество от ${formatValue(minimum ?? 1, true)} до ${formatValue(maximum, true)}.`
    : minimum !== undefined
      ? `Введите количество от ${formatValue(minimum, true)} до ${formatValue(maximum, true)}.`
      : `Введите количество больше 0 и не больше ${formatValue(maximum, true)}.`;

  return <div className={styles.editor}>
    {fieldLabel && <label htmlFor={inputId} className={styles.label}>{fieldLabel}</label>}
    <div className={styles.row}>
      <div ref={controls} className={styles.controls} role="group" aria-label={label}>
        <button type="button" aria-label="Уменьшить количество" onClick={() => commit(-1)}
          onMouseDown={preserveOwnInputFocus} disabled={disabled || atMinimum}
          className={`${buttonClass} rounded-l-lg border-r-0`}><Icon name="minus"/></button>
        <Input id={inputId} aria-label={label} aria-invalid={invalid || undefined} aria-describedby={statusId}
          data-cart-input type="text" inputMode={whole ? "numeric" : "decimal"} disabled={disabled} value={text}
          autoComplete="off" spellCheck={false}
          onFocus={() => setFocused(true)}
          onSelect={event => {
            if (!composition.current) selection.current = {start: event.currentTarget.selectionStart,
              end: event.currentTarget.selectionEnd, direction: event.currentTarget.selectionDirection};
          }}
          onBeforeInput={event => {
            if (!composition.current) selection.current = {start: event.currentTarget.selectionStart,
              end: event.currentTarget.selectionEnd, direction: event.currentTarget.selectionDirection};
          }}
          onCompositionStart={event => {composition.current = {value: text, draft, start: event.currentTarget.selectionStart,
            end: event.currentTarget.selectionEnd, direction: event.currentTarget.selectionDirection};}}
          onChange={event => {
            if ((event.nativeEvent as InputEvent).isComposing) {setDraft({text: event.currentTarget.value}); setMessage("");}
            else updateDraft(event.currentTarget);
          }}
          onCompositionEnd={event => {
            const result = updateDraft(event.currentTarget);
            composition.current = null;
            // A rejected composition must not confirm or clamp an untouched historical order.
            if (document.activeElement !== event.currentTarget && result !== null) {
              commit(0, result);
            }
          }}
          onPaste={event => {
            const pasted = event.clipboardData.getData("text/plain").trim();
            const checked = normalizeCartQuantityDraft(pasted, pasted.length, pasted.length, {maximum});
            if (!checked.accepted) {
              event.preventDefault();
              setMessage(checked.message ?? "Проверьте вставляемое число.");
            } else if (/\s/u.test(pasted)) {
              // Validate the clipboard first, then apply grouping removal to the full candidate.
              event.preventDefault();
              const input = event.currentTarget;
              selection.current = {start: input.selectionStart, end: input.selectionEnd, direction: input.selectionDirection};
              input.setRangeText(pasted.replace(/\s/gu, ""), input.selectionStart ?? 0, input.selectionEnd ?? 0, "end");
              updateDraft(input);
            }
          }}
          onDrop={event => {
            const dropped = event.dataTransfer.getData("text/plain").trim();
            const checked = normalizeCartQuantityDraft(dropped, dropped.length, dropped.length, {maximum});
            if (!checked.accepted) {event.preventDefault(); setMessage(checked.message ?? "Проверьте вставляемое число.");}
          }}
          onBlur={() => {commit(); setFocused(false);}}
          onKeyDown={event => {
            if (event.nativeEvent.isComposing) return;
            if (event.key === "Enter") {event.preventDefault(); event.currentTarget.blur();}
            if (event.key === "Escape") {event.preventDefault(); setDraft(null); setMessage("");}
          }}
          className={`${styles.input} ${wideInput ? styles.wideInput : ""} tabular-nums`}/>
        <button type="button" aria-label="Увеличить количество" onClick={() => commit(1)}
          onMouseDown={preserveOwnInputFocus} disabled={disabled || atMaximum}
          className={`${buttonClass} rounded-r-lg border-l-0`}><Icon name="plus"/></button>
      </div>
      {unit && <span className="text-sm text-slate-500 dark:text-slate-400">{unit}</span>}
    </div>
    <span id={statusId} aria-live="polite" className={`${styles.status} ${invalid ? styles.error : ""}`}>
      {message || (invalid ? validationMessage : "")}
    </span>
  </div>;
}
