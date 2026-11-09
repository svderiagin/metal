"use client";
import {useState} from "react";
import {Button} from "@/components/ui/Button";
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
  return <div className="mt-5 space-y-4 text-left">
    {invoice.isPreview && <p className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm leading-6 text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200">
      <strong className="block">Образец счёта — не для оплаты</strong>
      Платёжные реквизиты и ставка НДС пока не заполнены. В PDF эти строки выделены красным.
    </p>}
    <p className="break-words text-sm leading-6 text-slate-600 dark:text-slate-300">{invoice.emailStatus === "SENT"
      ? `Счёт PDF передан почтовому сервису для отправки на ${email}.`
      : "Заказ сохранён, счёт сформирован. Письмо отправить не удалось. Скачайте PDF здесь; повторно оформлять заказ не нужно."}</p>
    <Button onClick={download} disabled={downloading} className="w-full sm:w-auto" aria-busy={downloading}>
      {downloading ? "Скачиваем…" : "Скачать счёт PDF"}
    </Button>
    {error && <p role="alert" className="text-sm leading-6 text-red-700 dark:text-red-300">{error}</p>}
  </div>;
}
