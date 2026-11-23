import type {ReactNode} from "react";
import {CatalogFieldIllustration} from "./CatalogFieldIllustration";

export type CatalogPositionField = {label: string; value: ReactNode; roundWall?: boolean};

export function CatalogPositionFields({fields, label}: {fields: readonly CatalogPositionField[]; label?: string}) {
  const visibleFields = fields.filter(({value}) => value != null && value !== "");
  if (!visibleFields.length) return null;
  return <dl aria-label={label} className="grid grid-cols-1 gap-4 @min-[12rem]:grid-cols-2 @min-[51rem]:grid-cols-4">
    {visibleFields.map(({label, value, roundWall}) =>
      <div key={label} className="relative row-span-2 grid min-w-0 grid-rows-subgrid gap-y-1 break-words @min-[32rem]:min-h-12 @min-[32rem]:ps-15">
        <dt className="text-xs text-slate-600 dark:text-slate-300">
          <CatalogFieldIllustration label={label} roundWall={roundWall}/>
          {label}
        </dt>
        <dd className="text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">{value}</dd>
      </div>)}
  </dl>;
}

export function CatalogPositionDetails({productName, fields, note}: {
  productName: string;
  fields: readonly CatalogPositionField[];
  note?: ReactNode;
}) {
  return <div className="@container space-y-4 text-left">
    <CatalogPositionFields fields={fields} label={`Характеристики товара «${productName}»`}/>
    {note && <div className="max-w-[68ch] break-words text-sm text-slate-600 dark:text-slate-300">{note}</div>}
  </div>;
}

export function CatalogStandardLink({href, children}: {href: string; children: ReactNode}) {
  return <a href={href} target="_blank" rel="noopener noreferrer"
    className="rounded-sm text-brand-700 underline underline-offset-2 hover:text-brand-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 dark:text-brand-300 dark:hover:text-brand-100 dark:focus-visible:outline-brand-300">
    {children}<span className="sr-only"> (откроется в новой вкладке)</span>
  </a>;
}
