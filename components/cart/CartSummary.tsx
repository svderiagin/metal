"use client";
import {useId, useRef} from "react";
import {useCart} from "@/hooks/useCart";
import {formatCurrency} from "@/lib/currency";
import {Button, ButtonLink} from "@/components/ui/Button";
import {useQuoteRequest} from "@/components/forms/QuoteRequestContext";
import {formatCartQuantity} from "@/lib/cartQuantityInput";
import {getProductVariantById} from "@/lib/cartCatalog";
import {QUOTE_LIMITS} from "@/lib/quoteValidation";
import {CartAmount} from "./CartAmount";

export function CartSummary({canRequestPrice, onClear}: {canRequestPrice: boolean; onClear: () => void}) {
  const {lineItemCount, totalAmount, lines} = useCart();
  const invalid = lines.some(line => line.invalidReason);
  const totalNeedsClarification = invalid || canRequestPrice;
  const quote = useQuoteRequest();
  const confirmation = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  function requestPrice() {
    const positions = lines.filter(line => !line.invalidReason);
    const details = positions.map(line => {
      const sheetOrder = getProductVariantById(line.productId)?.sheetOrder;
      const sheets = sheetOrder ? line.quantity / sheetOrder.quantityPerSheet : undefined;
      let amount = `${formatCartQuantity(line.quantity)} ${line.quantityUnit}`;
      if (line.pieceOrder) {
        amount = `${formatCartQuantity(line.pieceOrder.pieces)} шт. по ${formatCartQuantity(line.pieceOrder.lengthMeters)} м`;
      } else if (line.measurement) {
        const {inputMode, meters, weightTons} = line.measurement;
        amount = inputMode === "meter" ? `${formatCartQuantity(meters)} м` : `${formatCartQuantity(weightTons)} т`;
      } else if (sheets !== undefined && Number.isInteger(sheets)) {
        amount = `${formatCartQuantity(sheets)} шт.`;
      }
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
    <aside className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6" aria-labelledby={titleId + "-summary"}>
      <h2 id={titleId + "-summary"} className="text-card-title">Итого</h2>
      <dl className="mt-4 space-y-3 text-sm">
        <div className="flex justify-between gap-4 text-slate-600 dark:text-slate-300">
          <dt>Позиций</dt>
          <dd className="tabular-nums">{lineItemCount}</dd>
        </div>
        <div className="flex justify-between gap-4 text-slate-600 dark:text-slate-300">
          <dt>Доставка</dt>
          <dd>Бесплатно</dd>
        </div>
        <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-slate-200 pt-3 dark:border-slate-700">
          <dt className="font-semibold">Сумма</dt>
          <dd className={`ml-auto min-w-0 text-right ${totalNeedsClarification
            ? "font-medium text-slate-600 dark:text-slate-300"
            : "text-lg font-bold leading-6"}`}>
            {totalNeedsClarification ? "Требует уточнения" : <CartAmount>{formatCurrency(totalAmount)}</CartAmount>}
          </dd>
        </div>
      </dl>
      <p className="mt-3 text-xs leading-5 text-slate-600 dark:text-slate-400">
        Дату и условия подъезда согласуем при подтверждении заказа.
      </p>
      {invalid && <p className="mt-3 text-sm text-[var(--danger-text)]">Проверьте отмеченные позиции перед оформлением.</p>}
      <div className="mt-5 grid gap-2.5">
        {canRequestPrice ? <Button type="button" onClick={requestPrice}>Запросить расчёт</Button>
          : invalid ? <ButtonLink href="/#request">Запросить расчёт</ButtonLink>
            : <ButtonLink href="/checkout">Перейти к оформлению</ButtonLink>}
        <ButtonLink href="/catalog" variant="secondary">Продолжить покупки</ButtonLink>
      </div>
      <div className="mt-2 flex justify-center">
        <button type="button" onClick={() => confirmation.current?.showModal()}
          className="min-h-11 cursor-pointer rounded-lg px-3 text-sm font-medium text-slate-600 hover:text-[var(--danger-text)] hover:underline dark:text-slate-400 dark:hover:text-[var(--danger-text)]">
          Очистить корзину
        </button>
      </div>
      <dialog ref={confirmation} aria-labelledby={titleId} aria-describedby={descriptionId}
        className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-xl border border-slate-200 bg-white p-5 text-slate-900 shadow-xl backdrop:bg-slate-950/60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 sm:p-6">
        <h2 id={titleId} className="text-card-title">Очистить корзину?</h2>
        <p id={descriptionId} className="mt-2 text-sm text-slate-600 dark:text-slate-300">Все позиции будут удалены из корзины.</p>
        <form method="dialog" className="mt-5 grid grid-cols-[repeat(auto-fit,minmax(min(100%,8rem),1fr))] gap-3">
          <Button type="submit" variant="secondary">Отмена</Button>
          <Button type="button" className="border-[var(--danger-text)] bg-[var(--danger-background)] text-[var(--danger-text)] hover:bg-[var(--danger-hover)]" onClick={() => {
            confirmation.current?.close();
            onClear();
          }}>Удалить всё</Button>
        </form>
      </dialog>
    </aside>
  );
}
