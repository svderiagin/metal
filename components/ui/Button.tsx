import Link from "next/link";
import type {ButtonHTMLAttributes, MouseEventHandler, ReactNode} from "react";

const styles = [
  "inline-flex min-h-11 cursor-pointer items-center justify-center rounded-lg border px-5 py-2.5",
  "text-center text-sm font-semibold",
  "transition-colors",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600 dark:focus-visible:outline-brand-300",
  "disabled:pointer-events-none disabled:opacity-50",
].join(" ");

const variants = {
  primary: "action-primary",
  secondary: "border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-none hover:bg-slate-100 dark:hover:bg-slate-800",
};
type ButtonVariant = keyof typeof variants;

export function Button({className = "", variant = "primary", ...props}: ButtonHTMLAttributes<HTMLButtonElement> & {variant?: ButtonVariant}) {
  return <button className={`${styles} ${variants[variant]} ${className}`} {...props} />;
}

export function ButtonLink({href, children, variant = "primary", className = "", onClick}: {
  href: string;
  children: ReactNode;
  variant?: ButtonVariant;
  className?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`${styles} ${variants[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}
