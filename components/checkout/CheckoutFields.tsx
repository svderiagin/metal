import type {ReactNode} from "react";
import type {CheckoutFormData} from "@/types/order";
import {CHECKOUT_LIMITS} from "@/lib/checkout";
import {Input} from "@/components/ui/Input";
import {Textarea} from "@/components/ui/Textarea";

const contactFields = [
  {key: "fullName", label: "ФИО *", autoComplete: "name", type: "text"},
  {key: "email", label: "Электронная почта *", autoComplete: "email", type: "email"},
  {key: "phone", label: "Телефон *", autoComplete: "tel", type: "tel"},
  {key: "deliveryAddress", label: "Адрес доставки *", autoComplete: "street-address", type: "text"},
] as const;

export type CheckoutFieldErrors = Partial<Record<keyof CheckoutFormData, string>>;

export function CheckoutFields({form, onChange, errors, formId}: {
  form: CheckoutFormData;
  onChange: (key: keyof CheckoutFormData, value: string | boolean) => void;
  errors: CheckoutFieldErrors;
  formId: string;
}) {
  function validationProps(field: keyof CheckoutFormData) {
    return {name: field, "aria-invalid": !!errors[field] || undefined,
      "aria-describedby": errors[field] ? `${formId}-${field}-error` : undefined};
  }
  function errorProps(field: keyof CheckoutFormData) {
    return {error: errors[field], errorId: `${formId}-${field}-error`};
  }
  return <div className="grid items-start gap-4 sm:grid-cols-2">
    {contactFields.map(field => <Field key={field.key} label={field.label} {...errorProps(field.key)}>
      <Input required type={field.type} autoComplete={field.autoComplete} maxLength={CHECKOUT_LIMITS[field.key]}
        value={form[field.key]} onChange={event => onChange(field.key, event.target.value)} {...validationProps(field.key)}/>
    </Field>)}
    {form.customerType === "COMPANY" && <>
      <Field label="Название компании *" {...errorProps("companyName")}><Input required autoComplete="organization" maxLength={CHECKOUT_LIMITS.companyName}
        value={form.companyName} onChange={event => onChange("companyName", event.target.value)} {...validationProps("companyName")}/></Field>
      <Field label="ИНН *" {...errorProps("taxNumber")}><Input required inputMode="numeric" maxLength={CHECKOUT_LIMITS.taxNumber}
        value={form.taxNumber} onChange={event => onChange("taxNumber", event.target.value)} {...validationProps("taxNumber")}/></Field>
      <Field label="Юридический адрес *" wide {...errorProps("legalAddress")}><Input required maxLength={CHECKOUT_LIMITS.legalAddress}
        value={form.legalAddress} onChange={event => onChange("legalAddress", event.target.value)} {...validationProps("legalAddress")}/></Field>
    </>}
    <Field label="Комментарий" wide {...errorProps("comment")}><Textarea rows={4} maxLength={CHECKOUT_LIMITS.comment}
      value={form.comment} onChange={event => onChange("comment", event.target.value)} {...validationProps("comment")}/></Field>
  </div>;
}

function Field({label, children, wide = false, error, errorId}: {
  label: string; children: ReactNode; wide?: boolean; error?: string; errorId: string;
}) {
  return <div className={`min-w-0 ${wide ? "sm:col-span-2" : ""}`}>
    <label className="block text-sm font-semibold">{label}<span className="mt-1 block">{children}</span></label>
    {error && <span id={errorId} className="mt-1 block text-xs font-normal text-red-700 dark:text-red-400">{error}</span>}
  </div>;
}
