"use client";
import {useEffect, useRef} from "react";
import {useCart} from "@/hooks/useCart";
import {CartItemRow} from "./CartItemRow";
import {CartSummary} from "./CartSummary";
import {EmptyState} from "@/components/ui/EmptyState";
import {QuoteRequestProvider} from "@/components/forms/QuoteRequestContext";
import {RequestQuoteSection} from "@/components/home/RequestQuoteSection";
import styles from "./CartPageContent.module.css";
import restoreStyles from "./CartRestore.module.css";

const cartLayout = "grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem] xl:gap-8";

export function CartPageContent() {
  const {lines, hydrated, removeItem, clearCart} = useCart();
  const canRequestPrice = lines.some(line => line.priceRequiresQuote && !line.invalidReason);
  const emptyHeading = useRef<HTMLHeadingElement>(null);
  const focusAfterRemoval = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const productId = focusAfterRemoval.current;
    if (productId === undefined) return;
    focusAfterRemoval.current = undefined;
    const target = productId === null ? emptyHeading.current : document.getElementById(`cart-remove-${productId}`);
    target?.focus();
  }, [lines]);

  function removeLine(productId: string) {
    const index = lines.findIndex(line => line.productId === productId);
    focusAfterRemoval.current = (lines[index + 1] ?? lines[index - 1])?.productId ?? null;
    removeItem(productId);
  }

  function removeAll() {
    focusAfterRemoval.current = null;
    clearCart();
  }

  if (!hydrated) return (
    <div role="status" className={`${cartLayout} ${restoreStyles.loading} content-start`}>
      <span className="sr-only">Загружаем корзину…</span>
      <div aria-hidden="true" className={`${styles.items} motion-safe:animate-pulse`}>
        <div className="h-44 rounded-xl bg-slate-200 dark:bg-slate-700 sm:h-36"/>
        <div className="h-44 rounded-xl bg-slate-200 dark:bg-slate-700 sm:h-36"/>
      </div>
      <div aria-hidden="true" className="h-64 rounded-xl bg-slate-200 motion-safe:animate-pulse dark:bg-slate-700"/>
    </div>
  );
  if (!lines.length) {
    return (
      <EmptyState
        compact
        title="Корзина пуста"
        description="Добавьте металлопрокат из каталога, чтобы оформить заказ без регистрации."
        headingRef={emptyHeading}
      />
    );
  }

  return (
    <QuoteRequestProvider><div className={cartLayout}>
      <section
        className={styles.items}
        aria-label="Товары в корзине"
      >
        {lines.map((line) => (
          <CartItemRow key={line.productId} line={line} onRemove={() => removeLine(line.productId)}/>
        ))}
      </section>
      <CartSummary canRequestPrice={canRequestPrice} onClear={removeAll}/>
      {canRequestPrice && <div className="xl:col-span-2"><RequestQuoteSection appearance="cart"/></div>}
    </div></QuoteRequestProvider>
  );
}
