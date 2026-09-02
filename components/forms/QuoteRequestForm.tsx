"use client";
import {type FormEvent, useState} from "react";
import Link from "next/link";
import {Button} from "@/components/ui/Button";
import {Input} from "@/components/ui/Input";
import {Textarea} from "@/components/ui/Textarea";
import {isValidEmail, isValidPhone} from "@/lib/validation";

export function QuoteRequestForm() {
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    if (!data.get("name") || !isValidPhone(String(data.get("phone"))) || !isValidEmail(String(data.get("email"))) || !data.get("message") || !data.get("consent")) {
      setError("Заполните обязательные поля, проверьте контакты и подтвердите согласие.");
      return
    }
    setError("");
    setSubmitting(true);
    try {
      const response = await fetch("/api/quote", {
        method: "POST",
        headers: {"content-type": "application/json"},
        body: JSON.stringify({
          name: data.get("name"),
          phone: data.get("phone"),
          email: data.get("email"),
          company: data.get("company"),
          message: data.get("message"),
          consent: data.get("consent") === "on",
          website: data.get("website")
        })
      });
      const result: unknown = await response.json();
      if (!response.ok) throw new Error(readError(result, "Не удалось отправить заявку."));
      setSuccess(true);
      form.reset();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось отправить заявку.")
    } finally {
      setSubmitting(false)
    }
  }

  if (success) return <div role="status"
                           className="rounded-lg border border-green-300 bg-green-50 p-5 text-green-900"><strong>Заявка
    принята.</strong><p className="mt-1 text-sm">Мы свяжемся с вами после обработки запроса.</p>
    <button onClick={() => setSuccess(false)} className="mt-3 text-sm underline">Отправить ещё одну</button>
  </div>;
  return <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2"><label
    className="text-sm font-semibold">Имя *<Input name="name" required className="mt-1"
                                                  autoComplete="name"/></label><label
    className="text-sm font-semibold">Телефон *<Input name="phone" required className="mt-1" autoComplete="tel"
                                                      placeholder="+7 900 000-00-00"/></label><label
    className="text-sm font-semibold">Email *<Input name="email" type="email" required className="mt-1"
                                                    autoComplete="email"/></label><label
    className="text-sm font-semibold">Компания<Input name="company" className="mt-1"
                                                     autoComplete="organization"/></label><label
    className="text-sm font-semibold sm:col-span-2">Что требуется рассчитать? *<Textarea name="message" required
                                                                                         rows={4}
                                                                                         className="mt-1"/></label><label
    className="absolute -left-[10000px]" aria-hidden>Сайт<Input name="website" tabIndex={-1}
                                                                autoComplete="off"/></label><label
    className="flex items-start gap-2 text-sm sm:col-span-2"><input name="consent" type="checkbox" required
                                                                    className="mt-1 size-4 shrink-0 accent-red-700"/><span>Я согласен на обработку персональных данных для ответа на заявку в соответствии с <Link href="/privacy" className="font-semibold text-red-700 underline underline-offset-2">Политикой обработки персональных данных</Link>.</span></label>{error &&
    <p role="alert" className="text-sm font-semibold text-red-700 sm:col-span-2">{error}</p>}<Button type="submit"
                                                                                                     disabled={submitting}
                                                                                                     className="sm:w-fit">{submitting ? "Отправляем…" : "Отправить заявку"}</Button>
  </form>
}

function readError(value: unknown, fallback: string) {
  return typeof value === "object" && value !== null && "error" in value && typeof value.error === "string" ? value.error : fallback
}
