"use client";

import {useDeferredValue, useMemo, useState} from "react";
import {FilterPanel} from "./FilterPanel";
import {PriceRangeFeedback, PriceRangeInputs, useCatalogPriceRange} from "./PriceInput";
import {Select} from "@/components/ui/Select";
import {createCatalogSearchIndex} from "@/lib/search";
import {useLinkedVariant} from "@/hooks/useLinkedVariant";
import {getVariantFilterKeys} from "@/lib/variantPresentation";
import {isIllustratedSheet, sheetFilterKeys} from "@/lib/sheetPresentation";
import {selectVariants, uniqueAttributeValues, variantFilterLabel, type VariantSort} from "@/lib/variantCatalog";
import type {ProductAttributeKey, ProductVariant} from "@/types/product";
import {VariantCatalogResults} from "./VariantCatalogResults";

export function GenericProductVariantCatalog({
  variants,
  categorySlug,
}: {
  variants: ProductVariant[];
  categorySlug: string;
}) {
  const isSheetCatalog = variants.length > 0 && variants.every(isIllustratedSheet);
  const filterKeys = isSheetCatalog ? sheetFilterKeys : getVariantFilterKeys(categorySlug);
  const [filters, setFilters] = useState<Partial<Record<ProductAttributeKey, string>>>({});
  const [stockOnly, setStockOnly] = useState(false);
  const [sort, setSort] = useState<VariantSort>("name");
  const [page, setPage] = useState(1);
  const priceRange = useCatalogPriceRange(() => setPage(1));
  const {minimumPrice, maximumPrice} = priceRange;
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

  const results = useMemo(() => selectVariants(deferredQuery.trim() ? search.hits.map(hit => hit.product) : variants,
    {filters, filterKeys, stockOnly, minimumPrice, maximumPrice, sort}),
    [deferredQuery, search, variants, filters, filterKeys, stockOnly, minimumPrice, maximumPrice, sort]);
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
    priceRange.reset();
    setSort("name");
    setPage(1);
    setQuery("");
  }

  return (
    <>
      <FilterPanel className="lg:col-start-2" query={query}
        onQueryChange={value => {setQuery(value);setSort("relevance");setPage(1);}} onReset={reset}
        resultCount={{visible: results.length, total: variants.length, pending: query !== deferredQuery}}
        sorting={
          <label className="text-sm font-semibold">
            Сортировка
            <Select
              value={sort}
              onChange={(event) => {setSort(event.target.value as VariantSort); setPage(1);}}
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
        } extraControls={<>
          <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-semibold">
            <input type="checkbox" checked={stockOnly} onChange={event => {setStockOnly(event.target.checked); setPage(1);}}
              className="size-5 shrink-0 accent-red-700"/>
            Только в наличии
          </label>
          <PriceRangeFeedback message={priceRange.message}/>
        </>}>
          {filterKeys.filter(key => (filterOptions.get(key)?.length ?? 0) > 0).map((key) => (
            <label key={key} className="min-w-0 text-sm font-semibold">
              {variantFilterLabel(variants, key)}
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
          <PriceRangeInputs range={priceRange}/>
      </FilterPanel>

      <VariantCatalogResults visible={visible} categorySlug={categorySlug} isSheetCatalog={isSheetCatalog} resultsCount={results.length}
        currentPage={currentPage} pages={pages} onPageChange={setPage} onReset={reset}/>
    </>
  );
}

