import type {ReactNode} from "react";
import type {CheckoutFormData} from "@/types/order";
import type {CheckoutFieldErrors, CheckoutTextField} from "@/lib/checkout";
import {Input} from "@/components/ui/Input";
import {Textarea} from "@/components/ui/Textarea";

const contactFields = [
  {key: "fullName", label: "ФИО *", autoComplete: "name", type: "text"},
  {key: "email", label: "Электронная почта *", autoComplete: "email", type: "email"},
] as const;

export function CheckoutFields({form, onChange, onBlur, errors, formId}: {
  form: CheckoutFormData;
  onChange: (key: keyof CheckoutFormData, value: string | boolean) => void;
  onBlur: (key: CheckoutTextField, value: string) => void;
  errors: CheckoutFieldErrors;
  formId: string;
}) {
  function inputProps(field: CheckoutTextField, hint?: string) {
    return {name: field, "aria-invalid": !!errors[field] || undefined,
      "aria-describedby": [hint && `${formId}-${field}-hint`, errors[field] && `${formId}-${field}-error`].filter(Boolean).join(" ") || undefined,
      value: form[field], onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(field, event.target.value),
      onBlur: (event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => onBlur(field, event.target.value)};
  }
  function fieldProps(field: CheckoutTextField, hint?: string) {
    return {error: errors[field], errorId: `${formId}-${field}-error`, hint, hintId: `${formId}-${field}-hint`};
  }
  const phoneHint = "Российский с 8 или +7. Иностранный с +.";
  const innHint = "10 цифр для организации, 12 для ИП.";
  return <div className="grid items-start gap-4 sm:grid-cols-2">
    {contactFields.map(field => <Field key={field.key} label={field.label} {...fieldProps(field.key)}>
      <Input required type={field.type} autoComplete={field.autoComplete} {...inputProps(field.key)}/>
    </Field>)}
    <Field label="Телефон *" {...fieldProps("phone", phoneHint)}>
      <Input required type="tel" inputMode="tel" autoComplete="tel" placeholder="+7 900 000-00-00" {...inputProps("phone", phoneHint)}/>
    </Field>
    <Field label="Адрес доставки *" {...fieldProps("deliveryAddress")}>
      <Input required autoComplete="shipping street-address" {...inputProps("deliveryAddress")}/>
    </Field>
    {form.customerType === "COMPANY" && <>
      <Field label="Название организации или имя ИП *" {...fieldProps("companyName")}><Input required autoComplete="organization" {...inputProps("companyName")}/></Field>
      <Field label="ИНН *" {...fieldProps("taxNumber", innHint)}>
        <Input required inputMode="numeric" {...inputProps("taxNumber", innHint)}/>
      </Field>
      <Field label="Адрес регистрации *" wide {...fieldProps("legalAddress")}>
        <Input required autoComplete="billing street-address" {...inputProps("legalAddress")}/>
      </Field>
    </>}
    <Field label="Комментарий" wide {...fieldProps("comment")}><Textarea rows={4} {...inputProps("comment")}/></Field>
  </div>;
}

function Field({label, children, wide = false, error, errorId, hint, hintId}: {
  label: string; children: ReactNode; wide?: boolean; error?: string; errorId: string; hint?: string; hintId: string;
}) {
  return <div className={`min-w-0 ${wide ? "sm:col-span-2" : ""}`}>
    <label className="block text-sm font-semibold">{label}<span className="mt-1 block">{children}</span></label>
    {hint && <span id={hintId} className="mt-1 block text-xs text-slate-600 dark:text-slate-300">{hint}</span>}
    {error && <span id={errorId} className="mt-1 block text-xs font-normal text-red-700 dark:text-red-400">{error}</span>}
  </div>;
}
