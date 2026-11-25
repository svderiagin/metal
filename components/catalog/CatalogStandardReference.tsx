import type {ReactNode} from "react";
import {catalogStandards, catalogStandardTableReference, getCatalogStandardTableHref} from "@/lib/catalogStandards";

export function CatalogStandardLink({href, children}: {href: string; children: ReactNode}) {
  return <a href={href} target="_blank" rel="noopener noreferrer"
    className="rounded-sm text-brand-700 underline underline-offset-2 hover:text-brand-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 dark:text-brand-300 dark:hover:text-brand-100 dark:focus-visible:outline-brand-300">
    {children}<span className="sr-only"> (откроется в новой вкладке)</span>
  </a>;
}

// A semicolon can introduce another standard with the same ГОСТ prefix.
const standardReferences = /ГОСТ\s+\d+(?:\.\d+)*(?:[-‐‑–—−]\d+)?(?:\s*;\s*\d+(?:\.\d+)*(?:[-‐‑–—−]\d+)?)*/u;
const standardList = new RegExp(`(${catalogStandardTableReference.source}|${standardReferences.source})`, "u");

export function CatalogStandardReference({children}: {children: ReactNode}) {
  if (typeof children !== "string" || !children.includes("ГОСТ")) return children;
  return children.split(standardList).map((part, index) => {
    if (index % 2 === 0) return part;
    if (catalogStandardTableReference.test(part)) {
      const href = getCatalogStandardTableHref(part);
      return href ? <CatalogStandardLink key={index} href={href}>{part}</CatalogStandardLink> : part;
    }
    return part.split(/(\s*;\s*)/u).map((reference, offset) => {
      if (offset % 2 === 1) return reference;
      const [number, year] = reference.replace(/^ГОСТ\s+/u, "").split(/[-‐‑–—−]/u);
      const source = catalogStandards[number];
      if (!source || (year && year !== source.year)) return reference;
      return <CatalogStandardLink key={offset} href={source.href}>
        {offset > 0 && <span className="sr-only">ГОСТ </span>}{reference}
      </CatalogStandardLink>;
    });
  });
}
