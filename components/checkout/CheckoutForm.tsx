"use client";
import {type FormEvent, useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {useCart} from "@/hooks/useCart";
import {ORDER_STORAGE_KEY} from "@/lib/constants";
import {isValidEmail, isValidPhone} from "@/lib/validation";
import type {CheckoutFormData, CreateOrderInput, CustomerType, OrderConfirmation, OrderItemInput, PaymentMethod} from "@/types/order";
import {Input} from "@/components/ui/Input";
import {Textarea} from "@/components/ui/Textarea";
import {Button} from "@/components/ui/Button";
import {formatCurrency} from "@/lib/currency";
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
  function updateField(key: keyof CheckoutFormData, value: string | boolean) {
    setForm((currentForm) => ({...currentForm, [key]: value}));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!isCheckoutFormValid(form)) {
      setError("Проверьте обязательные поля, контактные данные и согласие.");
      return
    }
    setSubmitting(true);
    setError("");
    try {
      const orderInput = createOrderInput(form, items);
      const result = await createOrder(orderInput);
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
      const payment = await createPayment(result.order.reference);
      clearCart();
      window.location.assign(payment.redirectUrl);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось оформить заказ.")
    } finally {
      setSubmitting(false)
    }
  }

  return <form onSubmit={submit} noValidate className="space-y-7"><CustomerTypeSelector value={form.customerType}
                                                                                        onChange={(v: CustomerType) => updateField("customerType", v)}/>
    <div className="grid gap-4 sm:grid-cols-2"><Field label="ФИО *"><Input value={form.fullName}
                                                                           onChange={e => updateField("fullName", e.target.value)}
                                                                           autoComplete="name"/></Field><Field
      label="Электронная почта *"><Input type="email" value={form.email} onChange={e => updateField("email", e.target.value)}
                             autoComplete="email"/></Field><Field label="Телефон *"><Input value={form.phone}
                                                                                           onChange={e => updateField("phone", e.target.value)}
                                                                                           autoComplete="tel"/></Field><Field
      label="Адрес доставки *"><Input value={form.deliveryAddress}
                                      onChange={e => updateField("deliveryAddress", e.target.value)}
                                      autoComplete="street-address"/></Field>{form.customerType === "COMPANY" && <>
      <Field label="Название компании *"><Input value={form.companyName}
                                                onChange={e => updateField("companyName", e.target.value)}/></Field><Field
      label="ИНН *"><Input value={form.taxNumber} onChange={e => updateField("taxNumber", e.target.value)}
                           inputMode="numeric"/></Field><Field label="Юридический адрес *" wide><Input
      value={form.legalAddress} onChange={e => updateField("legalAddress", e.target.value)}/></Field></>}<Field
      label="Комментарий" wide><Textarea rows={4} value={form.comment}
                                         onChange={e => updateField("comment", e.target.value)}/></Field></div>
    <PaymentMethodSelector value={form.paymentMethod}
                           onChange={(v: PaymentMethod) => updateField("paymentMethod", v)}/><label
      className="flex items-start gap-2 text-sm"><input type="checkbox" checked={form.consentAccepted}
                                                        onChange={e => updateField("consentAccepted", e.target.checked)}
                                                        className="mt-1 size-4 shrink-0 accent-red-700"/><span>Согласен на обработку персональных данных в соответствии с <Link href="/privacy" className="font-semibold text-red-700 underline underline-offset-2">Политикой обработки персональных данных</Link> и подтверждаю корректность информации.</span></label>{error &&
      <p role="alert" className="font-semibold text-red-700">{error}</p>}<Button type="submit"
                                                                                 disabled={submitting}>{submitting ? "Создаём заказ…" : `Создать заказ на ${formatCurrency(totalAmount)}`}</Button>
  </form>
}

function isCheckoutFormValid(form: CheckoutFormData): boolean {
  if (!form.fullName.trim()) return false;
  if (!isValidEmail(form.email)) return false;
  if (!isValidPhone(form.phone)) return false;
  if (!form.deliveryAddress.trim()) return false;
  if (!form.consentAccepted) return false;

  if (form.customerType === "COMPANY") {
    if (!form.companyName.trim()) return false;
    if (!form.taxNumber.trim()) return false;
    if (!form.legalAddress.trim()) return false;
  }

  return true;
}

function createOrderInput(form: CheckoutFormData, cartItems: OrderItemInput[]): CreateOrderInput {
  return {
    items: cartItems,
    customer: {
      type: form.customerType,
      fullName: form.fullName,
      email: form.email,
      phone: form.phone,
      companyName: form.companyName || undefined,
      taxNumber: form.taxNumber || undefined,
      legalAddress: form.legalAddress || undefined,
    },
    delivery: {
      address: form.deliveryAddress,
      comment: form.comment || undefined,
    },
    paymentMethod: form.paymentMethod,
  };
}

async function createOrder(input: CreateOrderInput): Promise<{order: {reference: string}}> {
  const response = await fetch("/api/orders", {
    method: "POST",
    headers: {"content-type": "application/json"},
    body: JSON.stringify(input),
  });
  const result: unknown = await response.json();
  if (!response.ok || !isOrderResult(result)) {
    throw new Error(readError(result, "Не удалось создать заказ."));
  }
  return result;
}

async function createPayment(orderReference: string): Promise<{redirectUrl: string}> {
  const response = await fetch("/api/payments/create", {
    method: "POST",
    headers: {"content-type": "application/json"},
    body: JSON.stringify({orderReference}),
  });
  const result: unknown = await response.json();
  if (!response.ok || !isPaymentResult(result)) {
    const message = readError(result, "Онлайн-оплата пока не настроена.");
    throw new Error(`${message} Заказ ${orderReference} сохранён; корзина не очищена.`);
  }
  return result;
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
