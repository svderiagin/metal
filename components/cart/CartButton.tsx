"use client";
import Link from "next/link";
import {useCart} from "@/hooks/useCart";

export function CartButton() {
  const {totalQuantity} = useCart();
  return (
    <Link
      href="/cart"
      className="relative inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-600 px-4 font-bold text-white transition-colors hover:border-white hover:bg-slate-900"
    >
      <span aria-hidden>▣</span>
      Корзина
      <span
        className="min-w-6 rounded-full bg-red-700 px-2 py-0.5 text-center text-xs"
        aria-label={`${totalQuantity} товаров`}
      >
        {totalQuantity}
      </span>
    </Link>
  );
}
