"use client";

import {useMemo, useState} from "react";
import {Select} from "@/components/ui/Select";
import {useLinkedVariant} from "@/hooks/useLinkedVariant";
import {comparePrices} from "@/lib/catalogFilters";
import {storefrontAvailability} from "@/lib/catalogOffer";
import {normalizeText} from "@/lib/search/russian";
import {formatUnitPrice} from "@/lib/currency";
import {formatNumber} from "@/lib/numberFormat";
import {metalMeshFormat, metalMeshPackageArea, metalMeshSpecification, type MetalMeshVariant} from "@/lib/metalMesh";
import {getQuantityUnit, requiresWholeMetalMeshQuantity} from "@/lib/variantPresentation";
import {ProductOrderControls} from "./ProductOrderControls";
import {FilterPanel} from "./FilterPanel";
import {ResetFiltersButton} from "./ResetFiltersButton";
import {CatalogVariantLayout, CatalogVariantSpecifications, CatalogVariantTable} from "./CatalogVariantLayout";
import {CatalogPositionDetails} from "./CatalogPositionDetails";
import {CatalogTableNote} from "./CatalogTableNote";
import {formatSpecification} from "./StorefrontPositionSpecifications";

type SortMode = "size-asc" | "size-desc" | "price-asc" | "price-desc";

const cellSpec = "Размер ячейки";
const wireSpec = "Диаметр проволоки";
const coatingSpec = "Покрытие";
const unlistedCoating = "Не указано";

function meshCoating(variant: MetalMeshVariant) {
  const coating = metalMeshSpecification(variant, coatingSpec);
  return coating === "—" ? unlistedCoating : coating;
}

function meshTableValue(value: string) {
  return formatSpecification(value).replace(/\s*мм?\.?$/iu, "");
}

export function MetalMeshVariantCatalog({variants}: {variants: MetalMeshVariant[]}) {
  const [query, setQuery] = useState("");
  const [cellSize, setCellSize] = useState("");
  const [wireDiameter, setWireDiameter] = useState("");
  const [format, setFormat] = useState("");
  const [coating, setCoating] = useState("");
  const [availability, setAvailability] = useState("");
  const [sort, setSort] = useState<SortMode>("size-asc");
  useLinkedVariant(variants, (variant) => { reset(); setQuery(variant.name); });

  const card = variants[0].subcategoryId === "cat-mesh-sub-3";
  const chainLink = variants[0].subcategoryId === "cat-mesh-sub-1";
  const packageLabel = card ? "Размер карты" : "Размер рулона";
  const formatOptions = useMemo(() => meshOptions(variants.map(metalMeshFormat)), [variants]);
  const cellOptions = useMemo(() => meshOptions(variants.map((variant) => metalMeshSpecification(variant, cellSpec))), [variants]);
  const wireOptions = useMemo(() => meshOptions(variants.map((variant) => metalMeshSpecification(variant, wireSpec))), [variants]);
  const coatings = useMemo(() => meshOptions(variants.map(meshCoating)), [variants]);
  const showCoating = coatings.length > 1;
  const availabilityOptions = new Set(variants.map((variant) => storefrontAvailability(variant.availability)));
  const results = useMemo(() => {
    const terms = normalizeText(query).split(" ").filter(Boolean);
    return variants.filter((variant) => {
      const cell = metalMeshSpecification(variant, cellSpec);
      const wire = metalMeshSpecification(variant, wireSpec);
      const productFormat = metalMeshFormat(variant);
      const surface = meshCoating(variant);
      const sizeAndWire = `${meshTableValue(cell)} × ${meshTableValue(wire)}`;
      const searchable = normalizeText(`${variant.name} ${cell} ${wire} ${productFormat} ${sizeAndWire} ${surface} ${metalMeshSpecification(variant, "Тип")}`);
      return terms.every(term => searchable.includes(term))
        && (!cellSize || cell === cellSize)
        && (!wireDiameter || wire === wireDiameter)
        && (!format || productFormat === format)
        && (!coating || surface === coating)
        && (!availability || storefrontAvailability(variant.availability) === availability);
    }).sort((left, right) => {
      if (sort === "price-asc" || sort === "price-desc") {
        return comparePrices(left.price, right.price, sort === "price-desc");
      }
      const dimensions = numericCompare(metalMeshSpecification(left, cellSpec), metalMeshSpecification(right, cellSpec))
        || numericCompare(metalMeshSpecification(left, wireSpec), metalMeshSpecification(right, wireSpec))
        || numericCompare(metalMeshFormat(left), metalMeshFormat(right));
      return sort === "size-desc" ? -dimensions : dimensions;
    });
  }, [availability, cellSize, coating, format, query, sort, variants, wireDiameter]);

  function reset() {
    setQuery("");
    setCellSize("");
    setWireDiameter("");
    setFormat("");
    setCoating("");
    setAvailability("");
    setSort("size-asc");
  }

  const metered = results.filter(variant => variant.unit === "meter");
  const packaged = results.filter(variant => variant.unit !== "meter");
  return <>
    <FilterPanel query={query} queryPlaceholder="Ячейка, проволока или формат"
      activeFilters={[cellSize, wireDiameter, format, coating, availability].filter(Boolean).length}
      onQueryChange={setQuery} onReset={reset} resultCount={{visible: results.length, total: variants.length}}
      sorting={<label className="text-sm font-semibold">
        Сортировка
        <Select value={sort} onChange={(event) => setSort(event.target.value as SortMode)} className="mt-1">
          <option value="size-asc">Ячейка: по возрастанию</option>
          <option value="size-desc">Ячейка: по убыванию</option>
          <option value="price-asc">Цена: по возрастанию</option>
          <option value="price-desc">Цена: по убыванию</option>
        </Select>
      </label>}>
      <MeshFilter label="Ячейка, мм" value={cellSize} values={cellOptions} onChange={setCellSize}/>
      <MeshFilter label="Проволока, мм" value={wireDiameter} values={wireOptions} onChange={setWireDiameter}/>
      <MeshFilter label={`${packageLabel}, м`} value={format} values={formatOptions} onChange={setFormat}/>
      {showCoating && <MeshFilter label="Покрытие" value={coating} values={coatings} onChange={setCoating}/>}
      {availabilityOptions.size > 1 && <label className="text-sm font-semibold">
        Наличие
        <Select value={availability} onChange={event => setAvailability(event.target.value)}>
          <option value="">Все позиции</option>
          <option value="IN_STOCK">В наличии</option>
          <option value="ON_ORDER">Под заказ</option>
        </Select>
      </label>}
    </FilterPanel>

    <div className="min-w-0">
      <CatalogTableNote>
        {card ? "Цена указана за карту. Для заказа введите количество карт."
          : chainLink ? "Рабица продаётся целыми рулонами. Размер указан как высота полотна × длина."
            : "Сварная сетка продаётся целыми рулонами. Штукатурную и тканую сетку можно заказать погонными метрами."}
        {coatings.length === 1 && coatings[0] === "Оцинкованная" && <> Покрытие — цинковое.</>}
      </CatalogTableNote>

      {packaged.length > 0 && <MeshResults variants={packaged} packageLabel={packageLabel}
        card={card} showCoating={showCoating}/>}
      {metered.length > 0 && <MeshResults variants={metered} packageLabel={packageLabel}
        card={false} showCoating={showCoating} metered/>}
      {results.length === 0 && <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-600 dark:bg-slate-900">
        <strong className="text-lg">Варианты не найдены</strong>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Измените или сбросьте фильтры.</p>
        <div className="mt-4"><ResetFiltersButton onClick={reset}/></div>
      </div>}
    </div>
  </>;
}

