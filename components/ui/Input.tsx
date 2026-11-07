import type {InputHTMLAttributes} from "react";

export function Input({className = "", ...props}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`form-control min-h-11 w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-slate-950 dark:text-slate-100 shadow-none transition-colors placeholder:text-slate-500 dark:placeholder:text-slate-400 hover:border-slate-400 dark:hover:border-slate-500 disabled:cursor-not-allowed disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-500 dark:disabled:text-slate-400 ${className}`}
      {...props}
    />
  );
}
