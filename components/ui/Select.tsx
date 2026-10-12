import type {SelectHTMLAttributes} from "react";
import styles from "./Select.module.css";

export function Select({className = "", ...props}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`${styles.select} min-h-11 min-w-0 max-w-full w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-slate-950 shadow-sm transition-colors hover:border-slate-400 focus:border-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 ${className}`}
      {...props}
    />
  );
}
