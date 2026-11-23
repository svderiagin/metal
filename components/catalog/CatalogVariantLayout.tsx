import {Fragment, useState, type ReactNode} from "react";
import type {ProductVariant} from "@/types/product";
import {Icon} from "@/components/ui/Icon";
import {BACKORDER_DELIVERY_ESTIMATE} from "@/lib/catalogOffer";
import {DetailsSummary} from "@/components/ui/DetailsSummary";
import {ProductImageViewer} from "./ProductImageViewer";
import {CatalogStandardReference} from "./CatalogStandardReference";
import tableStyles from "./RebarTable.module.css";

type View = "table" | "card";

// Designation, photo, two specifications, price, two order units, total, action.
const columnWidths = [11, 13, 9, 9, 11.25, 11.25, 10, 12.5, 13] as const;

export function CatalogVariantTable({children, designation, specifications, unit,
  quantity = unit ? `Заказ, ${unit}` : "Заказ", secondaryQuantity}: {
  children: ReactNode;
  designation: string;
  specifications: readonly ReactNode[];
  unit?: string;
  quantity?: string;
  secondaryQuantity?: string;
}) {
  return <div className={`${tableStyles.frame} hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900 xl:block`}>
    <table className={`${tableStyles.table} text-center text-sm`}>
      <colgroup>{columnWidths.map((width, index) => <col key={index} style={{width: `${width}%`}}/>)}</colgroup>
      <thead className="bg-slate-900 text-white">
        <tr>
          <th scope="col">{designation}</th>
          <th scope="col">Фото</th>
          {specifications.map((label, index) => <th scope="col" key={index} colSpan={specifications.length === 1 ? 2 : undefined}>{label}</th>)}
          <th scope="col">{unit ? `Цена, ₽/${unit}` : "Цена"}</th>
          <th scope="col" colSpan={secondaryQuantity ? undefined : 2}>{quantity}</th>
          {secondaryQuantity && <th scope="col">{secondaryQuantity}</th>}
          <th scope="col">Сумма</th>
          <th scope="col"><span className="sr-only">Действие</span></th>
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  </div>;
}

function renderVariantPhoto(variant: ProductVariant, view: View) {
  const src = variant.imageUrls[0];
  return src ? <ProductImageViewer src={src} name={variant.name} presentation={view} framed expanded/> : null;
}

