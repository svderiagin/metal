"use client";
import {type FormEvent, useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {useCart} from "@/hooks/useCart";
import type {CheckoutFormData, CustomerType, OrderConfirmation, PaymentMethod} from "@/types/order";
import {Button} from "@/components/ui/Button";
import {formatCurrency} from "@/lib/currency";
import {CustomerTypeSelector} from "./CustomerTypeSelector";
import {PaymentMethodSelector} from "./PaymentMethodSelector";
import {createOrderInput, isCheckoutFormValid} from "@/lib/checkout";
import {createOrder, createPayment} from "@/lib/checkoutClient";
import {rememberOrderConfirmation} from "@/lib/orderConfirmation";
import {CheckoutFields} from "./CheckoutFields";
import {companyDetails} from "@/lib/companyDetails";

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
  paymentMethod: "INVOICE",
  consentAccepted: false
};

export function CheckoutForm() {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const {items, clearCart, totalAmount, lines} = useCart();
  const router = useRouter();
  function updateField(key: keyof CheckoutFormData, value: string | boolean) {
    setForm((currentForm) => ({...currentForm, [key]: value}));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    if (!lines.length || lines.some(line => line.invalidReason)) {
      setError("Проверьте корзину: часть позиций требует уточнения цены или характеристик.");
      return;
    }
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
      rememberOrderConfirmation(confirmation);
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
    <CheckoutFields form={form} onChange={updateField}/>
    <PaymentMethodSelector value={form.paymentMethod}
                           onChange={(v: PaymentMethod) => updateField("paymentMethod", v)}/><label
      className="flex items-start gap-2 text-sm"><input type="checkbox" checked={form.consentAccepted}
                                                        onChange={e => updateField("consentAccepted", e.target.checked)}
                                                        className="mt-1 size-4 shrink-0 accent-red-700"/><span>Согласен на обработку персональных данных в соответствии с <Link href="/privacy" className="font-semibold text-red-700 dark:text-red-400 underline underline-offset-2">Политикой обработки персональных данных</Link> и подтверждаю корректность информации.</span></label>{error &&
      <div role="alert" className="text-red-700 dark:text-red-400"><p className="font-semibold">{error}</p>
        <p className="mt-2 text-sm">Для согласования заказа напишите на <a href={`mailto:${companyDetails.salesEmail}`} className="underline underline-offset-2">{companyDetails.salesEmail}</a>. Корзина и введённые данные сохранены.</p></div>}<Button type="submit"
                                                                                 disabled={submitting}>{submitting ? "Создаём заказ…" : `Создать заказ на ${formatCurrency(totalAmount)}`}</Button>
  </form>
}

