"use client";

import {MeasuredVariantItem} from "./MeasuredVariantItem";

import {beamProfile, beamKind} from "@/lib/beam";

import filterStyles from "./FilterPanel.module.css";
import tableStyles from "./RebarTable.module.css";
import {PriceInput} from "./PriceInput";

import {createCatalogSearchIndex} from "@/lib/search";
import {useDeferredValue, useMemo, useState} from "react";
import {Input} from "@/components/ui/Input";
import {Select} from "@/components/ui/Select";
import {ResetFiltersButton} from "@/components/catalog/ResetFiltersButton";
import type {ProductVariant} from "@/types/product";

type RebarVariant = ProductVariant & Required<Pick<
  ProductVariant,
  "diameterMm" | "form" | "steelGrade" | "weightPerMeterKg"
>>;

type SortMode =
  | "relevance"
  | "diameter-asc"
  | "diameter-desc"
  | "price-asc"
  | "price-desc"
  | "weight-asc"
  | "weight-desc";

const tableColumns = [
  {label: "Диаметр, мм", width: "7%"},
  {label: "Форма", width: "8%"},
  {label: "Марка стали", width: "8%"},
  {label: "Цена, ₽/т", width: "12%"},
  {label: "Вес, кг/м", width: "8%"},
  {label: "Длина, м", width: "7%"},
  {label: "Заказ, м", width: "11%"},
  {label: "Заказ, т", width: "11%"},
  {label: "Сумма", width: "15%"},
  {label: "Действие", width: "13%"},
] as const;

export function isMeasuredRebarVariant(variant: ProductVariant): variant is RebarVariant {
  return variant.diameterMm !== undefined
    && variant.form !== undefined
    && variant.steelGrade !== undefined
    && variant.weightPerMeterKg !== undefined;
}

export function RebarVariantCatalog({variants, simplified = false}: {variants: RebarVariant[]; simplified?: boolean}) {
  return <MeasuredVariantCatalog variants={variants} simplified={simplified}/>;
}

export function BeamVariantCatalog({variants}: {variants: ProductVariant[]}) {
  return <MeasuredVariantCatalog variants={variants} simplified kind="beam"/>;
}

