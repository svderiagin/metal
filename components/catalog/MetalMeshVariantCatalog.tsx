"use client";

import {useMemo, useState} from "react";
import {Select} from "@/components/ui/Select";
import {useLinkedVariant} from "@/hooks/useLinkedVariant";
import {comparePrices} from "@/lib/catalogFilters";
import {formatUnitPrice} from "@/lib/currency";
import {
  metalMeshFormat,
  metalMeshSpecification,
  type MetalMeshVariant,
} from "@/lib/metalMesh";
import {requiresWholeMetalMeshQuantity} from "@/lib/variantPresentation";
import {ProductOrderControls} from "./ProductOrderControls";
import {FilterPanel} from "./FilterPanel";
import {CatalogVariantLayout, CatalogVariantSpecifications, CatalogVariantTable} from "./CatalogVariantLayout";

type SortMode = "name" | "cell-asc" | "price-asc" | "price-desc";

export function MetalMeshVariantCatalog({variants}: {variants: MetalMeshVariant[]}) {
  const [query, setQuery] = useState("");
  const [cellSize, setCellSize] = useState("");
  const [wireDiameter, setWireDiameter] = useState("");
  const [format, setFormat] = useState("");
  const [sort, setSort] = useState<SortMode>("name");
  useLinkedVariant(variants, (variant) => { reset(); setQuery(variant.name); });

  const cellSizes = useMemo(() => uniqueValues(variants, "Размер ячейки"), [variants]);
  const wireDiameters = useMemo(() => uniqueValues(variants, "Диаметр проволоки"), [variants]);
  const formats = useMemo(() => [...new Set(variants.map(metalMeshFormat))]
    .filter((value) => value !== "—")
    .sort(numericCompare), [variants]);
  const results = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("ru");
    return variants.filter((variant) => {
      const cell = metalMeshSpecification(variant, "Размер ячейки");
      const wire = metalMeshSpecification(variant, "Диаметр проволоки");
      const productFormat = metalMeshFormat(variant);
      const searchable = `${variant.name} ${variant.sku} ${cell} ${wire} ${productFormat}`.toLocaleLowerCase("ru");
      return (!needle || searchable.includes(needle))
        && (!cellSize || cell === cellSize)
        && (!wireDiameter || wire === wireDiameter)
        && (!format || productFormat === format);
    }).sort((left, right) => {
      if (sort === "price-asc" || sort === "price-desc") {
        return comparePrices(left.price, right.price, sort === "price-desc");
      }
      if (sort === "cell-asc") {
        return numericCompare(
          metalMeshSpecification(left, "Размер ячейки"),
          metalMeshSpecification(right, "Размер ячейки"),
        ) || numericCompare(
          metalMeshSpecification(left, "Диаметр проволоки"),
          metalMeshSpecification(right, "Диаметр проволоки"),
        );
      }
      return left.name.localeCompare(right.name, "ru", {numeric: true});
    });
  }, [cellSize, format, query, sort, variants, wireDiameter]);

  function reset() {
    setQuery("");
    setCellSize("");
    setWireDiameter("");
    setFormat("");
    setSort("name");
  }

  return <>
    <FilterPanel className="lg:col-start-2" query={query}
      onQueryChange={setQuery} onReset={reset} resultCount={{visible: results.length, total: variants.length}}
      sorting={<label className="text-sm font-semibold">
        Сортировка
        <Select value={sort} onChange={(event) => setSort(event.target.value as SortMode)} className="mt-1">
          <option value="name">По наименованию</option>
          <option value="cell-asc">По размеру ячейки</option>
          <option value="price-asc">Цена: по возрастанию</option>
          <option value="price-desc">Цена: по убыванию</option>
        </Select>
      </label>}>
      <MeshFilter label="Размер ячейки" value={cellSize} values={cellSizes} onChange={setCellSize}/>
      <MeshFilter label="Диаметр проволоки" value={wireDiameter} values={wireDiameters} onChange={setWireDiameter}/>
      <MeshFilter label="Размер рулона / карты" value={format} values={formats} onChange={setFormat}/>
    </FilterPanel>

    <section className="min-w-0 lg:col-span-2" aria-label="Сетка металлическая">
      {results.length ? <>
        <CatalogVariantTable>
          {results.map(variant => <MetalMeshItem key={variant.id} variant={variant} view="table"/>)}
        </CatalogVariantTable>
        <div className="grid gap-4 sm:grid-cols-2 xl:hidden">
          {results.map((variant) => <MetalMeshItem key={variant.id} variant={variant} view="card"/>)}
        </div>
      </> : <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 p-8 text-center">
        <strong className="text-lg">Варианты не найдены</strong>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Измените или сбросьте фильтры.</p>
      </div>}
    </section>
  </>;
}

function MetalMeshItem({variant, view}: {variant: MetalMeshVariant; view: "table" | "card"}) {
  const specifications = <CatalogVariantSpecifications items={[
    {label: "Размер ячейки", value: metalMeshSpecification(variant, "Размер ячейки")},
    {label: "Диаметр проволоки", value: metalMeshSpecification(variant, "Диаметр проволоки")},
    {label: "Размер рулона / карты", value: metalMeshFormat(variant)},
  ]}/>;

  return <CatalogVariantLayout view={view} variant={variant} specifications={specifications}
    price={formatUnitPrice(variant.price, variant.priceUnit)}
    order={<ProductOrderControls view={view} variant={variant} allowBackorder wholeQuantity={requiresWholeMetalMeshQuantity(variant)}/>}/>;
}

function MeshFilter({label, value, values, onChange}: {
  label: string;
  value: string;
  values: string[];
  onChange: (value: string) => void;
}) {
  return <label className="text-sm font-semibold">
    {label}
    <Select value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="">Все значения</option>
      {values.map((option) => <option key={option} value={option}>{option}</option>)}
    </Select>
  </label>;
}

function uniqueValues(variants: MetalMeshVariant[], specification: string) {
  return [...new Set(variants.map((variant) => metalMeshSpecification(variant, specification)))]
    .filter((value) => value !== "—")
    .sort(numericCompare);
}

function numericCompare(left: string, right: string) {
  return left.localeCompare(right, "ru", {numeric: true});
}
