"use client";
import {type FormEvent, useState} from "react";
import {useRouter} from "next/navigation";
import {useCart} from "@/hooks/useCart";
import {ORDER_STORAGE_KEY} from "@/lib/constants";
import {isValidEmail, isValidPhone} from "@/lib/validation";
import type {CheckoutFormData, CustomerType, OrderConfirmation, PaymentMethod} from "@/types/order";
import {Input} from "@/components/ui/Input";
import {Textarea} from "@/components/ui/Textarea";
import {Button} from "@/components/ui/Button";
import {CustomerTypeSelector} from "./CustomerTypeSelector";
import {PaymentMethodSelector} from "./PaymentMethodSelector";

const initial: CheckoutFormData = {
  customerType: "INDIVIDUAL",
  fullName: "",
  email: "",
  phone: "",
  companyName: "",
  taxNumber: "",
  legalAddress: "",
  deliveryAddress: "",
  comment: "",
  paymentMethod: "CARD",
  consentAccepted: false
};

export function CheckoutForm() {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const {items, clearCart, totalAmount} = useCart();
  const router = useRouter();
  const set = (key: keyof CheckoutFormData, value: string | boolean) => setForm(p => ({...p, [key]: value}));

  async function submit(e: FormEvent) {
    e.preventDefault();
    const companyOk = form.customerType === "INDIVIDUAL" || (form.companyName.trim() && form.taxNumber.trim() && form.legalAddress.trim());
    if (!form.fullName.trim() || !isValidEmail(form.email) || !isValidPhone(form.phone) || !form.deliveryAddress.trim() || !form.consentAccepted || !companyOk) {
      setError("Проверьте обязательные поля, контактные данные и согласие.");
      return
    }
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {"content-type": "application/json"},
        body: JSON.stringify({
          items,
          customer: {
            type: form.customerType,
            fullName: form.fullName,
            email: form.email,
            phone: form.phone,
            companyName: form.companyName || undefined,
            taxNumber: form.taxNumber || undefined,
            legalAddress: form.legalAddress || undefined
          },
          delivery: {address: form.deliveryAddress, comment: form.comment || undefined},
          paymentMethod: form.paymentMethod
        })
      });
      const result: unknown = await response.json();
      if (!response.ok || !isOrderResult(result)) throw new Error(readError(result, "Не удалось создать заказ."));
      const confirmation: OrderConfirmation = {
        orderNumber: result.order.reference,
        paymentMethod: form.paymentMethod,
        email: form.email,
        paymentPending: form.paymentMethod === "CARD"
      };
      sessionStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(confirmation));
      if (form.paymentMethod === "INVOICE") {
        clearCart();
        router.push("/order/success");
        return
      }
      const paymentResponse = await fetch("/api/payments/create", {
        method: "POST",
        headers: {"content-type": "application/json"},
        body: JSON.stringify({orderReference: result.order.reference})
      });
      const payment: unknown = await paymentResponse.json();
      if (!paymentResponse.ok || !isPaymentResult(payment)) throw new Error(`${readError(payment, "Онлайн-оплата пока не настроена.")} Заказ ${result.order.reference} сохранён; корзина не очищена.`);
      clearCart();
      window.location.assign(payment.redirectUrl);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось оформить заказ.")
    } finally {
      setSubmitting(false)
    }
  }

  return <form onSubmit={submit} noValidate className="space-y-7"><CustomerTypeSelector value={form.customerType}
                                                                                        onChange={(v: CustomerType) => set("customerType", v)}/>
    <div className="grid gap-4 sm:grid-cols-2"><Field label="ФИО *"><Input value={form.fullName}
                                                                           onChange={e => set("fullName", e.target.value)}
                                                                           autoComplete="name"/></Field><Field
      label="Email *"><Input type="email" value={form.email} onChange={e => set("email", e.target.value)}
                             autoComplete="email"/></Field><Field label="Телефон *"><Input value={form.phone}
                                                                                           onChange={e => set("phone", e.target.value)}
                                                                                           autoComplete="tel"/></Field><Field
      label="Адрес доставки *"><Input value={form.deliveryAddress}
                                      onChange={e => set("deliveryAddress", e.target.value)}
                                      autoComplete="street-address"/></Field>{form.customerType === "COMPANY" && <>
      <Field label="Название компании *"><Input value={form.companyName}
                                                onChange={e => set("companyName", e.target.value)}/></Field><Field
      label="ИНН *"><Input value={form.taxNumber} onChange={e => set("taxNumber", e.target.value)}
                           inputMode="numeric"/></Field><Field label="Юридический адрес *" wide><Input
      value={form.legalAddress} onChange={e => set("legalAddress", e.target.value)}/></Field></>}<Field
      label="Комментарий" wide><Textarea rows={4} value={form.comment}
                                         onChange={e => set("comment", e.target.value)}/></Field></div>
    <PaymentMethodSelector value={form.paymentMethod}
                           onChange={(v: PaymentMethod) => set("paymentMethod", v)}/><label
      className="flex items-start gap-2 text-sm"><input type="checkbox" checked={form.consentAccepted}
                                                        onChange={e => set("consentAccepted", e.target.checked)}
                                                        className="mt-1 size-4 accent-red-700"/>Согласен на
      обработку данных и подтверждаю корректность информации.</label>{error &&
      <p role="alert" className="font-semibold text-red-700">{error}</p>}<Button type="submit"
                                                                                 disabled={submitting}>{submitting ? "Создаём заказ…" : `Создать заказ на ${new Intl.NumberFormat("ru-RU").format(totalAmount)} ₽`}</Button>
  </form>
}

function Field({label, children, wide = false}: { label: string; children: React.ReactNode; wide?: boolean }) {
  return <label className={`text-sm font-semibold ${wide ? "sm:col-span-2" : ""}`}>{label}<span
    className="mt-1 block">{children}</span></label>
}

function isOrderResult(value: unknown): value is { order: { reference: string } } {
  return typeof value === "object" && value !== null && "order" in value && typeof value.order === "object" && value.order !== null && "reference" in value.order && typeof value.order.reference === "string"
}

function isPaymentResult(value: unknown): value is { redirectUrl: string } {
  return typeof value === "object" && value !== null && "redirectUrl" in value && typeof value.redirectUrl === "string"
}

function readError(value: unknown, fallback: string) {
  return typeof value === "object" && value !== null && "error" in value && typeof value.error === "string" ? value.error : fallback
}
