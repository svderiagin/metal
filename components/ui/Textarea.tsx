import type {TextareaHTMLAttributes} from "react";

export function Textarea({className = "", ...props}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea
    className={`w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950 placeholder:text-slate-400 focus:border-red-700 focus:outline-none focus:ring-2 focus:ring-red-100 ${className}`} {...props}/>;
}
