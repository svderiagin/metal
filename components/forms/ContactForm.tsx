"use client";

import {type FormEvent, useEffect, useId, useRef, useState} from "react";
import Link from "next/link";
import {Button} from "@/components/ui/Button";
import {Input} from "@/components/ui/Input";
import {Textarea} from "@/components/ui/Textarea";
import {isApiSuccess, readApiError} from "@/lib/apiResponse";
import {companyDetails} from "@/lib/companyDetails";
import {CONTACT_LIMITS, type ContactField, type ContactFieldErrors, validateContactFields} from "@/lib/contactValidation";
import {useFormReady} from "./useFormReady";

const visibleFields = ["name", "email", "phone", "message", "consent"] as const;
const fallbackError = "Не удалось отправить сообщение. Попробуйте ещё раз.";
const labelClass = "mb-1.5 block text-sm font-semibold";
type ContactResult = {kind: "success"} | {kind: "error"; message: string};

function readFields(form: HTMLFormElement) {
  const data = new FormData(form);
  return {...Object.fromEntries(data), consent: data.get("consent") === "on"};
}

export function ContactForm() {
  const formId = useId();
  const ready = useFormReady();
  const [result, setResult] = useState<ContactResult | null>(null);
  const [fieldErrors, setFieldErrors] = useState<ContactFieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const sending = useRef(false);
  const resultPanel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (result) resultPanel.current?.focus();
  }, [result]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending.current) return;
    setResult(null);
    const form = event.currentTarget;
    const payload = readFields(form);
    const errors = validateContactFields(payload);
    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      const firstInvalid = visibleFields.find(field => errors[field]);
      const field = firstInvalid ? form.elements.namedItem(firstInvalid) : null;
      if (field instanceof HTMLElement) field.focus();
      else setResult({kind: "error", message: "Проверьте данные формы."});
      return;
    }

    sending.current = true;
    setSubmitting(true);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {"content-type": "application/json"},
        body: JSON.stringify(payload),
      });
      const responseBody: unknown = await response.json().catch(() => undefined);
      if (!response.ok || !isApiSuccess(responseBody)) {
        setResult({kind: "error", message: readApiError(responseBody, fallbackError) || fallbackError});
        return;
      }
      form.reset();
      setResult({kind: "success"});
    } catch {
      setResult({kind: "error", message: fallbackError});
    } finally {
      sending.current = false;
      setSubmitting(false);
    }
  }

  function fieldProps(field: ContactField) {
    return {
      id: `${formId}-${field}`,
      name: field,
      "aria-invalid": !!fieldErrors[field] || undefined,
      "aria-describedby": fieldErrors[field] ? `${formId}-${field}-error` : undefined,
    };
  }

  function fieldError(field: ContactField) {
    return fieldErrors[field] && <p id={`${formId}-${field}-error`}
      className="mt-1.5 text-xs text-[var(--danger-text)]">{fieldErrors[field]}</p>;
  }

  return (
    <form
      method="post"
      noValidate
      aria-label="Напишите нам"
      aria-busy={!ready || submitting}
      className="@container min-w-0"
      onSubmit={submit}
      onChange={event => {
        if (result?.kind === "success") setResult(null);
        if (Object.keys(fieldErrors).length) setFieldErrors(validateContactFields(readFields(event.currentTarget)));
      }}
    >
      <fieldset disabled={!ready || submitting} className="min-w-0 space-y-4">
        <div className="grid items-start gap-4 @min-[27rem]:grid-cols-2">
          <div className="min-w-0">
            <label htmlFor={`${formId}-name`} className={labelClass}>Имя *</label>
            <Input required maxLength={CONTACT_LIMITS.name} autoComplete="name" autoCapitalize="words"
              spellCheck={false} {...fieldProps("name")}/>
            {fieldError("name")}
          </div>
          <div className="min-w-0">
            <label htmlFor={`${formId}-email`} className={labelClass}>Электронная почта *</label>
            <Input required type="email" maxLength={CONTACT_LIMITS.email} autoComplete="email" autoCapitalize="none"
              spellCheck={false} {...fieldProps("email")}/>
            {fieldError("email")}
          </div>
        </div>
        <div>
          <label htmlFor={`${formId}-phone`} className="mb-1.5 flex flex-wrap items-baseline gap-x-2 text-sm font-semibold">
            Телефон <span className="text-xs font-normal text-slate-600 dark:text-slate-300">(необязательно)</span>
          </label>
          <Input type="tel" inputMode="tel" maxLength={CONTACT_LIMITS.phone} autoComplete="tel" {...fieldProps("phone")}/>
          {fieldError("phone")}
        </div>
        <div>
          <label htmlFor={`${formId}-message`} className={labelClass}>Сообщение *</label>
          <Textarea required rows={5} maxLength={CONTACT_LIMITS.message} {...fieldProps("message")}/>
          {fieldError("message")}
        </div>
        <label className="sr-only" aria-hidden="true">Сайт
          <Input name="website" maxLength={CONTACT_LIMITS.website} tabIndex={-1} autoComplete="off"/>
        </label>
        <div>
          <div className="flex items-start gap-2.5">
            <input type="checkbox" required className="mt-0.5 size-5 shrink-0 cursor-pointer accent-brand-700 dark:accent-brand-300"
              {...fieldProps("consent")}/>
            <div className="min-w-0 text-sm">
              <label htmlFor={`${formId}-consent`} className="cursor-pointer">Согласен на обработку персональных данных *</label>
              <Link href="/privacy" className="mt-0.5 block w-fit font-semibold text-brand-700 underline underline-offset-2 dark:text-brand-300">
                Политика обработки персональных данных
              </Link>
            </div>
          </div>
          {fieldError("consent")}
        </div>
        <Button type="submit" className="w-full sm:w-auto" disabled={submitting}>
          {!ready ? "Загружаем форму…" : submitting ? "Отправляем…" : "Отправить сообщение"}
        </Button>
      </fieldset>
      <noscript><p className="mt-3 text-sm">Включите JavaScript или напишите на <a href={`mailto:${companyDetails.salesEmail}`}
        className="underline underline-offset-2">{companyDetails.salesEmail}</a>.</p></noscript>
      {result && <div
        ref={resultPanel}
        role={result.kind === "success" ? "status" : "alert"}
        tabIndex={-1}
        className={`mt-4 rounded-lg border border-current px-4 py-3 text-sm ${result.kind === "success"
          ? "bg-[var(--success-background)] text-[var(--success-text)]"
          : "bg-[var(--danger-background)] text-[var(--danger-text)]"}`}
      >
        {result.kind === "success" ? <p className="font-semibold">Сообщение отправлено.</p> : <>
          <p className="font-semibold">{result.message}</p>
          <p className="mt-1">Можно написать на <a href={`mailto:${companyDetails.salesEmail}`}
            className="break-words underline underline-offset-2">{companyDetails.salesEmail}</a>.</p>
        </>}
      </div>}
    </form>
  );
}
