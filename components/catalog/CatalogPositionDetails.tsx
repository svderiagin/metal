import type {ReactNode} from "react";
import {CatalogFieldIllustration} from "./CatalogFieldIllustration";
import {CatalogStandardReference} from "./CatalogStandardReference";

export type CatalogPositionField = {label: string; value: ReactNode; roundWall?: boolean};

export function CatalogPositionFields({fields, label}: {fields: readonly CatalogPositionField[]; label?: string}) {
  const visibleFields = fields.filter(({value}) => value != null && value !== "");
  if (!visibleFields.length) return null;
  return <dl aria-label={label} className="grid grid-cols-1 gap-4 @min-[17.5rem]:grid-cols-2 @min-[51rem]:grid-cols-4">
    {visibleFields.map(({label, value, roundWall}) =>
      <div key={label} className="relative min-w-0 wrap-anywhere @max-[17.5rem]:min-h-12 @max-[17.5rem]:ps-15 @min-[32rem]:min-h-12 @min-[32rem]:ps-15">
        <dt className="text-xs text-slate-600 dark:text-slate-300">
          <CatalogFieldIllustration label={label} roundWall={roundWall}/>
          <CatalogStandardReference>{label}</CatalogStandardReference>
        </dt>
        <dd className="mt-1 text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100"><CatalogStandardReference>{value}</CatalogStandardReference></dd>
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
    {note && <div className="max-w-[68ch] break-words text-sm text-slate-600 dark:text-slate-300"><CatalogStandardReference>{note}</CatalogStandardReference></div>}
  </div>;
}
