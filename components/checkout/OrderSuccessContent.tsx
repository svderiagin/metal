"use client";
import {useEffect, useState} from "react";
import {ORDER_STORAGE_KEY} from "@/lib/constants";
import type {OrderConfirmation} from "@/types/order";
import {ButtonLink} from "@/components/ui/Button";

export function OrderSuccessContent() {
  const [order, setOrder] = useState<OrderConfirmation | null | undefined>(undefined);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const raw = sessionStorage.getItem(ORDER_STORAGE_KEY);
        setOrder(raw ? JSON.parse(raw) as OrderConfirmation : null)
      } catch {
        setOrder(null)
      }
    }, 0);
    return () => window.clearTimeout(timer)
  }, []);
  return <div className="mx-auto max-w-2xl rounded-lg border border-slate-200 bg-white p-6 text-center md:p-10">
    <div
      className="mx-auto flex size-16 items-center justify-center rounded-full bg-green-100 text-3xl text-green-700"
      aria-hidden>✓
    </div>
    <h1 className="mt-5 text-3xl font-black">Заказ создан</h1>{order === undefined ?
    <p className="mt-3 text-slate-600">Загружаем данные заказа…</p> : order ? <><p
        className="mt-3 text-slate-600">Номер заказа: <strong
        className="text-slate-950">{order.orderNumber}</strong></p><p
        className="mt-5 rounded-md bg-slate-50 p-4 text-left text-sm leading-6">{order.paymentMethod === "CARD" ? "Заказ создан, но статус оплаты подтверждается только защищённым уведомлением платёжного провайдера." : `Вы выбрали оплату по счёту. После проверки заказа инструкции будут отправлены на ${order.email}.`}</p></> :
      <p className="mt-3 text-slate-600">Данные заказа в этой вкладке не найдены. Возможно, страница открыта
        напрямую или сессия завершилась.</p>}<ButtonLink href="/catalog" className="mt-6">Вернуться в
    каталог</ButtonLink></div>
}
