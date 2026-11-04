"use client";
import {useEffect, useState} from "react";
import {readOrderConfirmation} from "@/lib/orderConfirmation";
import type {OrderConfirmation} from "@/types/order";
import {ButtonLink} from "@/components/ui/Button";

export function OrderSuccessContent() {
  const [order, setOrder] = useState<OrderConfirmation | null | undefined>(undefined);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setOrder(readOrderConfirmation());
    }, 0);
    return () => window.clearTimeout(timer)
  }, []);
  return <div className="mx-auto max-w-2xl rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 text-center md:p-10">
    <div
      className="mx-auto flex size-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-950/60 text-3xl text-green-700 dark:text-green-300"
      aria-hidden>{order ? "✓" : "i"}
    </div>
    <h1 className="mt-5 text-page-title">{order ? "Заказ создан" : "Информация о заказе"}</h1>{order === undefined ?
    <p className="mt-3 text-slate-600 dark:text-slate-300">Загружаем данные заказа…</p> : order ? <><p
        className="mt-3 text-slate-600 dark:text-slate-300">Номер заказа: <strong
        className="text-slate-950 dark:text-slate-100">{order.orderNumber}</strong></p><p
        className="mt-5 rounded-md bg-slate-50 dark:bg-slate-800/50 p-4 text-left text-sm leading-6">{order.paymentMethod === "CARD" ? "Заказ создан, но статус оплаты подтверждается только защищённым уведомлением платёжного провайдера." : `Вы выбрали оплату по счёту. После проверки заказа инструкции будут отправлены на ${order.email}.`}</p></> :
      <p className="mt-3 text-slate-600 dark:text-slate-300">Данные заказа в этой вкладке не найдены. Возможно, страница открыта
        напрямую или сессия завершилась.</p>}<ButtonLink href="/catalog" className="mt-6">Вернуться в
    каталог</ButtonLink></div>
}
