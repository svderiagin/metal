"use client";
import {useCallback, useEffect, useRef, useState} from "react";
import {Button, ButtonLink} from "@/components/ui/Button";
import {fetchInvoice, fetchInvoiceEmailStatus} from "@/lib/checkoutClient";
import type {InvoiceEmailStatus, InvoiceReceipt} from "@/types/invoice";
import {invoiceFileName} from "@/lib/invoiceNumber";
import {rememberInvoiceEmailStatus, takeAutomaticInvoiceDownload} from "@/lib/orderConfirmation";
import {formatInvoiceDate} from "@/lib/invoiceDate";
import {companyDetails} from "@/lib/companyDetails";

export function InvoiceDownload({reference, invoice, email}: {reference: string; invoice: InvoiceReceipt; email: string}) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");
  const [reportedEmailStatus, setReportedEmailStatus] = useState<InvoiceEmailStatus>();
  const [statusTimedOut, setStatusTimedOut] = useState(false);
  const downloadLock = useRef(false);
  const download = useCallback(async () => {
    if (downloadLock.current) return;
    downloadLock.current = true;
    setDownloading(true);
    setError("");
    try {
      const blob = await fetchInvoice(reference, invoice.downloadToken);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = invoiceFileName(invoice.number);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
    } catch {
      setError("Не удалось скачать счёт. Попробуйте ещё раз или свяжитесь с нами, указав номер заказа.");
    } finally {
      downloadLock.current = false;
      setDownloading(false);
    }
  }, [invoice, reference]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (takeAutomaticInvoiceDownload(reference)) void download();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [download, reference]);
  useEffect(() => {
    if (invoice.emailStatus !== "PENDING") return;
    const controller = new AbortController();
    let timer: number;
    const deadline = window.setTimeout(() => {
      controller.abort();
      window.clearTimeout(timer);
      setStatusTimedOut(true);
    }, 45_000);
    async function check() {
      const status = await fetchInvoiceEmailStatus(reference, invoice.downloadToken, controller.signal).catch(() => undefined);
      if (controller.signal.aborted) return;
      if (status && status !== "PENDING") {
        window.clearTimeout(deadline);
        setReportedEmailStatus(status);
        rememberInvoiceEmailStatus(reference, status);
        return;
      }
      timer = window.setTimeout(check, 2_000);
    }
    timer = window.setTimeout(check, 1_000);
    return () => {
      controller.abort();
      window.clearTimeout(deadline);
      window.clearTimeout(timer);
    };
  }, [invoice.downloadToken, invoice.emailStatus, reference]);

  const emailStatus = reportedEmailStatus ?? invoice.emailStatus;
  let emailMessage = statusTimedOut ? "Статус отправки письма пока не подтверждён. Скачайте счёт на этой странице."
    : `Отправляем подтверждение заказа и PDF на ${email}.`;
  if (emailStatus === "SENT") emailMessage = `Подтверждение заказа и PDF отправлены на ${email}.`;
  if (emailStatus === "FAILED") emailMessage = "Письмо отправить не удалось. Скачайте счёт на этой странице. Повторно оформлять заказ не нужно.";
  return <div className="mt-6 space-y-5 text-left">
    <div className="space-y-1 text-sm leading-6">
      <h2 className="text-base font-semibold">Счёт на оплату № <span className="tabular-nums">{invoice.number}</span></h2>
      {invoice.paymentDueDate && <p className="text-slate-600 dark:text-slate-300">Оплатить до <strong>{formatInvoiceDate(invoice.paymentDueDate)}</strong> включительно.</p>}
      <p className="text-slate-600 dark:text-slate-300">Реквизиты и назначение платежа указаны в PDF. Дату и условия отгрузки согласуем с вами.</p>
    </div>
    <p role="status" className="break-words text-sm leading-6 text-slate-600 dark:text-slate-300">{emailMessage}</p>
    <div className="grid gap-3 sm:grid-cols-2">
      <Button onClick={download} disabled={downloading} className="w-full" aria-busy={downloading}>
        {downloading ? "Скачиваем…" : "Скачать счёт PDF"}
      </Button>
      <ButtonLink href="/catalog" variant="secondary" className="w-full">Вернуться в каталог</ButtonLink>
    </div>
    {error && <p role="alert" className="text-sm leading-6 text-red-700 dark:text-red-300">{error}</p>}
    <p className="border-t border-slate-200 pt-4 text-sm leading-6 text-slate-600 dark:border-slate-700 dark:text-slate-300">
      Вопросы по оплате, доставке или документам на продукцию можно отправить на{" "}
      <a href={`mailto:${companyDetails.salesEmail}?subject=${encodeURIComponent(`Заказ № ${reference}`)}`}
        className="break-words font-semibold text-brand-700 underline underline-offset-4 dark:text-brand-400">{companyDetails.salesEmail}</a>.
    </p>
  </div>;
}
