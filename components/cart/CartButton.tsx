"use client";
import Link from "next/link";
import {useCart} from "@/hooks/useCart";
import styles from "./CartButton.module.css";
import {Icon} from "@/components/ui/Icon";

export function CartButton() {
  const {lineItemCount} = useCart();
  return (
    <Link
      href="/cart"
      className={`${styles.button} action-primary relative inline-flex min-h-11 items-center gap-2 rounded-lg border px-4 font-bold transition-colors max-[380px]:gap-1 max-[380px]:px-2 max-[380px]:text-sm`}
    >
      <Icon name="cart"/>
      <span className="max-[359px]:sr-only">Корзина</span>
      <span
        className="min-w-6 rounded-full bg-brand-50 px-2 py-0.5 text-center text-xs text-brand-900"
        aria-label={formatPositionCount(lineItemCount)}
      >
        {lineItemCount}
      </span>
    </Link>
  );
}

function formatPositionCount(count: number): string {
  const lastTwoDigits = count % 100;
  const lastDigit = count % 10;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return `${count} позиций`;
  if (lastDigit === 1) return `${count} позиция`;
  if (lastDigit >= 2 && lastDigit <= 4) return `${count} позиции`;
  return `${count} позиций`;
}
