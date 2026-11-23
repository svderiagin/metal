import type {ReactNode} from "react";
import {catalogStandards} from "@/lib/catalogStandards";

export function CatalogStandardLink({href, children, title}: {href: string; children: ReactNode; title?: string}) {
  return <a href={href} target="_blank" rel="noopener noreferrer" title={title}
    className="rounded-sm text-brand-700 underline underline-offset-2 hover:text-brand-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 dark:text-brand-300 dark:hover:text-brand-100 dark:focus-visible:outline-brand-300">
    {children}<span className="sr-only"> (откроется в новой вкладке)</span>
  </a>;
}

// A semicolon can introduce another standard with the same ГОСТ prefix.
const standardList = /(ГОСТ\s+\d+(?:\.\d+)*(?:[-‐‑–—−]\d+)?(?:\s*;\s*\d+(?:\.\d+)*(?:[-‐‑–—−]\d+)?)*)/u;

export function CatalogStandardReference({children}: {children: ReactNode}) {
  if (typeof children !== "string" || !children.includes("ГОСТ")) return children;
  return children.split(standardList).map((part, index) => {
    if (index % 2 === 0) return part;
    return part.split(/(\s*;\s*)/u).map((reference, offset) => {
      if (offset % 2 === 1) return reference;
      const [number, year] = reference.replace(/^ГОСТ\s+/u, "").split(/[-‐‑–—−]/u);
      const source = catalogStandards[number];
      if (!source || (year && year !== source.year)) return reference;
      const title = year ? undefined : `Справочно: ГОСТ ${number}-${source.year}. В каталоге указан только номер.`;
      return <CatalogStandardLink key={offset} href={source.href} title={title}>
        {offset > 0 && <span className="sr-only">ГОСТ </span>}{reference}
      </CatalogStandardLink>;
    });
  });
}
