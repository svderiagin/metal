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
import {CHECKOUT_LIMITS, createOrderInput, isCheckoutFormValid} from "@/lib/checkout";
import {createOrder, createPayment} from "@/lib/checkoutClient";
import {rememberOrderConfirmation} from "@/lib/orderConfirmation";
import {CheckoutFields, type CheckoutFieldErrors} from "./CheckoutFields";
import {companyDetails} from "@/lib/companyDetails";
import {isValidEmail, isValidPhone} from "@/lib/validation";

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
  const [submitting, setSubmitting] = useState(false);
  const {clearCart, totalAmount, lines} = useCart();
  const router = useRouter();
  const fieldErrors: CheckoutFieldErrors = attempted ? getCheckoutFieldErrors(form) : {};
  function updateField(key: keyof CheckoutFormData, value: string | boolean) {
    setForm((currentForm) => ({...currentForm, [key]: value}));
    setError("");
    setSubmissionFailed(false);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmissionFailed(false);
    if (!lines.length || lines.some(line => line.invalidReason)) {
      setError("Проверьте корзину: часть позиций требует уточнения цены или характеристик.");
      return;
    }
    if (!isCheckoutFormValid(form)) {
      setAttempted(true);
      setError("Проверьте обязательные поля, контактные данные и согласие.");
      const firstInvalid = Object.keys(getCheckoutFieldErrors(form))[0];
      const field = firstInvalid ? event.currentTarget.elements.namedItem(firstInvalid) : null;
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
      setSubmissionFailed(true);
      setError(caught instanceof Error ? caught.message : "Не удалось оформить заказ.")
    } finally {
      setSubmitting(false)
    }
  }

  return <form onSubmit={submit} noValidate aria-busy={submitting} className="space-y-7"><CustomerTypeSelector value={form.customerType}
                                                                                        onChange={(v: CustomerType) => updateField("customerType", v)}/>
    <CheckoutFields form={form} onChange={updateField} errors={fieldErrors} formId={formId}/>
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

function getCheckoutFieldErrors(form: CheckoutFormData): CheckoutFieldErrors {
  const errors: CheckoutFieldErrors = {};
  if (!form.fullName.trim()) errors.fullName = "Укажите ФИО.";
  if (!isValidEmail(form.email)) errors.email = "Введите корректный адрес электронной почты.";
  if (!isValidPhone(form.phone)) errors.phone = "Введите телефон, содержащий от 10 до 15 цифр.";
  if (!form.deliveryAddress.trim()) errors.deliveryAddress = "Укажите адрес доставки.";
  if (form.customerType === "COMPANY") {
    if (!form.companyName.trim()) errors.companyName = "Укажите название компании.";
    if (!form.taxNumber.trim()) errors.taxNumber = "Укажите ИНН.";
    if (!form.legalAddress.trim()) errors.legalAddress = "Укажите юридический адрес.";
  }
  for (const [key, maximum] of Object.entries(CHECKOUT_LIMITS)) {
    const field = key as keyof typeof CHECKOUT_LIMITS;
    if (form[field].trim().length > maximum) errors[field] = `Максимум ${maximum} символов.`;
  }
  if (!form.consentAccepted) errors.consentAccepted = "Подтвердите согласие на обработку персональных данных.";
  return errors;
}

