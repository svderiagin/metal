"use client";
import {useState} from "react";
import {Button, ButtonLink} from "@/components/ui/Button";
import {fetchInvoice} from "@/lib/checkoutClient";
import type {InvoiceReceipt} from "@/types/invoice";

export function InvoiceDownload({reference, invoice, email}: {reference: string; invoice: InvoiceReceipt; email: string}) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");
  async function download() {
    if (downloading) return;
    setDownloading(true);
    setError("");
    try {
      const blob = await fetchInvoice(reference, invoice.downloadToken);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-${reference}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
    } catch {
      setError("Не удалось скачать счёт. Попробуйте ещё раз или свяжитесь с нами, указав номер заказа.");
    } finally {setDownloading(false);}
  }
  return <div className="mt-6 space-y-5 text-left">
    {invoice.isPreview && <p className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm leading-6 text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200">
      <strong className="block">Образец счёта — не для оплаты</strong>
      Реквизиты и ставка НДС не подтверждены. Этот PDF нельзя оплачивать.
    </p>}
    <p className="break-words text-sm leading-6 text-slate-600 dark:text-slate-300">{invoice.emailStatus === "SENT"
      ? `Копия счёта отправлена на ${email}. PDF также можно скачать здесь.`
      : "Счёт готов к скачиванию. Письмо отправить не удалось. Повторно оформлять заказ не нужно."}</p>
    <div className="grid gap-3 sm:grid-cols-2">
      <Button onClick={download} disabled={downloading} className="w-full" aria-busy={downloading}>
        {downloading ? "Скачиваем…" : "Скачать счёт PDF"}
      </Button>
      <ButtonLink href="/catalog" variant="secondary" className="w-full">Вернуться в каталог</ButtonLink>
    </div>
    {error && <p role="alert" className="text-sm leading-6 text-red-700 dark:text-red-300">{error}</p>}
  </div>;
}