function MeshResults({variants, packageLabel, card, showCoating, metered = false}: {
  variants: MetalMeshVariant[];
  packageLabel: string;
  card: boolean;
  showCoating: boolean;
  metered?: boolean;
}) {
  return <section className={metered ? "min-w-0 space-y-4 not-first:mt-8" : "min-w-0"}
    aria-label={metered ? "Штукатурная и тканая сетка" : card ? "Сетка в картах" : "Сетка в рулонах"}>
    {metered && <div>
      <h2 className="text-section-title">Штукатурная и тканая сетка</h2>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Размер рулона указан как ширина × длина. Если ширина не указана, в таблице приведена длина рулона.</p>
    </div>}
    <CatalogVariantTable designation="Ячейка, мм" specifications={["Проволока, мм", card ? "Карта, м" : "Рулон, м"]}
      unit={getQuantityUnit(variants[0])}>
      {variants.map(variant => <MetalMeshItem key={variant.id} variant={variant} view="table"
        packageLabel={packageLabel} showCoating={showCoating} metered={metered}/>)}
    </CatalogVariantTable>
    <div className="grid gap-4 sm:grid-cols-2 xl:hidden">
      {variants.map(variant => <MetalMeshItem key={variant.id} variant={variant} view="card"
        packageLabel={packageLabel} showCoating={showCoating} metered={metered}/>)}
    </div>
  </section>;
}

function MetalMeshItem({variant, view, packageLabel, showCoating, metered}: {
  variant: MetalMeshVariant;
  view: "table" | "card";
  packageLabel: string;
  showCoating: boolean;
  metered: boolean;
}) {
  const cell = metalMeshSpecification(variant, cellSpec);
  const wire = metalMeshSpecification(variant, wireSpec);
  const format = metalMeshFormat(variant);
  const coating = meshCoating(variant);
  const area = metalMeshPackageArea(variant);
  const kind = metalMeshSpecification(variant, "Тип").replace(/ сетка$/u, "");
  const fields = [
    {label: wireSpec, value: wire === "—" ? undefined : wire},
    {label: metered && area === undefined ? "Длина рулона" : packageLabel, value: formatSpecification(format)},
    ...(showCoating ? [{label: coatingSpec, value: coating}] : []),
  ];
  const details = [
    {label: "Материал", value: "Сталь"},
    {label: "Площадь полотна", value: area === undefined ? undefined : `${formatNumber(area)} м²`},
  ];

  return <CatalogVariantLayout view={view} variant={variant}
    name={view === "table" ? meshTableValue(cell) : `Ячейка ${formatSpecification(cell)}`}
    nameNote={metered ? kind : undefined}
    tableSpecifications={[
      <span key="wire">{meshTableValue(wire)}{showCoating && <span className="mt-0.5 block text-xs text-slate-600 dark:text-slate-400">
        {coating === "Оцинкованная" ? "Оцинк." : coating}
      </span>}</span>,
      meshTableValue(format),
    ]}
    specifications={<CatalogVariantSpecifications items={fields}/>}
    details={<CatalogPositionDetails productName={variant.name} fields={details}/>}
    price={formatUnitPrice(variant.price, variant.priceUnit)}
    order={<ProductOrderControls view={view} variant={variant} showUnit={false} startEmpty wholeQuantity={requiresWholeMetalMeshQuantity(variant)}/>}/>;
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
      {values.map((option) => <option key={option} value={option}>{meshTableValue(option)}</option>)}
    </Select>
  </label>;
}

function meshOptions(values: string[]) {
  return [...new Set(values)].filter((value) => value !== "—").sort(numericCompare);
}

function numericCompare(left: string, right: string) {
  const firstDimension = (value: string) => parseFloat(value.replace(",", "."));
  return (firstDimension(left) - firstDimension(right)) || left.localeCompare(right, "ru", {numeric: true});
}
