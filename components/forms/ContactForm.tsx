"use client";
import {type FormEvent, useState} from "react";
import Link from "next/link";
import {Button} from "@/components/ui/Button";
import {Input} from "@/components/ui/Input";
import {Textarea} from "@/components/ui/Textarea";

export function ContactForm() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
      if (!response.ok) throw new Error(readError(result, "Не удалось отправить сообщение."));
      setSent(true);
      form.reset();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось отправить сообщение.")
    } finally {
      setSubmitting(false)
    }
  }

  return <form onSubmit={submit} className="min-w-0 space-y-5"><h2
    className="text-xl font-bold">Написать нам</h2><label className="block text-sm font-semibold">Имя<Input required
                                                                                                            name="name"
                                                                                                            className="mt-1"/></label><label
    className="block text-sm font-semibold">Электронная почта<Input required type="email" name="email"
                                                        className="mt-1"/></label><label
    className="block text-sm font-semibold">Телефон<Input name="phone" className="mt-1"
                                                          autoComplete="tel"/></label><label
    className="block text-sm font-semibold">Сообщение<Textarea required name="message" rows={5}
                                                               className="mt-1"/></label><label
    className="absolute -left-[10000px]" aria-hidden>Сайт<Input name="website" tabIndex={-1}
                                                                autoComplete="off"/></label><label
    className="flex items-start gap-2 text-sm"><input name="consent" type="checkbox" required
                                                       className="mt-1 size-4 shrink-0 accent-red-700"/><span>Я согласен на обработку персональных данных в соответствии с <Link href="/privacy" className="font-semibold text-red-700 underline underline-offset-2">Политикой обработки персональных данных</Link>.</span></label>{sent &&
    <p role="status" className="text-sm font-semibold text-green-700">Сообщение принято.</p>}{error &&
    <p role="alert" className="text-sm font-semibold text-red-700">{error}</p>}<Button type="submit"
                                                                                       disabled={submitting}>{submitting ? "Отправляем…" : "Отправить"}</Button>
  </form>
}

function readError(value: unknown, fallback: string) {
  return typeof value === "object" && value !== null && "error" in value && typeof value.error === "string" ? value.error : fallback
}
