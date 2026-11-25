"use client";
import {type FormEvent, useId, useLayoutEffect, useRef, useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {useCart} from "@/hooks/useCart";
import type {CheckoutFormData} from "@/types/order";
import {Button} from "@/components/ui/Button";
import {formatCurrency} from "@/lib/currency";
import {CustomerTypeSelector} from "./CustomerTypeSelector";
import {createOrderInput, formatCheckoutField, getCheckoutFieldErrors, MAX_CHECKOUT_ITEMS, type CheckoutFieldErrors, type CheckoutTextField} from "@/lib/checkout";
import {CheckoutInvoiceTextError, CheckoutPriceChanged, createOrder} from "@/lib/checkoutClient";
import {rememberOrderConfirmation} from "@/lib/orderConfirmation";
import {CheckoutFields} from "./CheckoutFields";
import {companyDetails} from "@/lib/companyDetails";
import {isCheckoutPhoneReadyForValidation} from "@/lib/checkoutPhone";

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

export function CheckoutForm({onOrderCreated, revisedTotals, onPriceChanged}: {
  onOrderCreated: () => void;
  revisedTotals?: number[];
  onPriceChanged: (totals: number[]) => void;
}) {
  const formId = useId();
  const [form, setForm] = useState(initial);
  const [error, setError] = useState("");
  const [invoiceTextError, setInvoiceTextError] = useState<CheckoutInvoiceTextError>();
  const [validationAttempts, setValidationAttempts] = useState(0);
  const [visited, setVisited] = useState<Partial<Record<CheckoutTextField, true>>>({});
  const [submitting, setSubmitting] = useState(false);
  const submissionLock = useRef(false);
  const formElement = useRef<HTMLFormElement>(null);
  const submissionError = useRef<HTMLDivElement>(null);
  const submitActions = useRef<HTMLDivElement>(null);
  const {items, removeOrderedItems, totalAmount, lines} = useCart();
  const reviewedTotal = revisedTotals ? revisedTotals.reduce((sum, amount) => sum + amount, 0) / 100 : totalAmount;
  const router = useRouter();
  const errors = getCheckoutFieldErrors(form);
  if (invoiceTextError) errors[invoiceTextError.field] = invoiceTextError.message;
  const fieldErrors: CheckoutFieldErrors = validationAttempts ? errors
    : Object.fromEntries(Object.entries(errors).filter(([key]) => visited[key as CheckoutTextField]
      || key === "phone" && isCheckoutPhoneReadyForValidation(form.phone)
      || key === "taxNumber" && form.taxNumber.length === 12));

  useLayoutEffect(() => {
    if (!validationAttempts) return;
    const field = formElement.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
    field?.focus({preventScroll: true});
    field?.scrollIntoView({block: "center", behavior: "instant"});
  }, [validationAttempts]);

  useLayoutEffect(() => {
    if (!error) return;
    submissionError.current?.focus({preventScroll: true});
    submitActions.current?.scrollIntoView({block: "nearest", behavior: "instant"});
  }, [error]);

  function blurField(key: CheckoutTextField, value: string) {
    const formatted = formatCheckoutField(key, value);
    if (formatted !== value) setForm(current => ({...current, [key]: formatted}));
    // The address error can shift the consent checkbox while the pointer is pressed.
    // Validate the address on submit and update its message as the customer edits it.
    if (key !== "deliveryAddress" && formatted.trim()) setVisited(current => ({...current, [key]: true}));
  }
  function updateField<Key extends keyof CheckoutFormData>(key: Key, value: CheckoutFormData[Key]) {
    setForm(current => ({...current, [key]: value}));
    if (key === "customerType" || key === invoiceTextError?.field) setInvoiceTextError(undefined);
    setError("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submissionLock.current) return;
    if (lines.length > MAX_CHECKOUT_ITEMS) {
      setError(`В одном заказе может быть до ${MAX_CHECKOUT_ITEMS} позиций. Сократите список в корзине.`);
      return;
    }
    if (!lines.length || totalAmount <= 0 || lines.some(line => line.invalidReason || line.priceRequiresQuote)) {
      setError("Проверьте корзину: часть позиций требует уточнения цены или характеристик.");
      return;
    }
    if (Object.keys(errors).length) {
      setError("");
      setValidationAttempts(current => current + 1);
      return;
    }
    submissionLock.current = true;
    setSubmitting(true);
    try {
      const orderInput = createOrderInput(form, lines.map(({productId, quantity, measurement, pieceOrder}) => ({
        productId, quantity,
        ...(measurement ? {measurement: {inputMode: measurement.inputMode, meters: measurement.meters,
          weightTons: measurement.weightTons}} : {}),
        ...(pieceOrder ? {pieceOrder: {pieces: pieceOrder.pieces, lengthMeters: pieceOrder.lengthMeters}} : {}),
      })));
      const result = await createOrder(orderInput, revisedTotals ?? lines.map(line => Math.round(line.estimatedTotal * 100)));
      rememberOrderConfirmation({
        orderNumber: result.order.reference,
        totalAmount: result.order.totalAmount,
        paymentMethod: form.paymentMethod,
        email: orderInput.customer.email,
        paymentPending: false,
        ...(result.order.invoice ? {invoice: result.order.invoice} : {}),
      });
    } catch (caught) {
      if (caught instanceof CheckoutPriceChanged) onPriceChanged(caught.lineTotals);
      submissionLock.current = false;
      setSubmitting(false);
      if (caught instanceof CheckoutInvoiceTextError) {
        setInvoiceTextError(caught);
        setValidationAttempts(current => current + 1);
        setError("");
      } else {
        setError(caught instanceof Error ? caught.message : "Не удалось оформить заказ.");
      }
      return;
    }
    onOrderCreated();
    removeOrderedItems(items);
    router.replace("/order/success");
  }

  return <form ref={formElement} onSubmit={submit} noValidate aria-busy={submitting}>
    <fieldset disabled={submitting} className="min-w-0 space-y-6">
      <CustomerTypeSelector id={`${formId}-customerType`} value={form.customerType} onChange={value => updateField("customerType", value)}/>
      <CheckoutFields form={form} onChange={updateField} onBlur={blurField} errors={fieldErrors} formId={formId}
        canReuseRegistrationAddress={form.customerType === "COMPANY" && !errors.legalAddress}/>
      <div className="border-t border-slate-200 pt-5 dark:border-slate-700 sm:pt-6">
        <div className="flex items-start gap-2.5">
          <input type="checkbox" id={`${formId}-consentAccepted`} name="consentAccepted" required checked={form.consentAccepted}
            onChange={event => updateField("consentAccepted", event.target.checked)}
            aria-invalid={!!fieldErrors.consentAccepted || undefined}
            aria-describedby={fieldErrors.consentAccepted ? `${formId}-consent-error` : undefined}
            className="mt-0.5 size-5 shrink-0 cursor-pointer accent-brand-700 dark:accent-brand-300"/>
          <div className="min-w-0 flex-1">
            <label htmlFor={`${formId}-consentAccepted`} className="block cursor-pointer text-sm">
              Согласен на обработку персональных данных в соответствии с политикой и подтверждаю корректность информации. *
            </label>
            <Link href="/privacy" target="_blank" rel="noopener noreferrer"
              className="mt-1 inline-block text-xs font-medium text-brand-700 underline underline-offset-4 dark:text-brand-300">
              Политика обработки персональных данных
            </Link>
            {fieldErrors.consentAccepted && <p id={`${formId}-consent-error`} className="mt-1.5 text-xs text-[var(--danger-text)]">{fieldErrors.consentAccepted}</p>}
          </div>
        </div>
      </div>
      <div ref={submitActions} className="scroll-mb-5 space-y-3 border-t border-slate-200 pt-4 dark:border-slate-700">
        <dl className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <dt className="text-sm font-semibold">Итого</dt>
          <dd className="ml-auto text-right text-lg font-bold leading-6 tabular-nums">{formatCurrency(reviewedTotal)}</dd>
        </dl>
        <p id={`${formId}-invoice-hint`} className="text-xs text-slate-600 dark:text-slate-300">
          После оформления PDF скачается автоматически. Копию платёжного счёта отправим на указанную электронную почту.
        </p>
        <Button type="submit" disabled={submitting} aria-describedby={`${formId}-invoice-hint`} className="w-full" onMouseDown={event => {
          // Inline errors on blur can change the submit button's position before the click.
          if (event.currentTarget.form?.contains(document.activeElement)) event.preventDefault();
        }}>{submitting ? "Оформляем заказ…" : revisedTotals ? "Подтвердить сумму и оформить" : "Оформить заказ"}</Button>
        {error && <div ref={submissionError} tabIndex={-1} role="alert" className="rounded-lg border border-[var(--error-border)] bg-[var(--danger-background)] p-4 text-sm text-[var(--danger-text)]">
          <p className="font-semibold">{error}</p>
          <p className="mt-2">Данные заказа сохранены в форме. Для помощи напишите на <a href={`mailto:${companyDetails.salesEmail}`} className="font-medium underline underline-offset-2">{companyDetails.salesEmail}</a>.</p>
        </div>}
      </div>
    </fieldset>
  </form>
}
