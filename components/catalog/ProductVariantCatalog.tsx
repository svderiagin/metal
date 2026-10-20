"use client";

import {QuoteRequestProvider} from "@/components/forms/QuoteRequestContext";
import {RequestQuoteSection} from "@/components/home/RequestQuoteSection";

import {FilterPanel} from "./FilterPanel";
import {PriceInput} from "./PriceInput";

import {createCatalogSearchIndex} from "@/lib/search";
import {useDeferredValue, useMemo, useState} from "react";
import {useLinkedVariant} from "@/hooks/useLinkedVariant";
import {comparePrices} from "@/lib/catalogFilters";
import {ProductOrderControls} from "./ProductOrderControls";
import {CatalogImage} from "./CatalogImage";
import {formatUnitPrice} from "@/lib/currency";
import {formatNumber} from "@/lib/numberFormat";
import {
  getVariantAttribute,
  getVariantFilterKeys,
} from "@/lib/variantPresentation";
import {Button} from "@/components/ui/Button";
import {Select} from "@/components/ui/Select";
import {ResetFiltersButton} from "@/components/catalog/ResetFiltersButton";
import type {ProductAttributeKey, ProductVariant} from "@/types/product";
import {
  BeamVariantCatalog,
  isMeasuredRebarVariant,
  RebarVariantCatalog,
  VgpVariantCatalog,
  ProfilePipeVariantCatalog,
} from "@/components/catalog/RebarVariantCatalog";
import {isVgpVariant} from "@/lib/vgp";
import {isProfilePipeVariant} from "@/lib/profilePipe";
import {isProfileSheetVariant} from "@/lib/profileSheet";
import {ProfileSheetVariantCatalog} from "./ProfileSheetVariantCatalog";
import {isMetalMeshVariant} from "@/lib/metalMesh";
import {MetalMeshVariantCatalog} from "./MetalMeshVariantCatalog";
import {CatalogDescription} from "./CatalogDescription";
import tableStyles from "./RebarTable.module.css";
import {ChannelSpecificationNote} from "./ChannelSpecificationNote";
import {ChannelProductPreview} from "./ChannelProductPreview";

type SortMode = "relevance" | "availability" | "price-asc" | "price-desc" | "size" | "name";

// Ширина колонок таблицы «Швеллер» в процентах. Сумма должна оставаться равной 100.
const channelColumnWidths = [
  9,  // Наименование
  26, // Изображение
  28, // Характеристики
  13, // Цена
  11, // Кол-во, м
  13, // В корзину
] as const;

export function ProductVariantCatalog(props: {variants: ProductVariant[]; categorySlug: string}) {
  return <QuoteRequestProvider>
    <VariantCatalogContent {...props}/>
    <div className="min-w-0 lg:col-span-2"><RequestQuoteSection/></div>
  </QuoteRequestProvider>;
}

function VariantCatalogContent({
  variants,
  categorySlug,
}: {
  variants: ProductVariant[];
  categorySlug: string;
}) {
  if (variants.length > 0 && variants.every(isProfileSheetVariant)) {
    return <ProfileSheetVariantCatalog variants={variants}/>;
  }
  if (variants.length > 0 && variants.every(isMetalMeshVariant)) {
    return <MetalMeshVariantCatalog variants={variants}/>;
  }
  if (categorySlug === "truby-profilnye") {
    const structured = variants.filter(isProfilePipeVariant);
    const legacy = variants.filter(variant => !isProfilePipeVariant(variant));
    return <>
      {structured.length > 0 && <ProfilePipeVariantCatalog variants={structured}/>}
      {legacy.length > 0 && <LegacyProfilePipeCatalog variants={legacy} categorySlug={categorySlug}/>}
    </>;
  }
  if (categorySlug === "balka") return <BeamVariantCatalog variants={variants}/>;
  if (variants.length > 0 && variants.every(isVgpVariant)) return <VgpVariantCatalog variants={variants}/>;
  const isA500c = categorySlug === "armatura" && variants.every(v => v.subcategoryId === "cat-arm-sub-1");
  if (categorySlug === "armatura" && variants.every(isMeasuredRebarVariant)) {
    return <RebarVariantCatalog variants={variants}/>;
  }
  const measured = variants.filter(v => !v.imported).filter(isMeasuredRebarVariant);
  if (measured.length > 0) {
    if (isA500c) return <RebarVariantCatalog variants={measured}/>;
    const other = variants.filter(v => !measured.some(m => m.id === v.id));
    return <>{other.length > 0 && <GenericProductVariantCatalog variants={other} categorySlug={categorySlug}/>}<RebarVariantCatalog variants={measured}/></>;
  }

  return <GenericProductVariantCatalog variants={variants} categorySlug={categorySlug}/>;
}

