"use client";

import {useId, useRef, useState, type MouseEvent} from "react";
import {Input} from "@/components/ui/Input";
import {Icon} from "@/components/ui/Icon";
import {MAX_ORDER_PIECES} from "@/lib/constants";
import {correctOrderQuantity, formatCatalogNumber, parseCatalogNumber, parseOrderQuantity} from "@/lib/catalogNumberInput";
import {cartMaximumMessage, correctDraftPrecision, formatQuantityForInput, normalizeCartQuantityDraft, normalizeCartQuantityText, quantityTransferHandlers, stepCartQuantity, type DraftPrecision} from "@/lib/cartQuantityInput";
import {sameMeasuredQuantity} from "@/lib/orderMeasurement";
import styles from "./QuantitySelector.module.css";

type QuantityDraft = {text: string; exact?: number; capped?: boolean};

export function QuantitySelector({value, onChange, whole = false, productName, unit, fieldLabel,
  minimum = whole ? 1 : undefined, maximum = whole ? MAX_ORDER_PIECES : 999, decimalPlaces, step = 1, disabled = false,
  normalizeQuantity, hasPositiveTotal, formatValue = formatQuantityForInput,
  precision = decimalPlaces, displayThreshold}: {
  value: number;
  onChange: (value: number) => void;
  whole?: boolean;
  productName?: string;
  unit?: string;
  fieldLabel: string;
  minimum?: number;
  maximum?: number;
  decimalPlaces?: number;
  precision?: DraftPrecision;
  displayThreshold?: number;
  step?: number;
  disabled?: boolean;
  normalizeQuantity?: (quantity: number) => {value: number; message?: string} | null;
  hasPositiveTotal?: (quantity: number) => boolean;
  formatValue?: (quantity: number, grouped?: boolean) => string;
}) {
  const statusId = useId();
  const inputId = `${statusId}-input`;
  const controls = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState<QuantityDraft | null>(null);
  const [focused, setFocused] = useState(false);
  const [notice, setNotice] = useState<{text: string; quantity: number} | null>(null);
  const selection = useRef<{start: number | null; end: number | null; direction: "forward" | "backward" | "none" | null}>
    ({start: null, end: null, direction: null});
  const composition = useRef<({value: string; draft: QuantityDraft | null} & typeof selection.current) | null>(null);
  const label = `${fieldLabel}${productName ? ` ${productName}` : ""}${unit ? `, ${unit}` : ""}`;
  const editableValue = formatValue(value, false);
  const tiny = displayThreshold !== undefined && value > 0 && value < displayThreshold / 2;
  const text = draft?.text ?? (tiny ? "" : formatValue(value, !focused));
  // The paired field can change the saved quantity without editing this input.
  if (notice && !sameMeasuredQuantity(notice.quantity, value)) setNotice(null);
  const message = notice?.text ?? "";
  const parsed = draft?.exact ?? parseOrderQuantity(normalizeCartQuantityText(text));
  const options = {whole, minimum, maximum, decimalPlaces, formatFeedback: (quantity: number) => formatValue(quantity, true)};
  const invalid = draft === null ? value > maximum + Math.max(1, maximum) * Number.EPSILON * 32
    : text !== "" && text !== "0," && !isSavedQuantity(parsed) && (parsed === null || parsed <= 0 || parsed > maximum
      || (draft.exact === undefined && !!correctOrderQuantity(text, options).message));
  const current = draft === null ? value : parsed !== null && parsed > 0 ? parsed : value;
  const lowerBound = minimum ?? step;
  const atMinimum = current <= lowerBound + Math.abs(lowerBound) * Number.EPSILON * 32;
  const atMaximum = current >= maximum - Math.abs(maximum) * Number.EPSILON * 32;

  function isSavedQuantity(quantity: number | null) {
    return value > 0 && value <= maximum && (!whole || Number.isInteger(value))
      && (quantity === value || quantity === parseOrderQuantity(editableValue));
  }

  function setMessage(text: string, quantity = value) {
    setNotice(text ? {text, quantity} : null);
  }

  function preserveOwnInputFocus(event: MouseEvent<HTMLButtonElement>) {
    if (controls.current?.contains(document.activeElement)) event.preventDefault();
  }

  function updateDraft(input: HTMLInputElement) {
    const previous = composition.current ?? {value: text, draft, ...selection.current};
    const next = normalizeCartQuantityDraft(input.value, input.selectionStart, input.selectionEnd, {
      maximum, formatMaximum: bound => formatValue(bound, false),
    });
    if (!next.accepted || (input.value !== "" && input.value.trim() === "")) {
      input.value = previous.value;
      if (document.activeElement === input) input.setSelectionRange(previous.start, previous.end, previous.direction ?? undefined);
      setDraft(previous.draft);
      return previous.draft;
    }
    const amount = parseOrderQuantity(next.value);
    const sameAmount = amount !== null && amount > 0 && amount === parseOrderQuantity(previous.value);
    const previousExact = previous.draft ? previous.draft.exact : value;
    const correction = !next.capped && precision !== undefined
      ? correctDraftPrecision(next.value, precision, options, normalizeQuantity && (q => normalizeQuantity(q)?.value))
      : undefined;
    const capped = next.capped || (sameAmount && previous.draft?.capped);
    const exact = capped || amount === maximum ? maximum
      : sameAmount && previousExact !== undefined ? previousExact : correction?.exactQuantity;
    const nextText = correction?.text ?? next.value;
    const direction = input.selectionDirection;
    const start = correction ? nextText.length : next.selectionStart;
    const end = correction ? nextText.length : next.selectionEnd;
    if (nextText !== input.value) {
      input.value = nextText;
      if (document.activeElement === input) input.setSelectionRange(start, end, direction ?? undefined);
    }
    selection.current = {start, end, direction};
    const nextDraft = {text: nextText, capped, exact};
    setDraft(nextDraft);
    setMessage(next.message ?? "");
    return nextDraft;
  }

  function commit(direction = 0, candidate = draft) {
    if (disabled || composition.current || (candidate === null && !direction)) return;
    if (!direction && candidate && (candidate.text === "" || candidate.text === "0,")) {
      setDraft(null);
      setMessage("");
      return;
    }
    // An untouched displayed measurement may be rounded; the saved value remains authoritative.
    const raw = candidate?.exact !== undefined ? formatCatalogNumber(candidate.exact)
      : candidate?.text === "0," ? "" : normalizeCartQuantityText(candidate?.text ?? editableValue);
    const rawQuantity = parseOrderQuantity(raw);
    const unchanged = candidate?.exact !== undefined ? candidate.exact === value : isSavedQuantity(rawQuantity);
    if (!direction && unchanged) {setDraft(null); setMessage(""); return;}
    const restoreSaved = isSavedQuantity(value) && (parseCatalogNumber(raw) === null
      || (minimum === undefined && (rawQuantity === null || rawQuantity === 0)));
    const fromSaved = candidate === null || unchanged || restoreSaved;
    const corrected = fromSaved ? {value: formatCatalogNumber(value),
      message: restoreSaved ? `Восстановлено количество ${formatValue(value, true)}.` : undefined} : correctOrderQuantity(raw, {
      ...options, decimalPlaces: candidate?.exact !== undefined ? undefined : decimalPlaces, fallback: value,
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
    setMessage(normalized?.message ?? (feedback || (candidate?.capped ? message : "")), quantity);
    if (quantity !== value) onChange(quantity);
  }

  const validationMessage = whole
    ? `Введите целое количество от ${formatValue(minimum ?? 1, true)} до ${formatValue(maximum, true)}.`
    : minimum !== undefined
      ? `Введите количество от ${formatValue(minimum, true)} до ${formatValue(maximum, true)}.`
      : `Введите количество больше 0 и не больше ${formatValue(maximum, true)}.`;

  const transfers = quantityTransferHandlers();
  return <div className={styles.editor}>
    <label htmlFor={inputId} className={styles.label}>
      <span>{fieldLabel}</span>{unit && <span className={styles.unit}>{unit}</span>}
    </label>
    <div ref={controls} className={styles.controls} role="group" aria-label={label}>
        <button type="button" aria-label="Уменьшить количество" onClick={() => commit(-1)}
          onMouseDown={preserveOwnInputFocus} disabled={disabled || atMinimum}
          className={styles.step}><Icon name="minus"/></button>
        <Input id={inputId} aria-label={label} aria-invalid={invalid || undefined} aria-describedby={statusId}
          data-cart-input type="text" inputMode={whole ? "numeric" : "decimal"} disabled={disabled} value={text}
          placeholder={tiny && draft === null ? `< ${formatQuantityForInput(displayThreshold)}` : undefined}
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
            if ((event.nativeEvent as InputEvent).isComposing) setDraft({text: event.currentTarget.value});
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
            transfers.onPaste(event);
            if (event.defaultPrevented) return;
            const pasted = event.clipboardData.getData("text/plain");
            if (/\s/u.test(pasted)) {
              // Validate the clipboard first, then apply grouping removal to the full candidate.
              event.preventDefault();
              const input = event.currentTarget;
              selection.current = {start: input.selectionStart, end: input.selectionEnd, direction: input.selectionDirection};
              input.setRangeText(pasted.replace(/\s/gu, ""), input.selectionStart ?? 0, input.selectionEnd ?? 0, "end");
              updateDraft(input);
            }
          }}
          onDrop={transfers.onDrop}
          onBlur={() => {commit(); setFocused(false);}}
          onKeyDown={event => {
            if (event.nativeEvent.isComposing) return;
            if (event.key === "Enter") {event.preventDefault(); event.currentTarget.blur();}
            if (event.key === "Escape") {event.preventDefault(); setDraft(null); setMessage("");}
          }}
          className={`${styles.input} tabular-nums`}/>
        <button type="button" aria-label="Увеличить количество" onClick={() => commit(1)}
          onMouseDown={preserveOwnInputFocus} disabled={disabled || atMaximum}
          className={styles.step}><Icon name="plus"/></button>
    </div>
    <span id={statusId} aria-live="polite" className={`${styles.status} ${invalid ? styles.error : ""}`}>
      {message || (invalid ? validationMessage : "")}
    </span>
  </div>;
}
