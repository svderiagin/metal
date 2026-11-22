import {Fragment, useState, type ReactNode} from "react";
import type {ProductVariant} from "@/types/product";
import {getProductIllustration} from "@/lib/productPreviewImage";
import {isDemonstrationProduct} from "@/lib/catalogOffer";
import {Icon} from "@/components/ui/Icon";
import {DetailsSummary} from "@/components/ui/DetailsSummary";
import {ProductImageViewer} from "./ProductImageViewer";
import tableStyles from "./RebarTable.module.css";

type View = "table" | "card";
export type CatalogColumn = {label: string; width: number | readonly [number, number]; unit?: string; className?: string; visuallyHidden?: boolean};
const trackCount = 9;

export function singleQuantityColumns(
  designation: string, firstSpecification: string, secondSpecification: string, quantityLabel = "Количество",
): CatalogColumn[] {
  return [
    {label: designation, width: 14},
    {label: "Фото", width: 13},
    {label: firstSpecification, width: 10},
    {label: secondSpecification, width: 12},
    {label: "Цена", width: 11},
    {label: quantityLabel, width: [5, 6]},
    {label: "Сумма", width: 14, className: tableStyles.sumColumn},
    {label: "Действие", width: 15, visuallyHidden: true},
  ];
}

export function CatalogVariantTable({children, columns}: {
  children: ReactNode;
  columns: readonly CatalogColumn[];
}) {
  const columnWidths = columns.flatMap(({width}) => width);
  return <div className={`${tableStyles.frame} hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900 xl:block`}>
    <table className={`${tableStyles.table} text-center text-sm`}>
      <colgroup>{columnWidths.map((width, index) => <col key={index} style={{width: `${width}%`}}/>)}</colgroup>
      <thead className="bg-slate-900 text-white">
        <tr>{columns.map(({label, width, unit, className, visuallyHidden}) => <th key={label} scope="col"
          colSpan={typeof width === "number" ? undefined : width.length} className={className}>
          {visuallyHidden ? <span className="sr-only">{label}</span> : label}
          {unit && <> <span className="whitespace-nowrap">{unit}</span></>}
        </th>)}</tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  </div>;
}

export function CatalogVariantLayout({view, variant, name = variant.name, preview,
  specifications, tableSpecifications, details, detailsId = `variant-details-${variant.id}`, price, priceNote, order}: {
  view: View;
  variant: ProductVariant;
  name?: string;
  preview?: ReactNode;
  specifications: ReactNode;
  tableSpecifications: {headingClassName?: string; cells: ReactNode};
  details?: ReactNode;
  detailsId?: string;
  price: ReactNode;
  priceNote?: ReactNode;
  order: ReactNode;
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const illustration = getProductIllustration(variant);
  const src = illustration && (!isDemonstrationProduct(variant) || illustration.showForDemo)
    ? illustration.imageUrl : variant.imageUrls[0];
  const image = preview ?? (src ? <ProductImageViewer src={src} name={variant.name}
    presentation={view} framed expanded/> : null);

  if (view === "card") return <article id={`variant-mobile-${variant.id}`}
    className={`${tableStyles.card} min-w-0 break-words rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900`}>
    <h3 className="text-card-title">{name.split(/(×)/u).map((part, index) => <Fragment key={index}>{part}{part === "×" && <wbr/>}</Fragment>)}</h3>
    <div className={`mt-3 ${image ? tableStyles.cardDetails : ""}`}>
      {image && <div className={tableStyles.cardImage}>{image}</div>}
      <div className="min-w-0">{specifications}</div>
    </div>
    {details && <details className={`${tableStyles.detailsDisclosure} mt-3 border-t border-slate-200 text-sm dark:border-slate-700`}>
      <DetailsSummary className="font-semibold text-slate-600 focus-visible:outline-2 focus-visible:outline-brand-700 dark:text-slate-300 dark:focus-visible:outline-brand-300">
        Подробнее
      </DetailsSummary>
      <div className="pt-2">{details}</div>
    </details>}
    <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-slate-100 pt-3 dark:border-slate-800">
      <div>
        <strong className="text-xl tabular-nums">{price}</strong>
        {priceNote}
      </div>
    </div>
    {order}
  </article>;

  const nameId = `variant-name-${variant.id}`;
  return <><tr id={`variant-${variant.id}`} title={variant.name} className="align-middle">
    <th scope="row" aria-labelledby={nameId} className={`font-semibold tabular-nums ${tableSpecifications.headingClassName ?? ""}`}>
      <span id={nameId} className="block">{name}</span>
      {details && <button type="button" aria-expanded={detailsOpen} aria-controls={detailsId}
        aria-label={`Подробности: ${variant.name}`} onClick={() => setDetailsOpen(!detailsOpen)}
        className={`${tableStyles.detailsButton} mt-2 cursor-pointer rounded-sm text-xs font-semibold whitespace-nowrap text-slate-600 underline decoration-slate-300 underline-offset-4 focus-visible:outline-2 focus-visible:outline-brand-700 dark:text-slate-300 dark:decoration-slate-500 dark:focus-visible:outline-brand-300`}>
        <span>Подробнее</span><Icon name="chevron-down" className={detailsOpen ? "rotate-180" : ""}/>
      </button>}
    </th>
    <td>{image ? <div className={tableStyles.rowImage}>{image}</div> : <span aria-hidden="true" className="text-slate-500 dark:text-slate-400">—</span>}</td>
    {tableSpecifications.cells}
    <td className="break-words">
      <strong className="font-semibold tabular-nums">{price}</strong>
      {priceNote}
    </td>
    {order}
  </tr>
  {details && <tr id={detailsId} hidden={!detailsOpen} className={tableStyles.detailsRow}>
    <td colSpan={trackCount} className="p-5">{detailsOpen && details}</td>
  </tr>}</>;
}

export function CatalogVariantSpecifications({items}: {items: readonly {label: string; value: ReactNode}[]}) {
  return <dl className="space-y-1.5 text-sm">
    {items.filter(({value}) => value != null && value !== "").map(({label, value}) => <div key={label}>
      <dt className="inline text-slate-600 dark:text-slate-400">{label}: </dt>
      <dd className="inline font-medium tabular-nums">{value}</dd>
    </div>)}
  </dl>;
}

export function CatalogVariantQuantity({unit, children}: {unit: string; children: ReactNode}) {
  return <span className="relative block min-w-0">
    {children}
    <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs text-slate-600 dark:text-slate-400">
      {unit}
    </span>
  </span>;
}

export function CatalogVariantOrder({view, quantity, secondaryQuantity, action, total, status}: {
  view: View;
  quantity: ReactNode;
  secondaryQuantity?: ReactNode;
  action: ReactNode;
  total: ReactNode;
  status?: ReactNode;
}) {
  return view === "table"
    ? <>
      <td colSpan={secondaryQuantity ? undefined : 2} className={tableStyles.quantityCell}>{quantity}</td>
      {secondaryQuantity && <td className={tableStyles.quantityCell}>{secondaryQuantity}</td>}
      <td className={tableStyles.sumColumn}>{total}</td>
      <td className="text-center">{action}{status}</td>
    </>
    : <>
      <div className={`mt-4 grid gap-3 border-t border-slate-100 pt-4 dark:border-slate-800 ${secondaryQuantity ? tableStyles.measurementFields : ""}`}>
        {quantity}
        {secondaryQuantity}
      </div>
      <p className="mt-4 flex items-baseline justify-between gap-3 text-sm text-slate-900 dark:text-slate-100">
        <span>Сумма:</span>
        {total}
      </p>
      <div className="mt-4">{action}</div>
      {status}
    </>;
}
