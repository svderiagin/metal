"use client";

import Link from "next/link";
import {usePathname} from "next/navigation";
import {useEffect, useRef} from "react";

export function CatalogSubcategoryLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  const pathname = usePathname();
  const active = pathname === href;
  const linkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!active || !linkRef.current) return;

    linkRef.current.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "nearest",
    });
  }, [active]);

  return (
    <Link
      ref={linkRef}
      href={href}
      scroll={false}
      aria-current={active ? "page" : undefined}
      className={`block border-l-4 px-5 py-2 text-sm leading-5 transition-colors ${
        active
          ? "border-slate-700 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100"
          : "border-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-red-700 dark:hover:text-red-400"
      }`}
    >
      {label}
    </Link>
  );
}
