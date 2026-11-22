import type {ReactNode} from "react";
import {Icon} from "@/components/ui/Icon";

export type CatalogPositionField = {label: string; value: ReactNode};

export function CatalogPositionFields({fields}: {fields: readonly CatalogPositionField[]}) {
  return <dl className="grid grid-cols-1 gap-x-4 gap-y-2 @min-[12rem]:grid-cols-2 @min-[51rem]:grid-cols-4">
    {fields.filter(({value}) => value != null && value !== "").map(({label, value}) =>
      <div key={label} className="flex min-w-0 flex-col gap-1 break-words border-b border-slate-200 pb-2 dark:border-slate-700">
        <dt className="text-xs text-slate-600 dark:text-slate-300">{label}</dt>
        <dd className="mt-auto text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">{value}</dd>
      </div>)}
  </dl>;
}

export function CatalogPositionDetails({title = "Характеристики", fields, figures, supply}: {
  title?: string;
  fields: readonly CatalogPositionField[];
  figures?: ReactNode;
  supply?: ReactNode;
}) {
  return <div className="@container space-y-4 text-left">
    <DetailsHeading icon="ruler">{title}</DetailsHeading>
    {figures ? <div className="grid gap-4 @min-[32rem]:grid-cols-[minmax(12rem,1fr)_minmax(0,2fr)] @min-[32rem]:items-start @min-[32rem]:gap-6 @min-[51rem]:grid-cols-[16rem_minmax(0,1fr)]">
      {figures}
      <CatalogPositionFields fields={fields}/>
    </div> : <CatalogPositionFields fields={fields}/>}
    {supply && <div className="max-w-[68ch] space-y-2 text-base text-slate-700 dark:text-slate-300">
      <DetailsHeading icon="clipboard">Поставка</DetailsHeading>
      {supply}
    </div>}
  </div>;
}

function DetailsHeading({icon, children}: {icon: "ruler" | "clipboard"; children: ReactNode}) {
  return <p className="flex items-center gap-2.5 text-base font-semibold text-slate-900 dark:text-slate-100">
    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-brand-700 dark:bg-slate-800 dark:text-brand-300"><Icon name={icon}/></span>
    {children}
  </p>;
}

export function CatalogStandardLink({href, children}: {href: string; children: ReactNode}) {
  return <a href={href} target="_blank" rel="noopener noreferrer"
    className="rounded-sm text-brand-700 underline underline-offset-2 hover:text-brand-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 dark:text-brand-300 dark:hover:text-brand-100 dark:focus-visible:outline-brand-300">
    {children}<span className="sr-only"> (откроется в новой вкладке)</span>
  </a>;
}
