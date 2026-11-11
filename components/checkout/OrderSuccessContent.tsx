"use client";
import {useEffect, useState} from "react";
import {readOrderConfirmation} from "@/lib/orderConfirmation";
import type {OrderConfirmation} from "@/types/order";
import {ButtonLink} from "@/components/ui/Button";
import {InvoiceDownload} from "./InvoiceDownload";
import {Icon} from "@/components/ui/Icon";

export function OrderSuccessContent() {
  const [order, setOrder] = useState<OrderConfirmation | null | undefined>(undefined);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setOrder(readOrderConfirmation());
    }, 0);
    return () => window.clearTimeout(timer)
  }, []);
  return <section aria-labelledby="order-confirmation-title" className="mx-auto max-w-2xl rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 text-center md:p-10">
    <div className={`mx-auto flex size-16 items-center justify-center rounded-full ${order
      ? "bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-300"
      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`} aria-hidden>
      <Icon name={order ? "check" : "help"} className="!size-8"/>
    </div>
    <h1 id="order-confirmation-title" className="mt-5 text-page-title">{order ? "Заказ создан" : "Информация о заказе"}</h1>
    {order === undefined ? <p role="status" className="mt-3 text-slate-600 dark:text-slate-300">Загружаем данные заказа…</p>
      : order ? <>
        <p className="mt-3 flex flex-wrap items-baseline justify-center gap-x-2 gap-y-1 text-slate-600 dark:text-slate-300">
          <span>Номер заказа:</span>
          <strong className="min-w-0 max-w-full flex-none tabular-nums text-slate-950 dark:text-slate-100">{order.orderNumber}</strong>
        </p>
        {order.invoice ? <InvoiceDownload reference={order.orderNumber} invoice={order.invoice} email={order.email}/>
          : <p className="mt-6 rounded-md bg-slate-50 dark:bg-slate-800/50 p-4 text-left text-sm leading-6">
            {order.paymentMethod === "CARD" ? "Заказ создан, но статус оплаты подтверждается только защищённым уведомлением платёжного провайдера."
              : "Заказ сохранён. Для получения счёта обратитесь к нам, указав номер заказа."}
          </p>}
      </> : <p className="mt-3 text-slate-600 dark:text-slate-300">Данные заказа в этой вкладке не найдены. Возможно, страница открыта напрямую или сессия завершилась.</p>}
    {!order?.invoice && <ButtonLink href="/catalog" variant="secondary" className="mt-6 w-full sm:w-auto">Вернуться в каталог</ButtonLink>}
  </section>;
}
