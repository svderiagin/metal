import type {ChangeEvent, ClipboardEvent, ComponentProps, ReactNode} from "react";
import type {CheckoutFormData} from "@/types/order";
import {CHECKOUT_LIMITS, formatCheckoutField, type CheckoutFieldErrors, type CheckoutTextField} from "@/lib/checkout";
import {Input} from "@/components/ui/Input";
import {Textarea} from "@/components/ui/Textarea";
import {CheckoutPhoneInput} from "./CheckoutPhoneInput";

export function CheckoutFields({form, onChange, onBlur, errors, formId, canReuseRegistrationAddress}: {
  form: CheckoutFormData;
  onChange: (key: CheckoutTextField, value: string) => void;
  onBlur: (key: CheckoutTextField, value: string) => void;
  errors: CheckoutFieldErrors;
  formId: string;
  canReuseRegistrationAddress: boolean;
}) {
  function inputProps(field: CheckoutTextField, hint?: string) {
    return {id: `${formId}-${field}`, name: field, "aria-invalid": !!errors[field] || undefined,
      "aria-describedby": [hint && `${formId}-${field}-hint`, errors[field] && `${formId}-${field}-error`].filter(Boolean).join(" ") || undefined,
      value: form[field], onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(field, event.target.value),
      onBlur: (event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => onBlur(field, event.target.value)};
  }
  function fieldProps(field: CheckoutTextField, hint?: string) {
    return {inputId: `${formId}-${field}`, error: errors[field], errorId: `${formId}-${field}-error`, hint, hintId: `${formId}-${field}-hint`};
  }

  function textField(field: CheckoutTextField, label: string, props: ComponentProps<typeof Input>, hint?: string) {
    return <Field label={label} required {...fieldProps(field, hint)}>
      <Input required {...props} {...inputProps(field, hint)} onPaste={event => pasteText(field, event)}
        onChange={event => {
          const input = event.currentTarget;
          if (field === "taxNumber" && (!/^\d*$/.test(input.value) || input.value.length > CHECKOUT_LIMITS.taxNumber)) {
            // Restore the selection when a character or a thirteenth digit is rejected.
            const previous = form.taxNumber;
            const suffixLength = input.value.length - (input.selectionEnd ?? input.value.length);
            const end = Math.max(0, previous.length - suffixLength);
            let start = 0;
            while (start < end && previous[start] === input.value[start]) start++;
            input.value = previous;
            input.setSelectionRange(start, end);
            return;
          }
          onChange(field, input.value);
        }}/>
    </Field>;
  }

  function pasteText(field: CheckoutTextField, event: ClipboardEvent<HTMLInputElement>) {
    const copied = event.clipboardData.getData("text");
    const input = event.currentTarget;
    let start = input.selectionStart ?? 0;
    let end = input.selectionEnd ?? start;
    let text = copied;
    if (field === "taxNumber") {
      event.preventDefault();
      text = formatCheckoutField(field, copied);
      if (!/^\d+$/.test(text)) return;
      if (text.length === 10 || text.length === 12) {
        start = 0;
        end = input.value.length;
      }
      if (input.value.length - (end - start) + text.length > CHECKOUT_LIMITS.taxNumber) return;
    } else {
      // Native single-line controls can join words when a multiline value is pasted.
      text = copied.replace(/[\p{Zs}\t\n\r]+/gu, " ");
      if (text === copied) return;
      event.preventDefault();
    }
    input.setRangeText(text, start, end, "end");
    onChange(field, input.value);
  }

  const sectionClass = "space-y-4 border-t border-slate-200 pt-5 dark:border-slate-700 sm:pt-6";
  const commentHint = "Например, желаемая дата, ограничения подъезда или место разгрузки.";
  return <>
    <section className={sectionClass} aria-labelledby={`${formId}-contacts`}>
      <h2 id={`${formId}-contacts`} className="text-card-title">Контактные данные</h2>
      {textField("fullName", "ФИО", {autoComplete: "name", autoCapitalize: "words", spellCheck: false})}
      {textField("email", "Электронная почта", {inputMode: "email", autoComplete: "email", autoCapitalize: "none", spellCheck: false})}
      <Field label="Телефон" required {...fieldProps("phone")}>
        <CheckoutPhoneInput required className="tabular-nums" {...inputProps("phone")} onChange={value => onChange("phone", value)}/>
      </Field>
    </section>
    {form.customerType === "COMPANY" && <section className={sectionClass} aria-labelledby={`${formId}-company`}>
      <h2 id={`${formId}-company`} className="text-card-title">Реквизиты для счёта</h2>
      {textField("companyName", "Название организации или ФИО ИП", {autoComplete: "organization"})}
      {textField("taxNumber", "ИНН", {inputMode: "numeric", spellCheck: false},
        "10 цифр для организации, 12 для ИП.")}
      {textField("legalAddress", "Адрес регистрации", {autoComplete: "billing street-address"})}
    </section>}
    <section className={sectionClass} aria-labelledby={`${formId}-delivery`}>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <h2 id={`${formId}-delivery`} className="text-card-title">Доставка</h2>
        {canReuseRegistrationAddress && !form.deliveryAddress.trim() && <button type="button" className="min-h-6 cursor-pointer rounded-sm text-left text-xs font-medium text-brand-800 underline underline-offset-4 dark:text-brand-300"
          onClick={() => {
            onChange("deliveryAddress", formatCheckoutField("legalAddress", form.legalAddress));
            document.getElementById(`${formId}-deliveryAddress`)?.focus();
          }}>Подставить адрес регистрации</button>}
      </div>
      <Field label="Адрес доставки" required {...fieldProps("deliveryAddress")}>
        <Textarea required rows={2} autoComplete="shipping street-address"
          style={{fieldSizing: "content", minHeight: "calc(2lh + 1.25rem + 2px)"}}
          {...inputProps("deliveryAddress")}/>
      </Field>
      <Field label="Комментарий к доставке" {...fieldProps("comment", commentHint)}>
        <Textarea rows={3} {...inputProps("comment", commentHint)}/>
      </Field>
    </section>
  </>;
}

function Field({label, children, required = false, inputId, error, errorId, hint, hintId}: {
  label: string; children: ReactNode; required?: boolean; inputId: string; error?: string; errorId: string; hint?: string; hintId: string;
}) {
  return <div className="min-w-0">
    <label htmlFor={inputId} className="flex flex-wrap items-baseline gap-x-2 text-sm font-semibold">
      <span>{label}{required && " *"}</span>
      {!required && <span className="text-xs font-normal text-slate-600 dark:text-slate-300">(необязательно)</span>}
    </label>
    <div className="mt-1.5">{children}</div>
    {error && <p id={errorId} className="mt-1.5 text-xs text-[var(--danger-text)]">{error}</p>}
    {hint && <p id={hintId} className="mt-1 text-xs text-slate-600 dark:text-slate-300">{hint}</p>}
  </div>;
}
