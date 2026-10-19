import Link from "next/link";
import type {ButtonHTMLAttributes, MouseEventHandler, ReactNode} from "react";

const styles = [
  "inline-flex min-h-11 items-center justify-center rounded-lg px-5 py-2.5",
  "text-center text-sm font-bold",
  "bg-red-700 text-white shadow-sm",
  "transition-colors hover:bg-red-800",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600 dark:focus-visible:outline-red-300",
  "disabled:pointer-events-none disabled:opacity-50",
].join(" ");

export function Button({className = "", ...props}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={`${styles} ${className}`} {...props} />;
}

export function ButtonLink({href, children, variant = "primary", className = "", onClick}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`${styles} ${
        variant === "secondary"
          ? "border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-none hover:bg-slate-100 dark:hover:bg-slate-800"
          : ""
      } ${className}`}
    >
      {children}
    </Link>
  );
}