export function CatalogVariantLayout({view, variant, name = variant.name, tableSubtitle, preview,
  specifications, tableSpecifications, details, detailsId = `variant-details-${variant.id}`, price, priceNote, order}: {
  view: View;
  variant: ProductVariant;
  name?: string;
  tableSubtitle?: string;
  preview?: ReactNode;
  specifications: ReactNode;
  tableSpecifications: readonly ReactNode[];
  details?: ReactNode;
  detailsId?: string;
  price: ReactNode;
  priceNote?: ReactNode;
  order: ReactNode;
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const image = preview ?? renderVariantPhoto(variant, view);
  const cardDetails = details && <details className={`${tableStyles.detailsDisclosure} mt-3 border-t border-slate-200 text-sm dark:border-slate-700`}>
    <DetailsSummary className="font-semibold text-slate-600 focus-visible:outline-2 focus-visible:outline-brand-700 dark:text-slate-300 dark:focus-visible:outline-brand-300">
      Подробнее
    </DetailsSummary>
    <div className="pt-2">{details}</div>
  </details>;

  if (view === "card") return <article id={`variant-mobile-${variant.id}`}
    className={`${tableStyles.card} min-w-0 break-words rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900`}>
    <h3 className="text-card-title">{name.split(/(×)/u).map((part, index) => <Fragment key={index}><CatalogStandardReference>{part}</CatalogStandardReference>{part === "×" && <wbr/>}</Fragment>)}</h3>
    <div className={`mt-3 ${image ? tableStyles.cardDetails : ""}`}>
      {image && <div className={tableStyles.cardImage}>{image}</div>}
      <div className="min-w-0">{specifications}</div>
    </div>
    {cardDetails}
    <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800">
      <dl>
        <dt className="sr-only">Цена</dt>
        <dd className="text-xl font-bold tabular-nums">{price}</dd>
      </dl>
      {priceNote}
    </div>
    {order}
  </article>;

  const nameId = `variant-name-${variant.id}`;
  return <><tr id={`variant-${variant.id}`} title={variant.name} className="align-middle">
    <th scope="row" aria-labelledby={nameId} className="font-semibold tabular-nums">
      <span id={nameId} className="block">
        {name}{tableSubtitle && <>{" "}<span className="mt-1 block text-xs font-medium text-slate-600 dark:text-slate-300">{tableSubtitle}</span></>}
      </span>
      {details && <button type="button" aria-expanded={detailsOpen} aria-controls={detailsId}
        aria-label={`Подробности: ${variant.name}`} onClick={() => setDetailsOpen(!detailsOpen)}
        className={`${tableStyles.detailsButton} mt-2 cursor-pointer rounded-sm text-xs font-semibold whitespace-nowrap text-slate-600 underline decoration-slate-300 underline-offset-4 focus-visible:outline-2 focus-visible:outline-brand-700 dark:text-slate-300 dark:decoration-slate-500 dark:focus-visible:outline-brand-300`}>
        <span>Подробнее</span><Icon name="chevron-down" className={detailsOpen ? "rotate-180" : ""}/>
      </button>}
    </th>
    <td>{image ? <div className={tableStyles.rowImage}>{image}</div> : <span aria-hidden="true" className="text-slate-500 dark:text-slate-400">—</span>}</td>
    {tableSpecifications.map((value, index) => <td key={index} colSpan={tableSpecifications.length === 1 ? 2 : undefined}
      className="tabular-nums"><CatalogStandardReference>{value}</CatalogStandardReference></td>)}
    <td className="break-words">
      <strong className="font-semibold tabular-nums">{price}</strong>
      {priceNote}
    </td>
    {order}
  </tr>
  {details && <tr id={detailsId} hidden={!detailsOpen} className={tableStyles.detailsRow}>
    <td colSpan={columnWidths.length} className="p-5">{detailsOpen && details}</td>
  </tr>}</>;
}

export function CatalogVariantSpecifications({items}: {items: readonly {label: string; value: ReactNode}[]}) {
  return <dl className="space-y-1.5 text-sm">
    {items.filter(({value}) => value != null && value !== "").map(({label, value}) => <div key={label}>
      <dt className="inline text-slate-600 dark:text-slate-400"><CatalogStandardReference>{label}</CatalogStandardReference>: </dt>
      <dd className="inline font-medium tabular-nums"><CatalogStandardReference>{value}</CatalogStandardReference></dd>
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

export function CatalogVariantOrder({view, quantity, secondaryQuantity, action, total, status, deliveryId}: {
  view: View;
  quantity: ReactNode;
  secondaryQuantity?: ReactNode;
  action: ReactNode;
  total: ReactNode;
  status?: ReactNode;
  deliveryId?: string;
}) {
  const delivery = deliveryId && <p id={deliveryId} className="mt-1.5 text-[0.875rem] leading-[1.35] text-slate-600 dark:text-slate-300">
    Доставка <strong className="whitespace-nowrap font-semibold">{BACKORDER_DELIVERY_ESTIMATE}</strong>
  </p>;
  return view === "table"
    ? <>
      <td colSpan={secondaryQuantity ? undefined : 2} className={tableStyles.quantityCell}>{quantity}</td>
      {secondaryQuantity && <td className={tableStyles.quantityCell}>{secondaryQuantity}</td>}
      <td className={tableStyles.sumColumn}>{total}</td>
      <td className="text-center">{action}{status}{delivery}</td>
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
      {delivery}
    </>;
}
