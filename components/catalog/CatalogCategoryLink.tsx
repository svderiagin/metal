"use client";

import Link from "next/link";
import {usePathname} from "next/navigation";
import {useEffect, useRef} from "react";

export function CatalogCategoryLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  const pathname = usePathname();
  const linkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!active || pathname !== href || !linkRef.current) return;

    linkRef.current.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "nearest",
    });
  }, [active, href, pathname]);

  return (
    <Link
      ref={linkRef}
      href={href}
      scroll={false}
      aria-current={active ? "page" : undefined}
      className={`block min-h-12 px-5 py-3 text-sm font-semibold transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-brand-700 dark:hover:text-brand-400 ${
        active ? "border-l-4 border-brand-700 bg-brand-50 dark:border-brand-300 dark:bg-brand-900/50 pl-4 text-slate-950 dark:text-slate-100" : ""
      }`}
    >
      {label}
    </Link>
  );
}
