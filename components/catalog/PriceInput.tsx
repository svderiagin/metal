import type {InputHTMLAttributes} from "react";
import {Input} from "@/components/ui/Input";

export function PriceInput({className = "", ...props}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <span className="relative mt-1 block">
      <Input
        {...props}
        className={`pr-10 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${className}`}
      />
      <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center font-normal text-slate-500">₽</span>
      <span className="sr-only">в рублях</span>
    </span>
  );
}