function LegacyProfilePipeCatalog({variants, categorySlug}: {variants: ProductVariant[]; categorySlug: string}) {
  const [open, setOpen] = useState(false);
  useLinkedVariant(variants, () => setOpen(true));
  return <div className="min-w-0 lg:col-span-2">
    <details open={open} onToggle={event => setOpen(event.currentTarget.open)} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5">
      <summary className="cursor-pointer font-semibold">Другие позиции — параметры уточняются</summary>
      <GenericProductVariantCatalog variants={variants} categorySlug={categorySlug}/>
    </details>
  </div>;
}

function GenericProductVariantCatalog({
  variants,
  categorySlug,
}: {
  variants: ProductVariant[];
  categorySlug: string;
}) {
  const filterKeys = getVariantFilterKeys(categorySlug);
  const isChannel = categorySlug === "shveller";
  const showAvailability = !isChannel;
  const columnWidths = showAvailability ? [25, 27, 15, 10, 9, 14] : channelColumnWidths;
  const [filters, setFilters] = useState<Partial<Record<ProductAttributeKey, string>>>({});
  const [stockOnly, setStockOnly] = useState(false);
  const [minimumPrice, setMinimumPrice] = useState("");
  const [maximumPrice, setMaximumPrice] = useState("");
  const [sort, setSort] = useState<SortMode>("name");
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const index = useMemo(() => createCatalogSearchIndex(variants), [variants]);
  const search = useMemo(() => index.search(deferredQuery), [index, deferredQuery]);
  useLinkedVariant(variants, variant => {reset(); setQuery(variant.name);});

  const filterOptions = useMemo(
    () => new Map(
      filterKeys.map((key) => [
        key,
        uniqueAttributeValues(variants, key),
      ]),
    ),
    [filterKeys, variants],
  );

  const results = useMemo(() => {
    const minimum = minimumPrice === "" ? null : Number(minimumPrice);
    const maximum = maximumPrice === "" ? null : Number(maximumPrice);

    const filtered = (deferredQuery.trim() ? search.hits.map(h => h.product) : variants).filter((variant) => {
      const attributesMatch = filterKeys.every((key) =>
        !filters[key] || getVariantAttribute(variant, key) === filters[key],
      );

      return attributesMatch
        && (!stockOnly || variant.inStock)
        && (minimum === null || (variant.price !== null && variant.price >= minimum))
        && (maximum === null || (variant.price !== null && variant.price <= maximum));
    });

    return [...filtered].sort((left, right) => {
      if (sort === "relevance") return 0;
      if (sort === "name") return left.name.localeCompare(right.name, "ru", {numeric: true});
      if (sort === "price-asc" || sort === "price-desc") return comparePrices(left.quoteOnly ? null : left.price, right.quoteOnly ? null : right.price, sort === "price-desc");
      if (sort === "size") {
        return numericAttribute(left, "size") - numericAttribute(right, "size");
      }
      return Number(right.inStock) - Number(left.inStock);
    });
  }, [
    filters,
    maximumPrice,
    minimumPrice,
    filterKeys,
    sort,
    stockOnly,
    variants,
    deferredQuery,
    search,
  ]);
  const pages = Math.max(1, Math.ceil(results.length / 40));
  const currentPage = Math.min(page, pages);
  const visible = results.slice((currentPage - 1) * 40, currentPage * 40);
  function setFilter(key: ProductAttributeKey, value: string) {
    setFilters((current) => ({...current, [key]: value}));
    setPage(1);
  }

  function reset() {
    setFilters({});
    setStockOnly(false);
    setMinimumPrice("");
    setMaximumPrice("");
    setSort("name");
    setPage(1);
    setQuery("");
  }

  return (
    <>
      <FilterPanel className="lg:col-start-2" query={query}
        onQueryChange={value => {setQuery(value);setSort("relevance");setPage(1);}} onReset={reset}
        sorting={
          <label className="text-sm font-semibold">
            Сортировка
            <Select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortMode)}
              className="mt-1"
            >
              <option value="relevance">По релевантности</option>
              <option value="name">По обозначению</option>
              <option value="availability">Сначала в наличии</option>
              <option value="price-asc">Сначала дешевле</option>
              <option value="price-desc">Сначала дороже</option>
              <option value="size">По размеру</option>
            </Select>
          </label>
        } extraControls={
          <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-semibold">
            <input type="checkbox" checked={stockOnly} onChange={event => setStockOnly(event.target.checked)}
              className="size-5 shrink-0 accent-red-700"/>
            Только в наличии
          </label>
        }>
          {filterKeys.filter(key => (filterOptions.get(key)?.length ?? 0) > 0).map((key) => (
            <label key={key} className="min-w-0 text-sm font-semibold">
              {filterLabel(variants, key)}
              <Select
                value={filters[key] ?? ""}
                onChange={(event) => setFilter(key, event.target.value)}
                className="mt-1"
              >
                <option value="">Все значения</option>
                {(filterOptions.get(key) ?? []).map((value) => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </Select>
            </label>
          ))}
          <label className="text-sm font-semibold">
            Минимальная цена
            <PriceInput
              type="number"
              min={0}
              value={minimumPrice}
              onChange={(event) => setMinimumPrice(event.target.value)}

              placeholder="От"
            />
          </label>
          <label className="text-sm font-semibold">
            Максимальная цена
            <PriceInput
              type="number"
              min={0}
              value={maximumPrice}
              onChange={(event) => setMaximumPrice(event.target.value)}

              placeholder="До"
            />
          </label>
      </FilterPanel>

      <section className="min-w-0 lg:col-span-2" aria-label="Продукция">
      {isChannel && <ChannelSpecificationNote/>}
      {results.length ? (
        <>
          <div className={`hidden ${isChannel ? "overflow-x-auto" : "overflow-hidden"} rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm xl:block`}>
            <table className={isChannel ? `${tableStyles.table} text-center text-sm` : "w-full table-fixed border-collapse text-left text-sm"}>
              <colgroup>{columnWidths.map((width, index) => <col key={index} style={{width: `${width}%`}}/>)}</colgroup>
              <thead className="bg-slate-900 text-white">
                <tr>
                  {isChannel ? <>
                    <th scope="col" className="whitespace-nowrap py-3 pl-4 pr-1 font-semibold">Наименование</th>
                    <th scope="col" className="-translate-x-2 px-2 py-3 font-semibold">Изображение</th>
                  </> : <th className="p-3 font-semibold">Полное обозначение</th>}
                  <th className={isChannel ? "py-3 pl-5 pr-3 text-left font-semibold" : "p-3 font-semibold"}>Характеристики</th>
                  <th className="px-2 py-3 font-semibold">Цена</th>
                  {showAvailability && <th className="px-2 py-3 font-semibold">Наличие</th>}
                  <th className="px-1.5 py-3 font-semibold">{isChannel ? "Кол-во, м" : "Кол-во"}</th>
                  <th className="px-2 py-3 text-center"><span className="sr-only">Действие</span></th>
                </tr>
              </thead>
              <tbody>
                {visible.map((variant) => (
                  <tr id={`variant-${variant.id}`} key={variant.id} className="border-t border-slate-200 dark:border-slate-700 align-middle">
                    {isChannel ? <>
                      <th scope="row" className="py-4 pl-4 pr-1 font-semibold">{channelProfileName(variant.name)}</th>
                      <td className="-translate-x-2 px-2 py-4"><ChannelProductPreview variant={variant} compact/></td>
                    </> : <td className="break-words p-3"><CatalogImage src={variant.imageUrls[0]} name={variant.name} compact/><strong>{variant.name}</strong></td>}
                    <td className={`break-words ${isChannel ? "py-4 pl-5 pr-3 text-left" : "p-3"}`}><VariantSpecifications variant={variant} showDetails={!isChannel}/></td>
                    <td className="break-words px-2 py-3">
                      <strong className={isChannel ? "font-semibold tabular-nums" : undefined}>{variant.quoteOnly ? "Цена по запросу" : `${variant.priceQualifier === "from" ? "от " : ""}${formatUnitPrice(variant.price, variant.priceUnit)}`}</strong>
                    </td>
                    {showAvailability && <td className="px-1.5 py-3">
                      <Availability availability={variant.availability}/>
                    </td>}
                    <ProductOrderControls variant={variant} view="table" referenceStyle={isChannel}/>
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
                {isChannel && <h3 className="mb-3 text-lg font-bold">{channelProfileName(variant.name)}</h3>}
                {isChannel ? <ChannelProductPreview variant={variant}/> : <CatalogImage src={variant.imageUrls[0]} name={variant.name}/>}
                {!isChannel && <h3 className="mt-1 font-bold">{variant.name}</h3>}
                <div className="mt-4"><VariantSpecifications variant={variant} showDetails={!isChannel}/></div>
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
          <ResetFiltersButton onClick={reset}/>
        </div>
      )}
      {pages > 1 && <nav aria-label="Страницы вариантов" className="mt-6 flex flex-wrap items-center justify-center gap-4"><Button disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Назад</Button><span>Страница {currentPage} из {pages}</span><Button disabled={currentPage === pages} onClick={() => setPage(currentPage + 1)}>Далее</Button></nav>}
      </section>
    </>
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

function channelProfileName(name: string) {
  const number = name.match(/№\s*(\d+(?:[.,]\d+)?)/)?.[1];
  return number ? `№ ${number.replace(".", ",")}` : name;
}

function VariantSpecifications({variant, showDetails = true}: {variant: ProductVariant; showDetails?: boolean}) {
  return <>
    <dl className="space-y-1 text-sm">{variant.specifications.filter(s => !["Полное обозначение", "Условия цены", "Условия оплаты"].includes(s.name)).map((s, i) => <div key={`${s.name}-${i}`}><dt className="inline text-slate-500 dark:text-slate-400">{s.name}: </dt><dd className="inline">{s.value}</dd></div>)}{variant.weight && <div><dt className="inline text-slate-500 dark:text-slate-400">Теоретическая масса: </dt><dd className="inline">{formatNumber(variant.weight.value)} {variant.weight.unit}</dd></div>}</dl>
    {showDetails && variant.id.startsWith("rozmet-") && (variant.description || variant.imageUrls.length > 1) && <details className="mt-3 text-sm">
      <summary className="cursor-pointer font-semibold">Подробнее о товаре</summary>
      {variant.description && <CatalogDescription description={variant.description} className="mt-3"/>}
      {variant.imageUrls.slice(1).map(src => <CatalogImage key={src} src={src} name={variant.name} compact/>)}
    </details>}
  </>;
}

function uniqueAttributeValues(
  variants: ProductVariant[],
  key: ProductAttributeKey,
) {
  return [...new Set(
    variants.map((variant) => getVariantAttribute(variant, key)).filter((value) => value !== "—"),
  )].sort((left, right) => left.localeCompare(right, "ru", {numeric: true}));
}

function filterLabel(variants: ProductVariant[], key: ProductAttributeKey) {
  return variants
    .flatMap((variant) => variant.attributes)
    .find((attribute) => attribute.key === key)?.label ?? key;
}

function numericAttribute(variant: ProductVariant, key: ProductAttributeKey) {
  return Number.parseFloat(getVariantAttribute(variant, key).replace(",", ".")) || 0;
}
