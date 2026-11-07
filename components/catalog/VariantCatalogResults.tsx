"use client";

import type {ProductVariant} from "@/types/product";
import {referenceCategorySlugs, referenceProfileName} from "@/lib/variantCatalog";
import {ProductOrderControls} from "./ProductOrderControls";
import {CatalogImage} from "./CatalogImage";
import {CatalogDescription} from "./CatalogDescription";
import {ChannelSpecificationNote} from "./ChannelSpecificationNote";
import {ChannelProductPreview} from "./ChannelProductPreview";
import {formatUnitPrice} from "@/lib/currency";
import {formatNumber} from "@/lib/numberFormat";
import {formatAngleSpecificationValue, getAngleProductSpecifications} from "@/lib/anglePresentation";
import {getSquareProductSpecifications} from "@/lib/squarePresentation";
import {getSheetDesignation, getSheetSpecifications} from "@/lib/sheetPresentation";
import {Button} from "@/components/ui/Button";
import {ResetFiltersButton} from "./ResetFiltersButton";
import {CatalogVariantLayout, CatalogVariantTable} from "./CatalogVariantLayout";
import {hasUnverifiedSalesUnit, isDemonstrationProduct} from "@/lib/catalogOffer";

export function VariantCatalogResults({visible, categorySlug, isSheetCatalog, resultsCount, currentPage, pages, onPageChange, onReset}: {
  visible: ProductVariant[]; categorySlug: string; isSheetCatalog: boolean; resultsCount: number; currentPage: number; pages: number;
  onPageChange: (page: number) => void; onReset: () => void;
}) {
  const isChannel = categorySlug === "shveller";
  const hasMetreQuantities = referenceCategorySlugs.some(slug => slug === categorySlug);
  const showSupplierDetails = !hasMetreQuantities && !isSheetCatalog;
  const displayName = (variant: ProductVariant) => isSheetCatalog ? getSheetDesignation(variant) : referenceProfileName(variant.name, categorySlug);
  function renderVariant(variant: ProductVariant, view: "table" | "card") {
    const price = variant.quoteOnly ? "Цена по запросу" : `${variant.priceQualifier === "from" ? "от " : ""}${formatUnitPrice(variant.price, variant.priceUnit)}`;
    return <CatalogVariantLayout key={variant.id} variant={variant} view={view} name={displayName(variant)}
      preview={isChannel ? <ChannelProductPreview variant={variant} compact={view === "table"}/> : undefined}
      specifications={<VariantSpecifications variant={variant} showDetails={showSupplierDetails}/>}
      price={price}
      priceNote={showSupplierDetails
        ? <div className="mt-2"><Availability availability={variant.availability}/></div> : undefined}
      order={<ProductOrderControls variant={variant} view={view}
        showUnit={view === "card" || !hasMetreQuantities}/>}/>;
  }
  return (
      <section className="min-w-0 lg:col-span-2" aria-label="Продукция">
      {isChannel && <ChannelSpecificationNote/>}
      {resultsCount ? (
        <>
          <CatalogVariantTable quantityHeading={hasMetreQuantities ? "Кол-во, м" : undefined}>
            {visible.map(variant => renderVariant(variant, "table"))}
          </CatalogVariantTable>
          <div className="grid gap-4 sm:grid-cols-2 xl:hidden">
            {visible.map(variant => renderVariant(variant, "card"))}
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

function VariantSpecifications({variant, showDetails = true}: {variant: ProductVariant; showDetails?: boolean}) {
  if (isDemonstrationProduct(variant)) return <p className="text-sm text-slate-600 dark:text-slate-400">Характеристики и наличие требуют подтверждения перед заказом.</p>;
  const specifications = (variant.categoryId === "rozmet-cat-kvadrat" ? getSquareProductSpecifications(variant)
    : variant.categoryId === "rozmet-cat-ugolok" ? getAngleProductSpecifications(variant) : getSheetSpecifications(variant))
    .filter(s => !["Полное обозначение", "Условия цены", "Условия оплаты"].includes(s.name))
    .map(s => variant.categoryId === "rozmet-cat-ugolok" ? {...s, value: formatAngleSpecificationValue(s.value)} : s);
  return <>
    {hasUnverifiedSalesUnit(variant) && <p className="mb-3 text-sm text-slate-600 dark:text-slate-400">Единица продажи и цена уточняются. Укажите нужное количество в запросе.</p>}
    <dl className="space-y-1.5 text-sm">{specifications.map((s, i) => <div key={`${s.name}-${i}`}><dt className="inline text-slate-600 dark:text-slate-400">{s.name}: </dt><dd className="inline font-medium tabular-nums">{s.value}</dd></div>)}{variant.weight && <div><dt className="inline text-slate-600 dark:text-slate-400">Теоретическая масса: </dt><dd className="inline font-medium tabular-nums">{formatNumber(variant.weight.value)} {variant.weight.unit}</dd></div>}</dl>
    {showDetails && variant.id.startsWith("rozmet-") && (variant.description || variant.imageUrls.length > 1) && <details className="mt-3 text-sm">
      <summary className="cursor-pointer font-semibold">Подробнее о товаре</summary>
      {variant.description && <CatalogDescription description={variant.description} className="mt-3"/>}
      {variant.imageUrls.slice(1).map(src => <CatalogImage key={src} src={src} name={variant.name} compact/>)}
    </details>}
  </>;
}

