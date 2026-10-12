"use client";

import filterStyles from "./FilterPanel.module.css";
import {PriceInput} from "./PriceInput";

import {createCatalogSearchIndex} from "@/lib/search";
import {useDeferredValue, useEffect, useMemo, useState} from "react";
import Link from "next/link";
import {CatalogImage} from "./CatalogImage";
import {useCart} from "@/hooks/useCart";
import {formatUnitPrice} from "@/lib/currency";
import {formatNumber} from "@/lib/numberFormat";
import {
  getQuantityUnit,
  getVariantAttribute,
  getVariantPresentation,
} from "@/lib/variantPresentation";
import {Button} from "@/components/ui/Button";
import {Input} from "@/components/ui/Input";
import {Select} from "@/components/ui/Select";
import {ResetFiltersButton} from "@/components/catalog/ResetFiltersButton";
import type {ProductAttributeKey, ProductVariant} from "@/types/product";
import {
  isMeasuredRebarVariant,
  RebarVariantCatalog,
} from "@/components/catalog/RebarVariantCatalog";

type SortMode = "relevance" | "availability" | "price-asc" | "price-desc" | "size" | "name";

export function ProductVariantCatalog({
  variants,
  categorySlug,
}: {
  variants: ProductVariant[];
  categorySlug: string;
}) {
  const measured = variants.filter(v => !v.imported && isMeasuredRebarVariant(v)).filter(isMeasuredRebarVariant);
  if (measured.length > 0) {
    const isA500c = categorySlug === "armatura" && variants.every(v => v.subcategoryId === "cat-arm-sub-1");
    if (isA500c) return <RebarVariantCatalog variants={measured} simplified/>;
    const other = variants.filter(v => !measured.some(m => m.id === v.id));
    return <>{other.length > 0 && <GenericProductVariantCatalog variants={other} categorySlug={categorySlug}/>}<RebarVariantCatalog variants={measured}/></>;
  }

  return <GenericProductVariantCatalog variants={variants} categorySlug={categorySlug}/>;
}

