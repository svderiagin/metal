import Link from "next/link";
import type {ButtonHTMLAttributes, ReactNode} from "react";

const styles = "inline-flex min-h-11 items-center justify-center rounded-md bg-red-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-red-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 disabled:cursor-not-allowed disabled:opacity-50";

export function Button({className = "", ...props}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={`${styles} ${className}`} {...props} />;
}

export function ButtonLink({href, children, variant = "primary", className = ""}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
  className?: string
}) {
  return <Link href={href}
               className={`${styles} ${variant === "secondary" ? "border border-slate-300 bg-white text-slate-900 hover:bg-slate-100" : ""} ${className}`}>{children}</Link>;
}
