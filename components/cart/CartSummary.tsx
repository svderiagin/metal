"use client";
import {useId, useRef} from "react";
import {useCart} from "@/hooks/useCart";
import {formatCurrency} from "@/lib/currency";
import {Button, ButtonLink} from "@/components/ui/Button";
import {useQuoteRequest} from "@/components/forms/QuoteRequestContext";
import {formatCartQuantity} from "@/lib/cartQuantityInput";
import {QUOTE_LIMITS} from "@/lib/quoteValidation";
import {CartAmount} from "./CartAmount";

export function CartSummary({onClear}: {onClear: () => void}) {
  const {lineItemCount, totalAmount, lines} = useCart();
  const invalid = lines.some(line => line.invalidReason);
  const needsPriceQuote = lines.some(line => line.priceRequiresQuote);
  const quote = useQuoteRequest();
  const confirmation = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  function requestPrice() {
    const positions = lines.filter(line => !line.invalidReason);
    const details = positions.map(line => {
      const amount = line.pieceOrder ? `${line.pieceOrder.pieces} шт. по ${formatCartQuantity(line.pieceOrder.lengthMeters)} м`
        : line.measurement?.inputMode === "meter" ? `${formatCartQuantity(line.measurement.meters)} м`
          : `${formatCartQuantity(line.quantity)} ${line.quantityUnit}`;
      return `\n• ${line.name} — ${amount}`;
    });
    let message = "Прошу рассчитать стоимость и доставку товаров из корзины.";
    for (const [index, position] of details.entries()) {
      const remainder = details.length - index;
      const more = `\nВ корзине ещё ${remainder} поз. Запросите у меня полный список.`;
      if (message.length + position.length + (remainder > 1 ? more.length : 0) > QUOTE_LIMITS.message) {
        message += more;
        break;
      }
      message += position;
    }
    quote?.request(message);
    const section = document.getElementById("request");
    section?.focus({preventScroll: true});
    section?.scrollIntoView({block: "start"});
  }
  return (
    <aside className="min-w-0 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm sm:p-6">
      <h2 className="text-xl font-bold">Итого</h2>
      <dl className="mt-5 space-y-4 text-sm">
        <div className="flex justify-between gap-4">
          <dt>Позиций</dt>
          <dd>{lineItemCount}</dd>
        </div>
        <div className="grid min-w-0 gap-1 border-t border-slate-200 dark:border-slate-700 pt-4">
          <dt className="font-semibold">Сумма</dt>
          <dd className="min-w-0 text-right text-lg font-semibold sm:text-xl">{invalid || needsPriceQuote ? "Требует уточнения"
            : <CartAmount>{formatCurrency(totalAmount)}</CartAmount>}</dd>
        </div>
      </dl>
      <p className="mt-4 text-xs leading-5 text-slate-500 dark:text-slate-400">
        Доставка бесплатная. Дату и условия подъезда согласуем при подтверждении заказа.
      </p>
      {needsPriceQuote && !invalid ? <Button type="button" onClick={requestPrice} className="mt-6 w-full">Запросить расчёт</Button>
        : <ButtonLink href={invalid ? "/#request" : "/checkout"} className="mt-6 w-full">
          {invalid ? "Запросить расчёт" : "Перейти к оформлению"}
        </ButtonLink>}
      <Button
        type="button"
        variant="secondary"
        onClick={() => confirmation.current?.showModal()}
        className="mt-3 w-full"
      >
        Очистить корзину
      </Button>
      <dialog ref={confirmation} aria-labelledby={titleId} aria-describedby={descriptionId}
        className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-xl border border-slate-200 bg-white p-5 text-slate-900 shadow-xl backdrop:bg-slate-950/60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 sm:p-6">
        <h2 id={titleId} className="text-xl font-bold">Очистить корзину?</h2>
        <p id={descriptionId} className="mt-2 text-sm text-slate-600 dark:text-slate-300">Все позиции будут удалены из корзины.</p>
        <form method="dialog" className="mt-5 grid grid-cols-[repeat(auto-fit,minmax(min(100%,8rem),1fr))] gap-3">
          <Button type="submit" variant="secondary">Отмена</Button>
          <Button type="button" onClick={() => {
            confirmation.current?.close();
            onClear();
          }}>Удалить всё</Button>
        </form>
      </dialog>
    </aside>
  );
}
