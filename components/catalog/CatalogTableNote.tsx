import type {ReactNode} from "react";
import {Icon} from "@/components/ui/Icon";

export function CatalogTableNote({children}: {children: ReactNode}) {
  return <p className="mb-3 flex items-start gap-2.5 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2.5 text-sm text-slate-700 sm:px-4 dark:border-brand-800 dark:bg-brand-950 dark:text-slate-200">
    <Icon name="info" className="mt-1 shrink-0 text-brand-700 dark:text-brand-300"/>
    <span className="min-w-0 text-pretty">{children}</span>
  </p>;
}
