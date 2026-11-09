"use client";
import {type FormEvent, useState} from "react";
import Link from "next/link";
import {Button} from "@/components/ui/Button";
import {Input} from "@/components/ui/Input";
import {Textarea} from "@/components/ui/Textarea";
import {isApiSuccess, readApiError} from "@/lib/apiResponse";
import {companyDetails} from "@/lib/companyDetails";

export function ContactForm() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSent(false);
    setSubmitting(true);
    setError("");
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {"content-type": "application/json"},
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          phone: data.get("phone"),
          message: data.get("message"),
          consent: data.get("consent") === "on",
          website: data.get("website")
        })
      });
      const result: unknown = await response.json();
      if (!response.ok || !isApiSuccess(result)) throw new Error(readApiError(result, "Не удалось отправить сообщение."));
      setSent(true);
      form.reset();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось отправить сообщение.")
    } finally {
      setSubmitting(false)
    }
  }

  return <form onSubmit={submit} aria-label="Связаться с нами" aria-busy={submitting} className="min-w-0 space-y-5"><label className="block text-sm font-semibold">Имя *<Input required
                                                                                                            name="name" maxLength={120} autoComplete="name"
                                                                                                            className="mt-1"/></label><label
    className="block text-sm font-semibold">Электронная почта *<Input required type="email" name="email" maxLength={254} autoComplete="email"
                                                        className="mt-1"/></label><label
    className="block text-sm font-semibold">Телефон<Input name="phone" type="tel" maxLength={30} className="mt-1"
                                                          autoComplete="tel"/></label><label
    className="block text-sm font-semibold">Сообщение *<Textarea required name="message" rows={5} maxLength={2000}
                                                               className="mt-1"/></label><label
    className="absolute -left-[10000px]" aria-hidden>Сайт<Input name="website" tabIndex={-1}
                                                                autoComplete="off"/></label><label
    className="flex items-start gap-2 text-sm"><input name="consent" type="checkbox" required
                                                       className="mt-1 size-4 shrink-0 accent-brand-700 dark:accent-brand-300"/><span>Я согласен на обработку персональных данных в соответствии с <Link href="/privacy" className="font-semibold text-brand-700 dark:text-brand-300 underline underline-offset-2">Политикой обработки персональных данных</Link>.</span></label>{sent &&
    <p role="status" className="text-sm font-semibold text-green-700 dark:text-green-300">Сообщение принято.</p>}{error &&
    <div role="alert" className="text-sm text-red-700 dark:text-red-400"><p className="font-semibold">{error}</p>
      <p className="mt-2">Отправьте сообщение на <a href={`mailto:${companyDetails.salesEmail}`} className="underline underline-offset-2">{companyDetails.salesEmail}</a>.</p></div>}<Button type="submit"
                                                                                       disabled={submitting}>{submitting ? "Отправляем…" : "Отправить"}</Button>
  </form>
}
