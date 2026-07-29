import type {InputHTMLAttributes} from "react";

export function Input({className = "", ...props}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-slate-950 shadow-sm transition-colors placeholder:text-slate-400 hover:border-slate-400 focus:border-red-700 focus:outline-none focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 ${className}`}
      {...props}
    />
  );
}
