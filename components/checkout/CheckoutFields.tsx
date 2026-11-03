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

export function CheckoutFields({form, onChange}: {
  form: CheckoutFormData;
  onChange: (key: keyof CheckoutFormData, value: string | boolean) => void;
}) {
  return <div className="grid gap-4 sm:grid-cols-2">
    {contactFields.map(field => <Field key={field.key} label={field.label}>
      <Input required type={field.type} autoComplete={field.autoComplete} maxLength={CHECKOUT_LIMITS[field.key]}
        value={form[field.key]} onChange={event => onChange(field.key, event.target.value)}/>
    </Field>)}
    {form.customerType === "COMPANY" && <>
      <Field label="Название компании *"><Input required autoComplete="organization" maxLength={CHECKOUT_LIMITS.companyName}
        value={form.companyName} onChange={event => onChange("companyName", event.target.value)}/></Field>
      <Field label="ИНН *"><Input required inputMode="numeric" maxLength={CHECKOUT_LIMITS.taxNumber}
        value={form.taxNumber} onChange={event => onChange("taxNumber", event.target.value)}/></Field>
      <Field label="Юридический адрес *" wide><Input required maxLength={CHECKOUT_LIMITS.legalAddress}
        value={form.legalAddress} onChange={event => onChange("legalAddress", event.target.value)}/></Field>
    </>}
    <Field label="Комментарий" wide><Textarea rows={4} maxLength={CHECKOUT_LIMITS.comment}
      value={form.comment} onChange={event => onChange("comment", event.target.value)}/></Field>
  </div>;
}

function Field({label, children, wide = false}: {label: string; children: ReactNode; wide?: boolean}) {
  return <label className={`text-sm font-semibold ${wide ? "sm:col-span-2" : ""}`}>{label}<span className="mt-1 block">{children}</span></label>;
}
