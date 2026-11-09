import {Fragment, type ReactNode} from "react";
import type {ProductVariant} from "@/types/product";
import {getProductIllustration} from "@/lib/productPreviewImage";
import {isDemonstrationProduct} from "@/lib/catalogOffer";
import {ProductImageViewer} from "./ProductImageViewer";
import tableStyles from "./RebarTable.module.css";

type View = "table" | "card";

const quantityColumnWidths = [11, 20, 21, 11, 10, 12, 15];
const measuredColumnWidths = [12, 15, 20, 10, 8, 8, 12, 15];

export function CatalogVariantTable({children, quantityHeading = "Кол-во", measured = false}: {
  children: ReactNode;
  quantityHeading?: string;
  measured?: boolean;
}) {
  const columnWidths = measured ? measuredColumnWidths : quantityColumnWidths;
  return <div className={`${tableStyles.frame} hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900 xl:block`}>
    <table className={`${tableStyles.table} text-center text-sm`}>
      <colgroup>{columnWidths.map((width, index) => <col key={index} style={{width: `${width}%`}}/>)}</colgroup>
      <thead className="bg-slate-900 text-white">
        <tr>
          <th scope="col">Наименование</th>
          <th scope="col">Изображение</th>
          <th scope="col" className="text-left">Характеристики</th>
          <th scope="col">Цена</th>
          {measured ? <>
            <th scope="col">Заказ, м</th>
            <th scope="col">Заказ, т</th>
          </> : <th scope="col">{quantityHeading}</th>}
          <th scope="col" className={tableStyles.sumColumn}>Сумма</th>
          <th scope="col"><span className="sr-only">Действие</span></th>
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  </div>;
}

export function CatalogVariantLayout({view, variant, name = variant.name, preview, specifications, price, priceNote, order}: {
  view: View;
  variant: ProductVariant;
  name?: string;
  preview?: ReactNode;
  specifications: ReactNode;
  price: ReactNode;
  priceNote?: ReactNode;
  order: ReactNode;
}) {
  const illustration = isDemonstrationProduct(variant) ? undefined : getProductIllustration(variant);
  const src = illustration?.imageUrl ?? variant.imageUrls[0];
  const image = preview ?? (src ? <ProductImageViewer src={src} name={variant.name}
    presentation={view} framed expanded/> : null);

  if (view === "card") return <article id={`variant-mobile-${variant.id}`}
    className={`${tableStyles.card} min-w-0 break-words rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900`}>
    <h3 className="text-card-title">{name.split(/(×)/u).map((part, index) => <Fragment key={index}>{part}{part === "×" && <wbr/>}</Fragment>)}</h3>
    <div className={`mt-3 ${image ? tableStyles.cardDetails : ""}`}>
      {image && <div className={tableStyles.cardImage}>{image}</div>}
      <div className="min-w-0">{specifications}</div>
    </div>
    <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-slate-100 pt-3 dark:border-slate-800">
      <div>
        <strong className="text-xl tabular-nums">{price}</strong>
        {priceNote}
      </div>
    </div>
    {order}
  </article>;

  return <tr id={`variant-${variant.id}`} title={variant.name} className="align-middle border-t border-slate-200 dark:border-slate-700">
    <th scope="row" className="font-semibold">{name}</th>
    <td>{image ? <div className={tableStyles.rowImage}>{image}</div> : <span className="text-slate-500 dark:text-slate-400">—</span>}</td>
    <td className="break-words text-left">{specifications}</td>
    <td className="break-words">
      <strong className="font-semibold tabular-nums">{price}</strong>
      {priceNote}
    </td>
    {order}
  </tr>;
}

export function CatalogVariantSpecifications({items}: {items: readonly {label: string; value: ReactNode}[]}) {
  return <dl className="space-y-1.5 text-sm">
    {items.map(({label, value}) => <div key={label}>
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
      <td>{quantity}</td>
      {secondaryQuantity && <td>{secondaryQuantity}</td>}
      <td className={tableStyles.sumColumn}>{total}</td>
      <td className="text-center">{action}{status}</td>
    </>
    : <>
      <div className={`mt-4 grid gap-3 border-t border-slate-100 pt-4 dark:border-slate-800 ${secondaryQuantity ? "grid-cols-2" : ""}`}>
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
