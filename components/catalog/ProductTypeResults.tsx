"use client";

import filterStyles from "./FilterPanel.module.css";

import {createCatalogSearchIndex} from "@/lib/search";
import {useDeferredValue, useMemo, useState} from "react";
import {Input} from "@/components/ui/Input";
import {Button} from "@/components/ui/Button";
import {Select} from "@/components/ui/Select";
import {ProductTypeGrid} from "./ProductTypeGrid";
import {ResetFiltersButton} from "./ResetFiltersButton";
import type {ProductType, ProductVariant} from "@/types/product";
import {comparePrices, matchesCategoryFilters} from "@/lib/catalogFilters";

type SortMode = "catalog" | "relevance" | "availability" | "price-asc" | "price-desc" | "name";

export function ProductTypeResults({
  productTypes,
  variants,
}: {
  productTypes: ProductType[];
  variants: ProductVariant[];
}) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const index = useMemo(() => createCatalogSearchIndex(variants, productTypes), [variants, productTypes]);
  const search = useMemo(() => index.search(deferredQuery), [index, deferredQuery]);
  const candidates = useMemo(() => deferredQuery.trim() ? search.hits.map(h => h.product) : variants, [deferredQuery, search, variants]);
  const [material, setMaterial] = useState("");
  const [standard, setStandard] = useState("");
  const [stockOnly, setStockOnly] = useState(false);
  const defaultSort: SortMode = productTypes.length > 0 && productTypes.every(type => type.categoryId === "cat-trk")
    ? "catalog" : "availability";
  const [sort, setSort] = useState<SortMode>(defaultSort);
  const [limit, setLimit] = useState(12);

  const materials = useMemo(
    () => uniqueAttributeValues(variants, "material"),
    [variants],
  );
  const standards = useMemo(
    () => uniqueAttributeValues(variants, "standard"),
    [variants],
  );
  const filteredVariants = useMemo(() => candidates.filter(variant => matchesCategoryFilters(variant, material, standard, stockOnly)), [candidates, material, standard, stockOnly]);
  const variantsByType = useMemo(() => groupVariantsByType(filteredVariants), [filteredVariants]);

  const result = useMemo(() => {
    const filtered = filterAndSortProductTypes(
      deferredQuery.trim() ? productTypes.filter(t => variantsByType.has(t.id)) : productTypes,
      variantsByType,
      material,
      standard,
      stockOnly,
      sort,
    );
    if (deferredQuery.trim() && sort === "relevance") {
      const order = new Map<string, number>();
      search.hits.forEach((h, i) => {if (!order.has(h.product.productTypeId)) order.set(h.product.productTypeId, i);});
      return filtered.sort((a, b) => (order.get(a.id) ?? Infinity) - (order.get(b.id) ?? Infinity));
    }
    return filtered;
  }, [
    deferredQuery, search,
    material,
    productTypes,
    sort,
    standard,
    stockOnly,
    variantsByType,
  ]);
  function reset() {
    setQuery("");
    setMaterial("");
    setStandard("");
    setStockOnly(false);
    setSort(defaultSort);
    setLimit(12);
  }

  return (
    <section className="mt-8" aria-labelledby="product-types-heading">
      <div className={`${filterStyles.panel} rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6`}>
        <label className="mb-4 block text-sm font-semibold">Поиск в категории<Input type="search" value={query} onChange={e => {setQuery(e.target.value);setSort("relevance");setLimit(12);}} className="mt-1" placeholder="Название, размер или марка стали"/></label>
        <div className="grid gap-4 md:grid-cols-3">
          <FilterSelect label="Материал" value={material} onChange={setMaterial}>
            <option value="">Все материалы</option>
            {materials.map((value) => <option key={value} value={value}>{value}</option>)}
          </FilterSelect>
          <FilterSelect label="Стандарт" value={standard} onChange={setStandard}>
            <option value="">Все стандарты</option>
            {standards.map((value) => <option key={value} value={value}>{value}</option>)}
          </FilterSelect>
          <FilterSelect
            label="Сортировка"
            value={sort}
            onChange={(value) => setSort(value as SortMode)}
          >
            {defaultSort === "catalog" && <option value="catalog">Порядок каталога</option>}
            <option value="relevance">По релевантности</option>
            <option value="availability">Сначала в наличии</option>
            <option value="price-asc">Сначала дешевле</option>
            <option value="price-desc">Сначала дороже</option>
            <option value="name">По названию</option>
          </FilterSelect>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <label className="flex min-h-11 items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={stockOnly}
              onChange={(event) => setStockOnly(event.target.checked)}
              className="size-4 accent-red-700"
            />
            Только в наличии
          </label>
          <ResetFiltersButton onClick={reset}/>
        </div>
      </div>

      <div className="my-5 flex items-center justify-between gap-3">
        <h2 id="product-types-heading" className="text-xl font-black">Типы продукции</h2>
        <p className="text-sm text-slate-600">Найдено: {result.length}</p>
      </div>

      {result.length ? (
        <>
          <ProductTypeGrid productTypes={result.slice(0, limit)} variants={filteredVariants}/>
          {limit < result.length && (
            <div className="mt-6 text-center">
              <Button type="button" onClick={() => setLimit((value) => value + 12)}>
                Показать ещё
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <strong className="text-lg">По выбранным условиям ничего не найдено</strong>
          <p className="mt-2 text-sm text-slate-600">Измените фильтры или сбросьте параметры.</p>
        </div>
      )}
    </section>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="text-sm font-semibold">
      {label}
      <Select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1"
      >
        {children}
      </Select>
    </label>
  );
}

function groupVariantsByType(variants: ProductVariant[]) {
  const groups = new Map<string, ProductVariant[]>();
  for (const variant of variants) {
    const group = groups.get(variant.productTypeId);
    if (group) {
      group.push(variant);
    } else {
      groups.set(variant.productTypeId, [variant]);
    }
  }
  return groups;
}

function uniqueAttributeValues(
  variants: ProductVariant[],
  key: ProductVariant["attributes"][number]["key"],
) {
  const values = new Set<string>();
  for (const variant of variants) {
    for (const attribute of variant.attributes) {
      if (attribute.key === key && attribute.value) values.add(attribute.value);
    }
  }
  return [...values].sort((left, right) => left.localeCompare(right, "ru"));
}

function minimumPrice(variants: ProductVariant[]) {
  let minimum: number | null = null;
  for (const variant of variants) {
    if (!variant.quoteOnly && variant.price !== null && variant.price > 0 && (minimum === null || variant.price < minimum)) minimum = variant.price;
  }
  return minimum;
}

function availableCount(variants: ProductVariant[]) {
  let count = 0;
  for (const variant of variants) {
    if (variant.inStock) count += 1;
  }
  return count;
}

function filterAndSortProductTypes(
  productTypes: ProductType[],
  variantsByType: Map<string, ProductVariant[]>,
  material: string,
  standard: string,
  stockOnly: boolean,
  sort: SortMode,
): ProductType[] {
  const result: ProductType[] = [];

  for (const productType of productTypes) {
    const variants = variantsByType.get(productType.id) ?? [];
    if ((material || standard || stockOnly) && !variants.length) continue;
    result.push(productType);
  }

  const preserveBeamOrder = productTypes.every(productType => productType.categoryId === "cat-bal");
  if (sort === "catalog") return result;
  result.sort((left, right) => {
    const leftVariants = variantsByType.get(left.id) ?? [];
    const rightVariants = variantsByType.get(right.id) ?? [];
    if (sort === "price-asc" || sort === "price-desc") return comparePrices(minimumPrice(leftVariants), minimumPrice(rightVariants), sort === "price-desc");
    if (sort === "name") return left.name.localeCompare(right.name, "ru");
    // Keep the configured beam series order instead of promoting stocked demo rows.
    if (preserveBeamOrder) return 0;
    return availableCount(rightVariants) - availableCount(leftVariants);
  });

  return result;
}
