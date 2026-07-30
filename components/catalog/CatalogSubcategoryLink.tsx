"use client";

import Link from "next/link";
import {useSearchParams} from "next/navigation";

export function CatalogSubcategoryLink({
  href,
  slug,
  label,
}: {
  href: string;
  slug: string;
  label: string;
}) {
  const searchParams = useSearchParams();
  const active = searchParams.get("subcategory") === slug;

  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "page" : undefined}
      className={`block border-l-4 px-5 py-2 text-sm leading-5 transition-colors ${
        active
          ? "border-slate-700 bg-slate-200 text-slate-900"
          : "border-transparent text-slate-600 hover:bg-slate-100 hover:text-red-700"
      }`}
    >
      {label}
    </Link>
  );
}