function GenericProductVariantCatalog({
  variants,
  categorySlug,
}: {
  variants: ProductVariant[];
  categorySlug: string;
}) {
  const presentation = getVariantPresentation(categorySlug);
  const [filters, setFilters] = useState<Partial<Record<ProductAttributeKey, string>>>({});
  const [stockOnly, setStockOnly] = useState(false);
  const [minimumPrice, setMinimumPrice] = useState("");
  const [maximumPrice, setMaximumPrice] = useState("");
  const [sort, setSort] = useState<SortMode>("name");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [addedVariantId, setAddedVariantId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const index = useMemo(() => createCatalogSearchIndex(variants), [variants]);
  const search = useMemo(() => index.search(deferredQuery), [index, deferredQuery]);
  const {addItem} = useCart();
  useEffect(() => {
    function revealLinkedVariant() {
      const id = window.location.hash.replace(/^#variant-/, "");
      const variant = variants.find(v => v.id === id);
      if (!variant) return;
      setQuery(variant.name);
      setPage(1);
      window.setTimeout(() => document.getElementById(`${window.innerWidth < 1280 ? "variant-mobile-" : "variant-"}${id}`)?.scrollIntoView({block: "center"}), 100);
    }
    const timer = window.setTimeout(revealLinkedVariant, 0);
    window.addEventListener("hashchange", revealLinkedVariant);
    return () => {window.clearTimeout(timer); window.removeEventListener("hashchange", revealLinkedVariant);};
  }, [variants]);

  const filterOptions = useMemo(
    () => new Map(
      presentation.filterKeys.map((key) => [
        key,
        uniqueAttributeValues(variants, key),
      ]),
    ),
    [presentation.filterKeys, variants],
  );

  const results = useMemo(() => {
    const minimum = minimumPrice === "" ? null : Number(minimumPrice);
    const maximum = maximumPrice === "" ? null : Number(maximumPrice);

    const filtered = (deferredQuery.trim() ? search.hits.map(h => h.product) : variants).filter((variant) => {
      const attributesMatch = presentation.filterKeys.every((key) =>
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
      if (sort.startsWith("price") && left.quoteOnly !== right.quoteOnly) return left.quoteOnly ? 1 : -1;
      if (sort === "price-asc") return (left.price ?? Infinity) - (right.price ?? Infinity);
      if (sort === "price-desc") return (right.price ?? -Infinity) - (left.price ?? -Infinity);
      if (sort === "size") {
        return numericAttribute(left, "size") - numericAttribute(right, "size");
      }
      return Number(right.inStock) - Number(left.inStock);
    });
  }, [
    filters,
    maximumPrice,
    minimumPrice,
    presentation.filterKeys,
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

  function quantityFor(variantId: string) {
    return quantities[variantId] ?? 1;
  }

  function setQuantity(variantId: string, quantity: number) {
    if (!Number.isFinite(quantity) || quantity <= 0 || quantity > 999) return;
    setQuantities((current) => ({
      ...current,
      [variantId]: quantity,
    }));
  }

  function addVariant(variant: ProductVariant) {
    addItem(variant.id, quantityFor(variant.id));
    setAddedVariantId(variant.id);
    window.setTimeout(() => setAddedVariantId(null), 1500);
  }

  return (
    <>
      <div className={`${filterStyles.panel} min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:col-start-2`}>
        <h2 className="text-xl font-bold">Фильтры вариантов</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <label className="text-sm font-semibold">Поиск варианта<Input className="mt-1" type="search" value={query} onChange={e => {setQuery(e.target.value); setSort("relevance"); setPage(1);}} placeholder="Название, размер, марка"/></label>
          {presentation.filterKeys.filter(key => (filterOptions.get(key)?.length ?? 0) > 0).map((key) => (
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

      <section className="min-w-0 lg:col-span-2" aria-labelledby="variants-heading">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h2 id="variants-heading" className="text-2xl font-black">Варианты продукции</h2>
        <p className="text-sm text-slate-600">Найдено: {results.length}</p>
      </div>

      {results.length ? (
        <>
          <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm xl:block">
            <table className="w-full table-fixed border-collapse text-left text-sm">
              <colgroup><col style={{width:"27%"}}/><col style={{width:"29%"}}/><col style={{width:"15%"}}/><col style={{width:"10%"}}/><col style={{width:"7%"}}/><col style={{width:"12%"}}/></colgroup>
              <thead className="bg-slate-900 text-white">
                <tr>
                  <th className="p-3 font-semibold">Полное обозначение</th>
                  <th className="p-3 font-semibold">Характеристики</th>
                  <th className="px-2 py-3 font-semibold">Цена</th>
                  <th className="px-2 py-3 font-semibold">Наличие</th>
                  <th className="px-1.5 py-3 font-semibold">Кол-во</th>
                  <th className="px-2 py-3 text-center"><span className="sr-only">Действие</span></th>
                </tr>
              </thead>
              <tbody>
                {visible.map((variant) => (
                  <tr id={`variant-${variant.id}`} key={variant.id} className="border-t border-slate-200 align-middle">
                    <td className="break-words p-3"><CatalogImage src={variant.imageUrls[0]} name={variant.name} compact/><strong>{variant.name}</strong><p className="mt-2 text-xs text-slate-500">{variant.sku}</p></td>
                    <td className="break-words p-3"><VariantSpecifications variant={variant}/></td>
                    <td className="break-words px-2 py-3">
                      <strong>{variant.quoteOnly ? "Цена по запросу" : `${variant.priceQualifier === "from" ? "от " : ""}${formatUnitPrice(variant.price, variant.priceUnit)}`}</strong>
                    </td>
                    <td className="px-1.5 py-3">
                      {variant.imported ? <span className="text-xs">Наличие уточняется</span> : <Availability inStock={variant.inStock}/>}
                    </td>
                    <td className="px-2 py-3 text-center">
                      <QuantityInput
                        value={quantityFor(variant.id)}
                        unit={getQuantityUnit(variant)}
                        onChange={(quantity) => setQuantity(variant.id, quantity)}
                      />
                    </td>
                    <td className="px-2 py-3">
                      <Button
                        type="button"
                        disabled={variant.quoteOnly || variant.priceQualifier === "from" || (!variant.imported && !variant.inStock)}
                        onClick={() => addVariant(variant)}
                        className="px-2"
                      >
                        {!variant.imported && !variant.inStock
                          ? "Под заказ"
                          : addedVariantId === variant.id
                            ? "Добавлено"
                            : "В корзину"}
                      </Button>
                      {(variant.quoteOnly || variant.priceQualifier === "from") && <Link className="mt-2 inline-flex min-h-11 items-center text-red-700 underline" href={`/?product=${encodeURIComponent(variant.name)}#request`}>Запросить цену</Link>}
                    </td>
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
                className="min-w-0 break-words rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {variant.sku}
                </p>
                <CatalogImage src={variant.imageUrls[0]} name={variant.name}/>
                <h3 className="mt-1 font-bold">{variant.name}</h3>
                <div className="mt-4"><VariantSpecifications variant={variant}/></div>
                <div className="mt-5 flex flex-wrap items-end justify-between gap-4 border-t border-slate-100 pt-4">
                  <div>
                    <strong className="text-xl">{variant.quoteOnly ? "Цена по запросу" : `${variant.priceQualifier === "from" ? "от " : ""}${formatUnitPrice(variant.price, variant.priceUnit)}`}</strong>
                  </div>
                  {variant.imported ? <span className="text-xs">Наличие уточняется</span> : <Availability inStock={variant.inStock}/>}
                </div>
                <div className="mt-4 grid grid-cols-[1fr_auto] gap-3">
                  <QuantityInput
                    value={quantityFor(variant.id)}
                    unit={getQuantityUnit(variant)}
                    onChange={(quantity) => setQuantity(variant.id, quantity)}
                  />
                  <Button
                    type="button"
                    disabled={variant.quoteOnly || variant.priceQualifier === "from" || (!variant.imported && !variant.inStock)}
                    onClick={() => addVariant(variant)}
                  >
                    {!variant.imported && !variant.inStock
                      ? "Под заказ"
                      : addedVariantId === variant.id
                        ? "Добавлено"
                        : "В корзину"}
                  </Button>
                  {(variant.quoteOnly || variant.priceQualifier === "from") && <Link className="inline-flex min-h-11 items-center text-red-700 underline" href={`/?product=${encodeURIComponent(variant.name)}#request`}>Запросить цену</Link>}
                </div>
              </article>
            ))}
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <strong className="text-lg">Варианты не найдены</strong>
          <p className="mt-2 text-sm text-slate-600">Измените или сбросьте фильтры.</p>
          <ResetFiltersButton onClick={reset}/>
        </div>
      )}
      {pages > 1 && <nav aria-label="Страницы вариантов" className="mt-6 flex flex-wrap items-center justify-center gap-4"><Button disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Назад</Button><span>Страница {currentPage} из {pages}</span><Button disabled={currentPage === pages} onClick={() => setPage(currentPage + 1)}>Далее</Button></nav>}
      </section>
    </>
  );
}

function QuantityInput({
  value,
  unit,
  onChange,
}: {
  value: number;
  unit: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="flex min-w-0 flex-col items-start gap-1">
      <span className="sr-only">Количество</span>
      <Input
        type="number"
        min={0}
        step="any"
        max={999}
        value={value}
        onChange={(event) => onChange(event.currentTarget.valueAsNumber)}
        className="w-14 px-2"
      />
      <span className="text-xs text-slate-500">{unit}</span>
    </label>
  );
}

function Availability({inStock}: { inStock: boolean }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
      inStock ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-900"
    }`}>
      {inStock ? "В наличии" : "Под заказ"}
    </span>
  );
}

function VariantSpecifications({variant}: {variant: ProductVariant}) {
  return <dl className="space-y-1 text-sm">{variant.specifications.filter(s => s.name !== "Полное обозначение").map((s, i) => <div key={`${s.name}-${i}`}><dt className="inline text-slate-500">{s.name}: </dt><dd className="inline">{s.value}</dd></div>)}{variant.weight && <div><dt className="inline text-slate-500">Теоретическая масса: </dt><dd className="inline">{formatNumber(variant.weight.value)} {variant.weight.unit}</dd></div>}</dl>;
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