function MeasuredVariantCatalog({variants, simplified = false, kind = "rebar"}: {variants: ProductVariant[]; simplified?: boolean; kind?: "rebar" | "beam"}) {
  const isBeam = kind === "beam";
  const columns = isBeam ? tableColumns.map((column, index) => index === 0 ? {...column, label: "Профиль", width: "9%"}
    : index === 1 ? {...column, label: "Тип балки", width: "10%"}
      : index === 2 ? {...column, label: "Сталь / класс"}
        : index === 8 ? {...column, width: "11%"} : column) : tableColumns;
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const index = useMemo(() => createCatalogSearchIndex(variants), [variants]);
  const matched = useMemo(() => new Set(index.search(deferredQuery).hits.map(h => h.product.id)), [index, deferredQuery]);
  const ranks = useMemo(() => new Map(index.search(deferredQuery).hits.map((h, i) => [h.product.id, i])), [index, deferredQuery]);
  const [diameter, setDiameter] = useState("");
  const [form, setForm] = useState("");
  const [length, setLength] = useState("");
  const [minimumPrice, setMinimumPrice] = useState("");
  const [maximumPrice, setMaximumPrice] = useState("");
  const [availability, setAvailability] = useState("");
  const [sort, setSort] = useState<SortMode>("diameter-asc");

  const diameters = useMemo(
    () => [...new Set(variants.map(variant => isBeam ? beamProfile(variant) : String(variant.diameterMm ?? "")))].sort((a, b) => a.localeCompare(b, "ru", {numeric: true})),
    [variants, isBeam],
  );
  const lengths = useMemo(
    () => uniqueNumbers(variants.flatMap((variant) =>
      variant.lengthMeters === undefined ? [] : [variant.lengthMeters],
    )),
    [variants],
  );
  const forms = useMemo(
    () => [...new Set(variants.map(variant => isBeam ? beamKind(variant) : variant.form ?? ""))],
    [variants, isBeam],
  );

  const results = useMemo(() => {
    const sizeValue = (variant: ProductVariant) => isBeam ? beamProfile(variant) : String(variant.diameterMm ?? "");
    const min = parseOptionalNumber(minimumPrice);
    const max = parseOptionalNumber(maximumPrice);
    return (deferredQuery.trim() ? [...variants].sort((a, b) => (ranks.get(a.id) ?? Infinity) - (ranks.get(b.id) ?? Infinity)) : variants).filter((variant) =>
      (!deferredQuery.trim() || matched.has(variant.id))
      && (!diameter || (isBeam ? beamProfile(variant) : String(variant.diameterMm ?? "")) === diameter)
      && (!form || (isBeam ? beamKind(variant) : variant.form) === form)
      && (!length || variant.lengthMeters === Number(length))
      && (!availability || variant.availability === availability)
      && (min === null || (variant.pricePerTon !== undefined && variant.pricePerTon >= min))
      && (max === null || (variant.pricePerTon !== undefined && variant.pricePerTon <= max)),
    ).sort((left, right) => {
      if (sort === "relevance") return 0;
      if (sort === "diameter-desc") return sizeValue(right).localeCompare(sizeValue(left), "ru", {numeric: true});
      if (sort === "price-asc") return (left.pricePerTon ?? Infinity) - (right.pricePerTon ?? Infinity);
      if (sort === "price-desc") return (right.pricePerTon ?? -Infinity) - (left.pricePerTon ?? -Infinity);
      if (sort === "weight-asc") return (left.weightPerMeterKg ?? Infinity) - (right.weightPerMeterKg ?? Infinity);
      if (sort === "weight-desc") return (right.weightPerMeterKg ?? -Infinity) - (left.weightPerMeterKg ?? -Infinity);
      return sizeValue(left).localeCompare(sizeValue(right), "ru", {numeric: true});
    });
  }, [ranks, deferredQuery, matched, availability, diameter, form, length, maximumPrice, minimumPrice, sort, variants, isBeam]);
  function resetFilters() {
    setQuery("");
    setDiameter("");
    setForm("");
    setLength("");
    setMinimumPrice("");
    setMaximumPrice("");
    setAvailability("");
    setSort("diameter-asc");
  }

  return (
    <>
      <div className={`${filterStyles.panel} rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:col-start-2`}>
        <h2 className="text-xl font-bold">{simplified ? "Фильтры" : "Фильтры вариантов"}</h2>
        <label className="mt-4 block text-sm font-semibold">Поиск вариантов<Input type="search" value={query} onChange={e => {setQuery(e.target.value);setSort("relevance");}} className="mt-1" placeholder={isBeam ? "Балка 25Ш1" : "Арматура А500С"}/></label>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Filter label={isBeam ? "Профиль" : "Диаметр, мм"} value={diameter} onChange={setDiameter}>
            {diameters.map((value) => <option key={value} value={value}>{value}</option>)}
          </Filter>
          <Filter label={isBeam ? "Тип балки" : "Форма продукции"} value={form} onChange={setForm}>
            {forms.map((value) => (
              <option key={value} value={value}>{isBeam ? value : formLabel(value as "coil" | "bar")}</option>
            ))}
          </Filter>
          <Filter label="Длина, м" value={length} onChange={setLength}>
            {lengths.map((value) => <option key={value} value={value}>{value}</option>)}
          </Filter>
          <label className="text-sm font-semibold">
            Минимальная цена за тонну
            <PriceInput type="number" min={0} value={minimumPrice}
              onChange={(event) => setMinimumPrice(event.target.value)}
               placeholder="От"/>
          </label>
          <label className="text-sm font-semibold">
            Максимальная цена за тонну
            <PriceInput type="number" min={0} value={maximumPrice}
              onChange={(event) => setMaximumPrice(event.target.value)}
               placeholder="До"/>
          </label>
          <Filter label="Наличие" value={availability} onChange={setAvailability}>
            <option value="IN_STOCK">В наличии</option>
            <option value="ON_ORDER">Под заказ</option>
          </Filter>
          <label className="text-sm font-semibold">
            Сортировка
            <Select value={sort} onChange={(event) => setSort(event.target.value as SortMode)}
              className="mt-1">
              <option value="relevance">По релевантности</option>
              <option value="diameter-asc">{isBeam ? "Профиль: по возрастанию" : "Диаметр: по возрастанию"}</option>
              <option value="diameter-desc">{isBeam ? "Профиль: по убыванию" : "Диаметр: по убыванию"}</option>
              <option value="price-asc">Цена: по возрастанию</option>
              <option value="price-desc">Цена: по убыванию</option>
              <option value="weight-asc">Вес метра: по возрастанию</option>
              <option value="weight-desc">Вес метра: по убыванию</option>
            </Select>
          </label>
        </div>
        <div className="mt-5">
          <ResetFiltersButton onClick={resetFilters}/>
        </div>
      </div>

      <section className="min-w-0 lg:col-span-2" aria-label={simplified ? "Продукция" : undefined} aria-labelledby={simplified ? undefined : "measured-variants-heading"}>
      {!simplified && <div className="mb-6 flex items-center justify-between gap-4">
        <h2 id="measured-variants-heading" className="text-2xl font-black">Варианты с расчётом по массе</h2>
        <p className="text-sm text-slate-600">Найдено: {results.length}</p>
      </div>}

      {results.length ? (
        <>
        <div className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm xl:block">
          <table className={`${tableStyles.table} text-center text-sm`}>
            <colgroup>
              {columns.map(column => <col key={column.label} style={{width: column.width}}/>)}
            </colgroup>
            <thead className="bg-slate-900 text-white">
              <tr>
                {columns.map(({label}) => (
                  <th
                    key={label}
                    scope="col"
                    className={`px-2 py-3 font-semibold ${label === "Сумма" ? tableStyles.sumColumn : "text-center"}`}
                  >
                    {label === "Действие" ? <span className="sr-only">{label}</span> : label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.map((variant) => <MeasuredVariantItem key={variant.id} variant={variant} kind={kind} view="table"/>)}
            </tbody>
          </table>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:hidden">
          {results.map((variant) => (
            <MeasuredVariantItem key={variant.id} variant={variant} kind={kind} view="card"/>
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

function Filter({
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
      <Select value={value} onChange={(event) => onChange(event.target.value)} className="mt-1">
        <option value="">Все значения</option>
        {children}
      </Select>
    </label>
  );
}

function formLabel(form: "coil" | "bar") {
  return form === "coil" ? "В бунтах" : "Пруток";
}

function uniqueNumbers(values: number[]) {
  return [...new Set(values)].sort((left, right) => left - right);
}

function parseOptionalNumber(value: string) {
  if (value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}
