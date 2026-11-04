"use client";

import type {ProductVariant} from "@/types/product";
import {referenceColumnWidths, referenceCategorySlugs, referenceProfileName} from "@/lib/variantCatalog";
import {ProductOrderControls} from "./ProductOrderControls";
import {CatalogImage} from "./CatalogImage";
import {CatalogDescription} from "./CatalogDescription";
import {ChannelSpecificationNote} from "./ChannelSpecificationNote";
import {ChannelProductPreview} from "./ChannelProductPreview";
import {ProductImageViewer} from "./ProductImageViewer";
import {formatUnitPrice} from "@/lib/currency";
import {formatNumber} from "@/lib/numberFormat";
import {formatAngleSpecificationValue, getAngleProductSpecifications} from "@/lib/anglePresentation";
import {getSquareProductSpecifications} from "@/lib/squarePresentation";
import {Button} from "@/components/ui/Button";
import {ResetFiltersButton} from "./ResetFiltersButton";
import tableStyles from "./RebarTable.module.css";

export function VariantCatalogResults({visible, categorySlug, resultsCount, currentPage, pages, onPageChange, onReset}: {
  visible: ProductVariant[]; categorySlug: string; resultsCount: number; currentPage: number; pages: number;
  onPageChange: (page: number) => void; onReset: () => void;
}) {
  const isChannel = categorySlug === "shveller";
  const usesReferenceTable = referenceCategorySlugs.some(slug => slug === categorySlug);
  const showAvailability = !usesReferenceTable;
  const columnWidths = usesReferenceTable ? referenceColumnWidths : [25, 27, 15, 10, 9, 14];
  return (
      <section className="min-w-0 lg:col-span-2" aria-label="Продукция">
      {isChannel && <ChannelSpecificationNote/>}
      {resultsCount ? (
        <>
          <div className="hidden overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm xl:block">
            <table className={`${tableStyles.table} ${usesReferenceTable ? "" : tableStyles.compactTable} text-center text-sm`}>
              <colgroup>{columnWidths.map((width, index) => <col key={index} style={{width: `${width}%`}}/>)}</colgroup>
              <thead className="bg-slate-900 text-white">
                <tr>
                  {usesReferenceTable ? <>
                    <th scope="col" className="px-2 py-3 font-semibold">Наименование</th>
                    <th scope="col" className="px-2 py-3 font-semibold">Изображение</th>
                  </> : <th className="p-3 text-left font-semibold">Полное обозначение</th>}
                  <th className="px-3 py-3 text-left font-semibold">Характеристики</th>
                  <th className="px-2 py-3 font-semibold">Цена</th>
                  {showAvailability && <th className="px-2 py-3 font-semibold">Наличие</th>}
                  <th className="px-2 py-3 font-semibold">{usesReferenceTable ? "Кол-во, м" : "Кол-во"}</th>
                  <th className="px-2 py-3 text-center"><span className="sr-only">Действие</span></th>
                </tr>
              </thead>
              <tbody>
                {visible.map((variant) => (
                  <tr id={`variant-${variant.id}`} key={variant.id} className="border-t border-slate-200 dark:border-slate-700 align-middle">
                    {usesReferenceTable ? <>
                      <th scope="row" className="px-2 py-4 font-semibold">{referenceProfileName(variant.name, categorySlug)}</th>
                      <td className="px-2 py-4"><ReferenceProductPreview variant={variant} compact isChannel={isChannel}/></td>
                    </> : <td className="break-words p-3 text-left"><CatalogImage src={variant.imageUrls[0]} name={variant.name} compact/><strong>{variant.name}</strong></td>}
                    <td className="break-words px-3 py-4 text-left"><VariantSpecifications variant={variant} showDetails={!usesReferenceTable}/></td>
                    <td className="break-words px-2 py-3">
                      <strong className={usesReferenceTable ? "font-semibold tabular-nums" : undefined}>{variant.quoteOnly ? "Цена по запросу" : `${variant.priceQualifier === "from" ? "от " : ""}${formatUnitPrice(variant.price, variant.priceUnit)}`}</strong>
                    </td>
                    {showAvailability && <td className="px-1.5 py-3">
                      <Availability availability={variant.availability}/>
                    </td>}
                    <ProductOrderControls variant={variant} view="table" referenceStyle={usesReferenceTable}/>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:hidden">
            {visible.map((variant) => (
              <article
                id={`variant-mobile-${variant.id}`}
                key={variant.id}
                className="min-w-0 break-words rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm"
              >
                {usesReferenceTable && <h3 className="mb-3 text-lg font-bold">{referenceProfileName(variant.name, categorySlug)}</h3>}
                {usesReferenceTable ? <ReferenceProductPreview variant={variant} isChannel={isChannel}/> : <CatalogImage src={variant.imageUrls[0]} name={variant.name}/>} 
                {!usesReferenceTable && <h3 className="mt-1 font-bold">{variant.name}</h3>}
                <div className="mt-4"><VariantSpecifications variant={variant} showDetails={!usesReferenceTable}/></div>
                <div className="mt-5 flex flex-wrap items-end justify-between gap-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                  <div>
                    <strong className="text-xl">{variant.quoteOnly ? "Цена по запросу" : `${variant.priceQualifier === "from" ? "от " : ""}${formatUnitPrice(variant.price, variant.priceUnit)}`}</strong>
                  </div>
                  {showAvailability && <Availability availability={variant.availability}/>}
                </div>
                <ProductOrderControls variant={variant} view="card"/>
              </article>
            ))}
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 p-8 text-center">
          <strong className="text-lg">Варианты не найдены</strong>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Измените или сбросьте фильтры.</p>
          <ResetFiltersButton onClick={onReset}/>
        </div>
      )}
      {pages > 1 && <nav aria-label="Страницы вариантов" className="mt-6 flex flex-wrap items-center justify-center gap-4"><Button disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)}>Назад</Button><span>Страница {currentPage} из {pages}</span><Button disabled={currentPage === pages} onClick={() => onPageChange(currentPage + 1)}>Далее</Button></nav>}
      </section>
  );
}

function Availability({availability}: {availability: ProductVariant["availability"]}) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
      availability === "UNKNOWN" ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
        : availability === "IN_STOCK" ? "bg-green-100 dark:bg-green-950/60 text-green-800 dark:text-green-300" : "bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200"
    }`}>
      {availability === "UNKNOWN" ? "Наличие уточняется" : availability === "IN_STOCK" ? "В наличии" : "Под заказ"}
    </span>
  );
}

function ReferenceProductPreview({variant, compact = false, isChannel}: {variant: ProductVariant; compact?: boolean; isChannel: boolean}) {
  if (isChannel) return <ChannelProductPreview variant={variant} compact={compact}/>;
  if (!variant.imageUrls[0]) return null;
  const description = variant.description?.split("\n\n")[0];
  return <ProductImageViewer
    src={variant.imageUrls[0]}
    name={variant.name}
    presentation={compact ? "table" : "card"}
    framed
    expanded
    caption={description ? <p>{description}</p> : undefined}
  />;
}

function VariantSpecifications({variant, showDetails = true}: {variant: ProductVariant; showDetails?: boolean}) {
  const specifications = (variant.categoryId === "rozmet-cat-kvadrat" ? getSquareProductSpecifications(variant)
    : variant.categoryId === "rozmet-cat-ugolok" ? getAngleProductSpecifications(variant) : variant.specifications)
    .filter(s => !["Полное обозначение", "Условия цены", "Условия оплаты"].includes(s.name))
    .map(s => variant.categoryId === "rozmet-cat-ugolok" ? {...s, value: formatAngleSpecificationValue(s.value)} : s);
  return <>
    <dl className="space-y-1 text-sm">{specifications.map((s, i) => <div key={`${s.name}-${i}`}><dt className="inline text-slate-500 dark:text-slate-400">{s.name}: </dt><dd className="inline">{s.value}</dd></div>)}{variant.weight && <div><dt className="inline text-slate-500 dark:text-slate-400">Теоретическая масса: </dt><dd className="inline">{formatNumber(variant.weight.value)} {variant.weight.unit}</dd></div>}</dl>
    {showDetails && variant.id.startsWith("rozmet-") && (variant.description || variant.imageUrls.length > 1) && <details className="mt-3 text-sm">
      <summary className="cursor-pointer font-semibold">Подробнее о товаре</summary>
      {variant.description && <CatalogDescription description={variant.description} className="mt-3"/>}
      {variant.imageUrls.slice(1).map(src => <CatalogImage key={src} src={src} name={variant.name} compact/>)}
    </details>}
  </>;
}

