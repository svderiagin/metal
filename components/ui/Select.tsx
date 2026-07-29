import type {SelectHTMLAttributes} from "react";

export function Select({className = "", ...props}: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select
    className={`min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950 focus:border-red-700 focus:outline-none focus:ring-2 focus:ring-red-100 ${className}`} {...props}/>;
}
