"use client";

import Link from "next/link";
import {useEffect, useRef} from "react";

export function CatalogCategoryLink({
  href,
  label,
  productCount,
  active,
}: {
  href: string;
  label: string;
  productCount: number;
  active: boolean;
}) {
  const linkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!active || !linkRef.current) return;

    linkRef.current.focus({preventScroll: true});
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
      className={`block min-h-12 px-5 py-3.5 text-base font-semibold transition-colors hover:bg-slate-50 hover:text-red-700 ${
        active ? "border-l-4 border-slate-700 bg-slate-300 pl-4 text-slate-950" : ""
      }`}
    >
      {label}
      <span className="ml-2 text-xs text-slate-400">{productCount}</span>
    </Link>
  );
}
