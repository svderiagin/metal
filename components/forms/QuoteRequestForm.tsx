"use client";
import {type FocusEvent, type FormEvent, useId, useState} from "react";
import Link from "next/link";
import {Button} from "@/components/ui/Button";
import {Input} from "@/components/ui/Input";
import {Textarea} from "@/components/ui/Textarea";
import {QUOTE_LIMITS, validateQuoteFields, type QuoteErrors, type QuoteField} from "@/lib/quoteValidation";
import {PhoneInput} from "./PhoneInput";
import {useEffect} from "react";
import {useQuoteRequest} from "./QuoteRequestContext";
import styles from "./QuoteRequestForm.module.css";
import {buildQuoteMessage} from "@/lib/quoteRequest";
import {isApiSuccess, readApiError} from "@/lib/apiResponse";

export function QuoteRequestForm() {
  const formId = useId();
  const [fieldErrors, setFieldErrors] = useState<QuoteErrors>({});
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [localMessage, setLocalMessage] = useState("");
  const quote = useQuoteRequest();
  const message = quote?.message ?? localMessage;
  const setMessage = quote?.setMessage ?? setLocalMessage;
  const requestVersion = quote?.requestVersion ?? 0;
  useEffect(() => {
    if (!requestVersion) return;
    const timer = window.setTimeout(() => {setSuccess(false); setError(""); setFieldErrors({});}, 0);
    return () => window.clearTimeout(timer);
  }, [requestVersion]);
  useEffect(() => {
    const product = new URLSearchParams(window.location.search).get("product");
    const timer = window.setTimeout(() => {if (product) setMessage(buildQuoteMessage({product}).slice(0, QUOTE_LIMITS.message));}, 0);
    return () => window.clearTimeout(timer);
  }, [setMessage]);

  function validateOnBlur(event: FocusEvent<HTMLFormElement>) {
    const input = event.target;
    if (!(input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement)) return;
    const field = input.name as QuoteField;
    if (!(field in QUOTE_LIMITS) && field !== "consent") return;
    const data = new FormData(event.currentTarget);
    const errors = validateQuoteFields({...Object.fromEntries(data), consent: data.get("consent") === "on"});
    setFieldErrors(current => {
      const next = {...current};
      if (errors[field]) next[field] = errors[field];
      else delete next[field];
      return next;
    });
  }

  function clearResolvedError(event: FormEvent<HTMLFormElement>) {
    const input = event.target;
    if (!(input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement)) return;
    const field = input.name as QuoteField;
    if (!fieldErrors[field]) return;
    const data = new FormData(event.currentTarget);
    const errors = validateQuoteFields({...Object.fromEntries(data), consent: data.get("consent") === "on"});
    if (!errors[field]) setFieldErrors(current => {
      const next = {...current};
      delete next[field];
      return next;
    });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = {
      name: data.get("name"), phone: data.get("phone"), email: data.get("email"),
      company: data.get("company"), message: data.get("message"),
      consent: data.get("consent") === "on", website: data.get("website"),
    };
    const errors = validateQuoteFields(payload);
    setFieldErrors(errors);
    setError("");
    const firstInvalid = Object.keys(errors)[0];
    if (firstInvalid) {
      const field = form.elements.namedItem(firstInvalid);
      if (field instanceof HTMLElement) field.focus();
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch("/api/quote", {
        method: "POST",
        headers: {"content-type": "application/json"},
        body: JSON.stringify(payload)
      });
      const result: unknown = await response.json();
      if (!response.ok || !isApiSuccess(result)) throw new Error(readApiError(result, "Не удалось отправить заявку."));
      setSuccess(true);
      form.reset();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось отправить заявку.")
    } finally {
      setSubmitting(false)
    }
  }

  if (success) return <div role="status"
                           className="rounded-lg border border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-950/40 p-5 text-green-900 dark:text-green-200"><strong>Заявка
    принята.</strong><p className="mt-1 text-sm">Мы свяжемся с вами после обработки запроса.</p>
    <button onClick={() => setSuccess(false)} className="mt-3 text-sm underline">Отправить ещё одну</button>
  </div>;
  function validationProps(field: QuoteField) {
    return {
      "aria-invalid": !!fieldErrors[field],
      "aria-describedby": fieldErrors[field] ? `${formId}-${field}-error` : undefined,
    };
  }
  function fieldError(field: QuoteField, spacing = "mt-1") {
    return fieldErrors[field] && <span id={`${formId}-${field}-error`} className={`${styles.error} ${spacing}`} aria-live="polite">{fieldErrors[field]}</span>;
  }
  return <form onSubmit={submit} onBlur={validateOnBlur} onChange={clearResolvedError} noValidate className={`${styles.form} grid items-start gap-4 sm:grid-cols-2 [&_input::placeholder]:opacity-80 [&_textarea::placeholder]:opacity-80`}>
    <label className="text-sm font-semibold">Имя *
      <Input name="name" required maxLength={QUOTE_LIMITS.name} className="mt-1" autoComplete="name" {...validationProps("name")}/>
      {fieldError("name")}
    </label>
    <label className="text-sm font-semibold">Телефон *
      <PhoneInput name="phone" required className="mt-1" {...validationProps("phone")}/>
      {fieldError("phone")}
    </label>
    <label className="text-sm font-semibold">Электронная почта *
      <Input name="email" type="email" required maxLength={QUOTE_LIMITS.email} className="mt-1" autoComplete="email" {...validationProps("email")}/>
      {fieldError("email")}
    </label>
    <label className="text-sm font-semibold">Компания
      <Input name="company" maxLength={QUOTE_LIMITS.company} className="mt-1" autoComplete="organization" {...validationProps("company")}/>
      {fieldError("company")}
    </label>
    <label className="text-sm font-semibold sm:col-span-2">Что требуется рассчитать? *
      <Textarea name="message" required maxLength={QUOTE_LIMITS.message} rows={4} value={message}
        placeholder="Арматура рифлёная А500С, 12 мм, 100 м. Доставка в Истринский округ, СНТ «Берёзка», участок 10."
        onChange={event => setMessage(event.target.value.slice(0, QUOTE_LIMITS.message))} className="mt-1 block" {...validationProps("message")}/>
      <span className={styles.messageMeta}>
        {fieldError("message", "")}
        <span className={styles.counter}>{message.length} / {QUOTE_LIMITS.message}</span>
      </span>
    </label>
    <label className="absolute -left-[10000px]" aria-hidden>Сайт
      <Input name="website" maxLength={QUOTE_LIMITS.website} tabIndex={-1} autoComplete="off"/>
    </label>
    <div className="sm:col-span-2">
      <label className="flex items-start gap-2 text-sm">
        <input name="consent" type="checkbox" required className="mt-1 size-4 shrink-0 accent-red-700" {...validationProps("consent")}/>
        <span>Я согласен на обработку персональных данных для ответа на заявку в соответствии с <Link href="/privacy" className="font-semibold text-red-700 dark:text-red-400 underline underline-offset-2">Политикой обработки персональных данных</Link>.</span>
      </label>
      {fieldError("consent")}
    </div>
    {error && <p role="alert" className="text-sm font-semibold text-red-700 dark:text-red-400 sm:col-span-2">{error}</p>}
    <Button type="submit" disabled={submitting} className="sm:w-fit">{submitting ? "Отправляем…" : "Отправить заявку"}</Button>
  </form>;
}
