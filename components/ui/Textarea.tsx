import type {TextareaHTMLAttributes} from "react";

export function Textarea({className = "", ...props}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`min-h-28 w-full resize-y rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-slate-950 dark:text-slate-100 shadow-sm transition-colors placeholder:text-slate-400 hover:border-slate-400 dark:hover:border-slate-500 focus:border-slate-600 dark:focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-700 disabled:cursor-not-allowed disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-500 dark:disabled:text-slate-400 ${className}`}
      {...props}
    />
  );
}
