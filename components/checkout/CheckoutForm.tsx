"use client";
import {type FormEvent, useId, useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {useCart} from "@/hooks/useCart";
import type {CheckoutFormData, CustomerType, OrderConfirmation, PaymentMethod} from "@/types/order";
import {Button} from "@/components/ui/Button";
import {formatCurrency} from "@/lib/currency";
import {CustomerTypeSelector} from "./CustomerTypeSelector";
import {PaymentMethodSelector} from "./PaymentMethodSelector";
import {createOrderInput, formatCheckoutField, getCheckoutFieldErrors, type CheckoutFieldErrors, type CheckoutTextField} from "@/lib/checkout";
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
  const formId = useId();
  const [form, setForm] = useState(initial);
  const [error, setError] = useState("");
  const [submissionFailed, setSubmissionFailed] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [visited, setVisited] = useState<Partial<Record<CheckoutTextField, true>>>({});
  const [submitting, setSubmitting] = useState(false);
  const {clearCart, totalAmount, lines} = useCart();
  const router = useRouter();
  const errors = getCheckoutFieldErrors(form);
  const fieldErrors: CheckoutFieldErrors = attempted ? errors
    : Object.fromEntries(Object.entries(errors).filter(([key]) => visited[key as CheckoutTextField]));
  function blurField(key: CheckoutTextField, value: string) {
    const formatted = formatCheckoutField(key, value);
    if (formatted !== value) setForm(current => ({...current, [key]: formatted}));
    if (value.trim()) setVisited(current => ({...current, [key]: true}));
  }
  function updateField(key: keyof CheckoutFormData, value: string | boolean) {
    setForm((currentForm) => ({...currentForm, [key]: value}));
    setError("");
    setSubmissionFailed(false);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmissionFailed(false);
    if (!lines.length || totalAmount <= 0 || lines.some(line => line.invalidReason || line.priceRequiresQuote)) {
      setError("Проверьте корзину: часть позиций требует уточнения цены или характеристик.");
      return;
    }
    const errors = getCheckoutFieldErrors(form);
    const firstInvalid = Object.keys(errors)[0];
    if (firstInvalid) {
      setAttempted(true);
      setError("Проверьте обязательные поля, контактные данные и согласие.");
      const field = event.currentTarget.elements.namedItem(firstInvalid);
      if (field instanceof HTMLElement) field.focus();
      return
    }
    setSubmitting(true);
    setError("");
    try {
      const orderInput = createOrderInput(form, lines.map(({productId, quantity, measurement, pieceOrder}) => ({
        productId, quantity,
        ...(measurement ? {measurement: {inputMode: measurement.inputMode, meters: measurement.meters,
          weightTons: measurement.weightTons}} : {}),
        ...(pieceOrder ? {pieceOrder: {pieces: pieceOrder.pieces, lengthMeters: pieceOrder.lengthMeters}} : {}),
      })));
      const result = await createOrder(orderInput);
      const confirmation: OrderConfirmation = {
        orderNumber: result.order.reference,
        paymentMethod: form.paymentMethod,
        email: form.email,
        paymentPending: form.paymentMethod === "CARD",
        ...(result.order.invoice ? {invoice: result.order.invoice} : {})
      };
      rememberOrderConfirmation(confirmation);
      if (form.paymentMethod === "INVOICE") {
        clearCart();
        router.push("/order/success");
        return
      }
      const payment = await createPayment(result.order.reference, window.location.origin);
      clearCart();
      window.location.assign(payment.redirectUrl);
    } catch (caught) {
      setSubmissionFailed(true);
      setError(caught instanceof Error ? caught.message : "Не удалось оформить заказ.")
    } finally {
      setSubmitting(false)
    }
  }

  return <form onSubmit={submit} noValidate aria-busy={submitting} className="space-y-7"><CustomerTypeSelector value={form.customerType}
                                                                                        onChange={(v: CustomerType) => updateField("customerType", v)}/>
    <CheckoutFields form={form} onChange={updateField} onBlur={blurField} errors={fieldErrors} formId={formId}/>
    <PaymentMethodSelector value={form.paymentMethod}
                           onChange={(v: PaymentMethod) => updateField("paymentMethod", v)}/><div><label
      className="flex items-start gap-2 text-sm"><input type="checkbox" name="consentAccepted" checked={form.consentAccepted}
                                                        onChange={e => updateField("consentAccepted", e.target.checked)}
                                                        aria-invalid={!!fieldErrors.consentAccepted || undefined}
                                                        aria-describedby={fieldErrors.consentAccepted ? `${formId}-consent-error` : undefined}
                                                        className="mt-1 size-4 shrink-0 accent-brand-700 dark:accent-brand-300"/><span>Согласен на обработку персональных данных в соответствии с <Link href="/privacy" className="font-semibold text-brand-700 dark:text-brand-300 underline underline-offset-2">Политикой обработки персональных данных</Link> и подтверждаю корректность информации.</span></label>
      {fieldErrors.consentAccepted && <p id={`${formId}-consent-error`} className="mt-1 text-xs text-red-700 dark:text-red-400">{fieldErrors.consentAccepted}</p>}
    </div>{error &&
      <div role="alert" className="text-red-700 dark:text-red-400"><p className="font-semibold">{error}</p>
        {submissionFailed && <p className="mt-2 text-sm">Для согласования заказа напишите на <a href={`mailto:${companyDetails.salesEmail}`} className="underline underline-offset-2">{companyDetails.salesEmail}</a>. Корзина и введённые данные сохранены.</p>}</div>}<Button type="submit"
                                                                                 disabled={submitting} className="w-full sm:w-auto">{submitting ? "Создаём заказ…" : `Создать заказ на ${formatCurrency(totalAmount)}`}</Button>
  </form>
}
