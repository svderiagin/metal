"use client";

import {type FormEvent, useId, useState} from "react";
import Link from "next/link";
import {Button} from "@/components/ui/Button";
import {Input} from "@/components/ui/Input";
import {Textarea} from "@/components/ui/Textarea";
import {isApiSuccess, readApiError} from "@/lib/apiResponse";
import {companyDetails} from "@/lib/companyDetails";
import {CONTACT_LIMITS, type ContactField, type ContactFieldErrors, validateContactFields} from "@/lib/contactValidation";

function readFields(form: HTMLFormElement) {
  const data = new FormData(form);
  return {...Object.fromEntries(data), consent: data.get("consent") === "on"};
}

export function ContactForm() {
  const formId = useId();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<ContactFieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSent(false);
    setError("");
    const form = event.currentTarget;
    const payload = readFields(form);
    const errors = validateContactFields(payload);
    setFieldErrors(errors);
    const firstInvalid = Object.keys(errors)[0];
    if (firstInvalid) {
      const field = form.elements.namedItem(firstInvalid);
      if (field instanceof HTMLElement) field.focus();
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {"content-type": "application/json"},
        body: JSON.stringify(payload),
      });
      const result: unknown = await response.json();
      if (!response.ok || !isApiSuccess(result)) throw new Error(readApiError(result, "Не удалось отправить сообщение."));
      setSent(true);
      form.reset();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось отправить сообщение.");
    } finally {
      setSubmitting(false);
    }
  }

  function fieldProps(field: ContactField) {
    return {name: field, "aria-invalid": !!fieldErrors[field] || undefined,
      "aria-describedby": fieldErrors[field] ? `${formId}-${field}-error` : undefined};
  }

  function fieldError(field: ContactField) {
    return fieldErrors[field] && <span id={`${formId}-${field}-error`}
      className="mt-1 block text-xs text-red-700 dark:text-red-400" aria-live="polite">{fieldErrors[field]}</span>;
  }

  return (
    <form onSubmit={submit} onChange={event => {
      if (Object.keys(fieldErrors).length) setFieldErrors(validateContactFields(readFields(event.currentTarget)));
    }} noValidate aria-label="Связаться с нами" aria-busy={submitting} className="min-w-0 space-y-5">
      <div>
        <label className="block text-sm font-semibold">Имя *
          <Input required maxLength={CONTACT_LIMITS.name} autoComplete="name" className="mt-1" {...fieldProps("name")}/>
        </label>
        {fieldError("name")}
      </div>
      <div>
        <label className="block text-sm font-semibold">Электронная почта *
          <Input required type="email" maxLength={CONTACT_LIMITS.email} autoComplete="email" className="mt-1" {...fieldProps("email")}/>
        </label>
        {fieldError("email")}
      </div>
      <div>
        <label className="block text-sm font-semibold">Телефон
          <Input type="tel" autoComplete="tel" className="mt-1" {...fieldProps("phone")}/>
        </label>
        {fieldError("phone")}
      </div>
      <div>
        <label className="block text-sm font-semibold">Сообщение *
          <Textarea required rows={5} maxLength={CONTACT_LIMITS.message} className="mt-1" {...fieldProps("message")}/>
        </label>
        {fieldError("message")}
      </div>
      <label className="absolute -left-[10000px]" aria-hidden>Сайт
        <Input name="website" maxLength={CONTACT_LIMITS.website} tabIndex={-1} autoComplete="off"/>
      </label>
      <div>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" required className="mt-1 size-4 shrink-0 accent-brand-700 dark:accent-brand-300" {...fieldProps("consent")}/>
          <span>Я согласен на обработку персональных данных в соответствии с <Link href="/privacy"
            className="font-semibold text-brand-700 dark:text-brand-300 underline underline-offset-2">Политикой обработки персональных данных</Link>.</span>
        </label>
        {fieldError("consent")}
      </div>
      {sent && <p role="status" className="text-sm font-semibold text-green-700 dark:text-green-300">Сообщение принято.</p>}
      {error && <div role="alert" className="text-sm text-red-700 dark:text-red-400">
        <p className="font-semibold">{error}</p>
        <p className="mt-2">Отправьте сообщение на <a href={`mailto:${companyDetails.salesEmail}`}
          className="underline underline-offset-2">{companyDetails.salesEmail}</a>.</p>
      </div>}
      <Button type="submit" disabled={submitting}>{submitting ? "Отправляем…" : "Отправить"}</Button>
    </form>
  );
}
