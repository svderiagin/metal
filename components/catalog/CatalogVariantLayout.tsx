import type {ReactNode} from "react";
import type {ProductVariant} from "@/types/product";
import {referenceColumnWidths} from "@/lib/variantCatalog";
import {getProductIllustration} from "@/lib/productPreviewImage";
import {ProductImageViewer} from "./ProductImageViewer";
import tableStyles from "./RebarTable.module.css";

type View = "table" | "card";

export function CatalogVariantTable({children, quantityHeading = "Кол-во"}: {
  children: ReactNode;
  quantityHeading?: string;
}) {
  return <div className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900 xl:block">
    <table className={`${tableStyles.table} text-center text-sm`}>
      <colgroup>{referenceColumnWidths.map((width, index) => <col key={index} style={{width: `${width}%`}}/>)}</colgroup>
      <thead className="bg-slate-900 text-white">
        <tr>
          <th scope="col">Наименование</th>
          <th scope="col">Изображение</th>
          <th scope="col" className="text-left">Характеристики</th>
          <th scope="col">Цена</th>
          <th scope="col">{quantityHeading}</th>
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
  const illustration = getProductIllustration(variant);
  const src = illustration?.imageUrl ?? variant.imageUrls[0];
  const image = preview ?? (src ? <ProductImageViewer src={src} name={variant.name}
    previewSrc={illustration?.photoUrl} presentation={view} framed expanded/> : null);

  if (view === "card") return <article id={`variant-mobile-${variant.id}`}
    className="min-w-0 break-words rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
    <h3 className="mb-3 text-lg font-bold">{name}</h3>
    {image}
    <div className="mt-4">{specifications}</div>
    <div className="mt-5 flex flex-wrap items-end justify-between gap-4 border-t border-slate-100 pt-4 dark:border-slate-800">
      <div>
        <strong className="text-xl tabular-nums">{price}</strong>
        {priceNote}
      </div>
    </div>
    {order}
  </article>;

  return <tr id={`variant-${variant.id}`} title={variant.name} className="align-middle border-t border-slate-200 dark:border-slate-700">
    <th scope="row" className="font-semibold">{name}</th>
    <td>{image ?? <span className="text-slate-500 dark:text-slate-400">—</span>}</td>
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

export function CatalogVariantOrder({view, quantity, action, total, status}: {
  view: View;
  quantity: ReactNode;
  action: ReactNode;
  total: ReactNode;
  status?: ReactNode;
}) {
  const actionGroup = <div className="min-w-0 space-y-2">
    {action}
    <p className="text-xs text-slate-600 dark:text-slate-400">Сумма: {total}</p>
    {status}
  </div>;

  return view === "table"
    ? <><td>{quantity}</td><td>{actionGroup}</td></>
    : <div className="mt-4 grid grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] items-start gap-3">
      {quantity}
      {actionGroup}
    </div>;
}
