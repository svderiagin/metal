import type {SelectHTMLAttributes} from "react";
import styles from "./Select.module.css";

export function Select({className = "", ...props}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`${styles.select} min-h-11 min-w-0 max-w-full w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-slate-950 dark:text-slate-100 shadow-sm transition-colors hover:border-slate-400 dark:hover:border-slate-500 focus:border-slate-600 dark:focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-700 disabled:cursor-not-allowed disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-500 dark:disabled:text-slate-400 ${className}`}
      {...props}
    />
  );
}
