import Link from "next/link";
import type {ButtonHTMLAttributes, ReactNode} from "react";

const styles = [
  "inline-flex min-h-11 items-center justify-center rounded-lg px-5 py-2.5",
  "text-center text-sm font-bold",
  "bg-red-700 text-white shadow-sm",
  "transition-colors hover:bg-red-800",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700",
  "disabled:pointer-events-none disabled:opacity-50",
].join(" ");

export function Button({className = "", ...props}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={`${styles} ${className}`} {...props} />;
}

export function ButtonLink({href, children, variant = "primary", className = ""}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
  className?: string
}) {
  return (
    <Link
      href={href}
      className={`${styles} ${
        variant === "secondary"
          ? "border border-slate-300 bg-white text-slate-900 shadow-none hover:bg-slate-100"
          : ""
      } ${className}`}
    >
      {children}
    </Link>
  );
}
