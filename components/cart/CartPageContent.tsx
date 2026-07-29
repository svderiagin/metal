"use client";
import {useCart} from "@/hooks/useCart";
import {CartItemRow} from "./CartItemRow";
import {CartSummary} from "./CartSummary";
import {EmptyState} from "@/components/ui/EmptyState";
import {ButtonLink} from "@/components/ui/Button";

export function CartPageContent() {
  const {lines, hydrated} = useCart();
  if (!hydrated) return <div className="h-40 animate-pulse rounded-xl bg-slate-200"/>;
  if (!lines.length) {
    return (
      <EmptyState
        title="Корзина пуста"
        description="Добавьте металлопрокат из каталога, чтобы оформить заказ без регистрации."
      />
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-8">
      <section
        className="rounded-xl border border-slate-200 bg-white px-5 shadow-sm sm:px-6"
        aria-label="Товары в корзине"
      >
        {lines.map((line) => (
          <CartItemRow key={line.productId} line={line}/>
        ))}
      </section>
      <div>
        <CartSummary/>
        <ButtonLink href="/catalog" variant="secondary" className="mt-3 w-full">
          Продолжить покупки
        </ButtonLink>
      </div>
    </div>
  );
}
