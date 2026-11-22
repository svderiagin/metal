"use client";

import {useMemo, useState} from "react";
import {Select} from "@/components/ui/Select";
import {useLinkedVariant} from "@/hooks/useLinkedVariant";
import {comparePrices} from "@/lib/catalogFilters";
import {normalizeText} from "@/lib/search/russian";
import {formatUnitPrice} from "@/lib/currency";
import {
  metalMeshFormat,
  metalMeshSpecification,
  type MetalMeshVariant,
} from "@/lib/metalMesh";
import {requiresWholeMetalMeshQuantity} from "@/lib/variantPresentation";
import {ProductOrderControls} from "./ProductOrderControls";
import {FilterPanel} from "./FilterPanel";
import {ResetFiltersButton} from "./ResetFiltersButton";
import {CatalogVariantLayout, CatalogVariantSpecifications, CatalogVariantTable, singleQuantityColumns} from "./CatalogVariantLayout";
import {CatalogPositionDetails} from "./CatalogPositionDetails";
import {CatalogGuideFigure} from "./CatalogGuideFigure";
import {formatSpecification, storefrontPositionFields} from "./StorefrontPositionSpecifications";

type SortMode = "name" | "cell-asc" | "price-asc" | "price-desc";
const columns = singleQuantityColumns("Ячейка", "Проволока", "Формат");

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
    const needle = normalizeText(query);
    return variants.filter((variant) => {
      const cell = metalMeshSpecification(variant, "Размер ячейки");
      const wire = metalMeshSpecification(variant, "Диаметр проволоки");
      const productFormat = metalMeshFormat(variant);
      const searchable = normalizeText(`${variant.name} ${variant.sku} ${cell} ${wire} ${productFormat}`);
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
      activeFilters={[cellSize, wireDiameter, format].filter(Boolean).length}
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
        <CatalogVariantTable columns={columns}>
          {results.map(variant => <MetalMeshItem key={variant.id} variant={variant} view="table"/>)}
        </CatalogVariantTable>
        <div className="grid gap-4 sm:grid-cols-2 xl:hidden">
          {results.map((variant) => <MetalMeshItem key={variant.id} variant={variant} view="card"/>)}
        </div>
      </> : <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 p-8 text-center">
        <strong className="text-lg">Варианты не найдены</strong>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Измените или сбросьте фильтры.</p>
        <div className="mt-4"><ResetFiltersButton onClick={reset}/></div>
      </div>}
    </section>
  </>;
}

function MetalMeshItem({variant, view}: {variant: MetalMeshVariant; view: "table" | "card"}) {
  const cell = formatSpecification(metalMeshSpecification(variant, "Размер ячейки"));
  const wire = formatSpecification(metalMeshSpecification(variant, "Диаметр проволоки"));
  const format = formatSpecification(metalMeshFormat(variant));
  const coating = metalMeshSpecification(variant, "Покрытие");
  const fields = [
    {label: "Размер ячейки", value: cell},
    {label: "Диаметр проволоки", value: wire},
    {label: "Размер рулона / карты", value: format},
    ...(coating !== "—" ? [{label: "Покрытие", value: coating}] : []),
  ];

  return <CatalogVariantLayout view={view} variant={variant}
    name={view === "table" && cell !== "—" ? cell : variant.name}
    tableSpecifications={{cells: <>
      <td className="tabular-nums">{wire}{coating !== "—" && <span className="block text-xs text-slate-600 dark:text-slate-400">
        {coating === "Оцинкованная" ? "Цинк" : coating}
      </span>}</td>
      <td className="tabular-nums">{format}</td>
    </>}}
    specifications={<CatalogVariantSpecifications items={fields}/>}
    details={<CatalogPositionDetails title="Характеристики сетки" fields={storefrontPositionFields(variant)}
      figures={cell !== "—" ? <CatalogGuideFigure diagram={{
        shape: "mesh", dimensions: [["Ячейка", cell], ...(wire !== "—" ? [["Проволока", wire] as const] : [])],
      }}/> : undefined}
      supply={<p>Сверьте единицу продажи с нужным объёмом. Для рулона учитывайте его длину, для карт — размер панели и стыки по схеме укладки.</p>}/>}
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
