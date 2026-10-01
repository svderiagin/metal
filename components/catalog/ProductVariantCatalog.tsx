"use client";

import {useMemo, useState} from "react";
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

type SortMode = "availability" | "price-asc" | "price-desc" | "size";

export function ProductVariantCatalog({
  variants,
  categorySlug,
}: {
  variants: ProductVariant[];
  categorySlug: string;
}) {
  if (variants.length > 0 && variants.every(isMeasuredRebarVariant)) {
    return <RebarVariantCatalog variants={variants}/>;
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
  const [sort, setSort] = useState<SortMode>("availability");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [addedVariantId, setAddedVariantId] = useState<string | null>(null);
  const {addItem} = useCart();

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

    const filtered = variants.filter((variant) => {
      const attributesMatch = presentation.filterKeys.every((key) =>
        !filters[key] || getVariantAttribute(variant, key) === filters[key],
      );

      return attributesMatch
        && (!stockOnly || variant.inStock)
        && (minimum === null || variant.price >= minimum)
        && (maximum === null || variant.price <= maximum);
    });

    return [...filtered].sort((left, right) => {
      if (sort === "price-asc") return left.price - right.price;
      if (sort === "price-desc") return right.price - left.price;
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
  ]);
  function setFilter(key: ProductAttributeKey, value: string) {
    setFilters((current) => ({...current, [key]: value}));
  }

  function reset() {
    setFilters({});
    setStockOnly(false);
    setMinimumPrice("");
    setMaximumPrice("");
    setSort("availability");
  }

  function quantityFor(variantId: string) {
    return quantities[variantId] ?? 1;
  }

  function setQuantity(variantId: string, quantity: number) {
    if (!Number.isFinite(quantity) || quantity < 1) return;
    setQuantities((current) => ({
      ...current,
      [variantId]: Math.min(999, Math.floor(quantity)),
    }));
  }

  function addVariant(variant: ProductVariant) {
    addItem(variant.id, quantityFor(variant.id));
    setAddedVariantId(variant.id);
    window.setTimeout(() => setAddedVariantId(null), 1500);
  }

  return (
    <>
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:col-start-2">
        <h2 className="text-xl font-bold">Фильтры вариантов</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {presentation.filterKeys.map((key) => (
            <label key={key} className="text-sm font-semibold">
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
            <Input
              type="number"
              min={0}
              value={minimumPrice}
              onChange={(event) => setMinimumPrice(event.target.value)}
              className="mt-1"
              placeholder="От"
            />
          </label>
          <label className="text-sm font-semibold">
            Максимальная цена
            <Input
              type="number"
              min={0}
              value={maximumPrice}
              onChange={(event) => setMaximumPrice(event.target.value)}
              className="mt-1"
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

      <section className="lg:col-span-2" aria-labelledby="variants-heading">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h2 id="variants-heading" className="text-2xl font-black">Варианты продукции</h2>
        <p className="text-sm text-slate-600">Найдено: {results.length}</p>
      </div>

      {results.length ? (
        <>
          <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm xl:block">
            <table className="w-full table-fixed border-collapse text-left text-sm">
              <colgroup>
                {presentation.columns.length === 5 ? (
                  <>
                    <col style={{width: "8%"}}/>
                    <col style={{width: "10%"}}/>
                    <col style={{width: "13%"}}/>
                    <col style={{width: "10%"}}/>
                    <col style={{width: "7%"}}/>
                  </>
                ) : (
                  <>
                    <col style={{width: "11%"}}/>
                    <col style={{width: "13%"}}/>
                    <col style={{width: "16%"}}/>
                    <col style={{width: "8%"}}/>
                  </>
                )}
                <col style={{width: "8%"}}/>
                <col style={{width: "12%"}}/>
                <col style={{width: "10%"}}/>
                <col style={{width: "8%"}}/>
                <col style={{width: "14%"}}/>
              </colgroup>
              <thead className="bg-slate-900 text-white">
                <tr>
                  {presentation.columns.map((column) => (
                    <th key={column.key} className="break-words px-2 py-3 font-semibold">{column.label}</th>
                  ))}
                  <th className="px-2 py-3 font-semibold">Вес</th>
                  <th className="px-2 py-3 font-semibold">Цена</th>
                  <th className="px-2 py-3 font-semibold">Наличие</th>
                  <th className="px-1.5 py-3 font-semibold">Кол-во</th>
                  <th className="px-2 py-3 text-center"><span className="sr-only">Действие</span></th>
                </tr>
              </thead>
              <tbody>
                {results.map((variant) => (
                  <tr id={`variant-${variant.id}`} key={variant.id} className="border-t border-slate-200 align-middle">
                    {presentation.columns.map((column) => (
                      <td key={column.key} className="break-words px-2 py-3">
                        {getVariantAttribute(variant, column.key)}
                      </td>
                    ))}
                    <td className="whitespace-nowrap px-2 py-3">{formatNumber(variant.weight.value)} {variant.weight.unit}</td>
                    <td className="whitespace-nowrap px-2 py-3">
                      <strong>{formatUnitPrice(variant.price, variant.priceUnit)}</strong>
                    </td>
                    <td className="px-1.5 py-3">
                      <Availability inStock={variant.inStock}/>
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
                        disabled={!variant.inStock}
                        onClick={() => addVariant(variant)}
                        className="whitespace-nowrap px-3"
                      >
                        {!variant.inStock
                          ? "Под заказ"
                          : addedVariantId === variant.id
                            ? "Добавлено"
                            : "В корзину"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:hidden">
            {results.map((variant) => (
              <article
                id={`variant-mobile-${variant.id}`}
                key={variant.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {variant.sku}
                </p>
                <h3 className="mt-1 font-bold">{variant.name}</h3>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  {presentation.columns.map((column) => (
                    <div key={column.key}>
                      <dt className="text-slate-500">{column.label}</dt>
                      <dd className="mt-1 font-medium">{getVariantAttribute(variant, column.key)}</dd>
                    </div>
                  ))}
                  <div>
                    <dt className="text-slate-500">Вес</dt>
                    <dd className="mt-1 font-medium">
                      {formatNumber(variant.weight.value)} {variant.weight.unit}
                    </dd>
                  </div>
                </dl>
                <div className="mt-5 flex items-end justify-between gap-4 border-t border-slate-100 pt-4">
                  <div>
                    <strong className="text-xl">{formatUnitPrice(variant.price, variant.priceUnit)}</strong>
                  </div>
                  <Availability inStock={variant.inStock}/>
                </div>
                <div className="mt-4 grid grid-cols-[1fr_auto] gap-3">
                  <QuantityInput
                    value={quantityFor(variant.id)}
                    unit={getQuantityUnit(variant)}
                    onChange={(quantity) => setQuantity(variant.id, quantity)}
                  />
                  <Button
                    type="button"
                    disabled={!variant.inStock}
                    onClick={() => addVariant(variant)}
                  >
                    {!variant.inStock
                      ? "Под заказ"
                      : addedVariantId === variant.id
                        ? "Добавлено"
                        : "В корзину"}
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <strong className="text-lg">Варианты не найдены</strong>
          <p className="mt-2 text-sm text-slate-600">Измените или сбросьте фильтры.</p>
        </div>
      )}
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
        min={1}
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
