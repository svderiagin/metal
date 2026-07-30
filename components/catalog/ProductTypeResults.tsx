"use client";

import {useMemo, useState} from "react";
import {Button} from "@/components/ui/Button";
import {Select} from "@/components/ui/Select";
import {ProductTypeGrid} from "./ProductTypeGrid";
import type {ProductType, ProductVariant} from "@/types/product";

type SortMode = "availability" | "price-asc" | "price-desc" | "name";

export function ProductTypeResults({
  productTypes,
  variants,
}: {
  productTypes: ProductType[];
  variants: ProductVariant[];
}) {
  const [material, setMaterial] = useState("");
  const [standard, setStandard] = useState("");
  const [stockOnly, setStockOnly] = useState(false);
  const [sort, setSort] = useState<SortMode>("availability");
  const [limit, setLimit] = useState(12);

  const materials = useMemo(
    () => uniqueAttributeValues(variants, "material"),
    [variants],
  );
  const standards = useMemo(
    () => uniqueAttributeValues(variants, "standard"),
    [variants],
  );
  const variantsByType = useMemo(() => groupVariantsByType(variants), [variants]);

  const result = useMemo(() => {
    const filtered = productTypes.filter((productType) => {
      const typeVariants = variantsByType.get(productType.id) ?? [];
      return (!material || hasAttribute(typeVariants, "material", material))
        && (!standard || hasAttribute(typeVariants, "standard", standard))
        && (!stockOnly || typeVariants.some((variant) => variant.inStock));
    });

    return [...filtered].sort((left, right) => {
      const leftVariants = variantsByType.get(left.id) ?? [];
      const rightVariants = variantsByType.get(right.id) ?? [];
      if (sort === "price-asc") return minimumPrice(leftVariants) - minimumPrice(rightVariants);
      if (sort === "price-desc") return minimumPrice(rightVariants) - minimumPrice(leftVariants);
      if (sort === "name") return left.name.localeCompare(right.name, "ru");
      return availableCount(rightVariants) - availableCount(leftVariants);
    });
  }, [
    material,
    productTypes,
    sort,
    standard,
    stockOnly,
    variantsByType,
  ]);

  function reset() {
    setMaterial("");
    setStandard("");
    setStockOnly(false);
    setSort("availability");
    setLimit(12);
  }

  return (
    <section className="mt-8" aria-labelledby="product-types-heading">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
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
          <button
            type="button"
            onClick={reset}
            className="min-h-11 text-sm font-semibold text-red-700 underline"
          >
            Сбросить фильтры
          </button>
        </div>
      </div>

      <div className="my-5 flex items-center justify-between gap-3">
        <h2 id="product-types-heading" className="text-xl font-black">Типы продукции</h2>
        <p className="text-sm text-slate-600">Найдено: {result.length}</p>
      </div>

      {result.length ? (
        <>
          <ProductTypeGrid productTypes={result.slice(0, limit)} variants={variants}/>
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
    groups.set(variant.productTypeId, [...(groups.get(variant.productTypeId) ?? []), variant]);
  }
  return groups;
}

function uniqueAttributeValues(
  variants: ProductVariant[],
  key: ProductVariant["attributes"][number]["key"],
) {
  return [...new Set(variants.flatMap((variant) =>
    variant.attributes
      .filter((attribute) => attribute.key === key)
      .map((attribute) => attribute.value),
  ))].sort((left, right) => left.localeCompare(right, "ru"));
}

function hasAttribute(
  variants: ProductVariant[],
  key: ProductVariant["attributes"][number]["key"],
  value: string,
) {
  return variants.some((variant) =>
    variant.attributes.some((attribute) => attribute.key === key && attribute.value === value),
  );
}

function minimumPrice(variants: ProductVariant[]) {
  return variants.length ? Math.min(...variants.map((variant) => variant.price)) : Number.MAX_SAFE_INTEGER;
}

function availableCount(variants: ProductVariant[]) {
  return variants.filter((variant) => variant.inStock).length;
}
