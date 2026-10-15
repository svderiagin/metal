"use client";

import {MeasuredVariantItem} from "./MeasuredVariantItem";

import {beamProfile, beamKind} from "@/lib/beam";
import {vgpSize, vgpSeries} from "@/lib/vgp";
import {hasConfirmedProfilePipePrice, profilePipeSize} from "@/lib/profilePipe";

import {FilterPanel} from "./FilterPanel";
import tableStyles from "./RebarTable.module.css";
import {PriceInput} from "./PriceInput";

import {createCatalogSearchIndex} from "@/lib/search";
import {useDeferredValue, useMemo, useState} from "react";
import {Select} from "@/components/ui/Select";
import {useLinkedVariant} from "@/hooks/useLinkedVariant";
import {comparePrices} from "@/lib/catalogFilters";
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

const rebarColumns = [
  {label: "Диаметр, мм", width: "7%"},
  {label: "Форма", width: "8%"},
  {label: "Марка стали", width: "8%"},
  {label: "Цена, ₽/т", width: "12%"},
  {label: "Масса, кг/м", width: "8%"},
  {label: "Длина, м", width: "7%"},
  {label: "Заказ, м", width: "11%"},
  {label: "Заказ, т", width: "11%"},
  {label: "Сумма", width: "15%"},
  {label: "Действие", width: "13%"},
] as const;

const beamColumns = [
  {label: "Профиль", width: "9%"},
  {label: "Тип балки", width: "10%"},
  {label: "Сталь / класс", width: "8%"},
  {label: "Цена, ₽/т", width: "12%"},
  {label: "Масса, кг/м", width: "8%"},
  {label: "Длина, м", width: "7%"},
  {label: "Заказ, м", width: "11%"},
  {label: "Заказ, т", width: "11%"},
  {label: "Сумма", width: "11%"},
  {label: "Действие", width: "13%"},
] as const;

const vgpColumns = [
  {label: "Ду × стенка, мм", width: "10%"},
  {label: "Наружный Ø, мм", width: "7%"},
  {label: "Серия", width: "10%"},
  {label: "Цена, ₽/т", width: "11%"},
  {label: "Масса, кг/м", width: "7%"},
  {label: "Длина, м", width: "6%"},
  {label: "Заказ, м", width: "11%"},
  {label: "Заказ, т", width: "12%"},
  {label: "Сумма", width: "13%"},
  {label: "Действие", width: "13%"},
] as const;

const profilePipeColumns = [
  {label: "Размер, мм", width: "11%"},
  {label: "Стенка, мм", width: "8%"},
  {label: "Цена, ₽/м", width: "12%"},
  {label: "Масса, кг/м", width: "9%"},
  {label: "Длина, м", width: "11%"},
  {label: "Кол-во, шт", width: "10%"},
  {label: "Заказ, м", width: "10%"},
  {label: "Сумма", width: "15%"},
  {label: "В корзину", width: "14%"},
] as const;

export function isMeasuredRebarVariant(variant: ProductVariant): variant is RebarVariant {
  return variant.diameterMm !== undefined
    && variant.form !== undefined
    && variant.steelGrade !== undefined
    && variant.weightPerMeterKg !== undefined;
}

export function RebarVariantCatalog({variants}: {variants: RebarVariant[]}) {
  return <MeasuredVariantCatalog variants={variants}/>;
}

export function BeamVariantCatalog({variants}: {variants: ProductVariant[]}) {
  return <MeasuredVariantCatalog variants={variants} kind="beam"/>;
}

export function VgpVariantCatalog({variants}: {variants: ProductVariant[]}) {
  return <MeasuredVariantCatalog variants={variants} kind="vgp"/>;
}

export function ProfilePipeVariantCatalog({variants}: {variants: ProductVariant[]}) {
  return <MeasuredVariantCatalog variants={variants} kind="profile"/>;
}

function MeasuredVariantCatalog({variants, kind = "rebar"}: {variants: ProductVariant[]; kind?: "rebar" | "beam" | "vgp" | "profile"}) {
  const isBeam = kind === "beam";
  const isVgp = kind === "vgp";
  const isProfile = kind === "profile";
  const columns = isProfile ? profilePipeColumns : isVgp ? vgpColumns : isBeam ? beamColumns : rebarColumns;
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const index = useMemo(() => createCatalogSearchIndex(variants), [variants]);
  const hits = useMemo(() => index.search(deferredQuery).hits, [index, deferredQuery]);
  const [diameter, setDiameter] = useState("");
  const [form, setForm] = useState("");
  const [length, setLength] = useState("");
  const [minimumPrice, setMinimumPrice] = useState("");
  const [maximumPrice, setMaximumPrice] = useState("");
  const [availability, setAvailability] = useState("");
  const [sort, setSort] = useState<SortMode>("diameter-asc");
  useLinkedVariant(variants, variant => {resetFilters(); setQuery(variant.name);});

  const diameters = useMemo(
    () => [...new Set(variants.map(variant => isProfile ? profilePipeSize(variant) : isVgp ? vgpSize(variant) : isBeam ? beamProfile(variant) : String(variant.diameterMm ?? "")))].sort((a, b) => a.localeCompare(b, "ru", {numeric: true})),
    [variants, isBeam, isVgp, isProfile],
  );
  const lengths = useMemo(
    () => uniqueNumbers(variants.flatMap((variant) =>
      variant.lengthMeters === undefined ? variant.lengthRangeMeters ?? [] : [variant.lengthMeters],
    )),
    [variants],
  );
  const forms = useMemo(
    () => {
      const values = [...new Set(variants.map(variant => isProfile ? String(variant.wallThicknessMm).replace(".", ",") : isVgp ? vgpSeries(variant) : isBeam ? beamKind(variant) : variant.form ?? ""))];
      return isProfile ? values.sort((a, b) => a.localeCompare(b, "ru", {numeric: true})) : values;
    },
    [variants, isBeam, isVgp, isProfile],
  );

  const results = useMemo(() => {
    const sizeValue = (variant: ProductVariant) => isProfile ? profilePipeSize(variant) : isVgp ? vgpSize(variant) : isBeam ? beamProfile(variant) : String(variant.diameterMm ?? "");
    const formValue = (variant: ProductVariant) => isProfile ? String(variant.wallThicknessMm).replace(".", ",") : isVgp ? vgpSeries(variant) : isBeam ? beamKind(variant) : variant.form;
    const priceValue = (variant: ProductVariant) => isProfile ? hasConfirmedProfilePipePrice(variant) ? variant.price ?? undefined : undefined : variant.pricePerTon;
    const min = parseOptionalNumber(minimumPrice);
    const max = parseOptionalNumber(maximumPrice);
    return (deferredQuery.trim() ? hits.map(hit => hit.product) : variants).filter((variant) =>
      (!diameter || sizeValue(variant) === diameter)
      && (!form || formValue(variant) === form)
      && (!length || variant.lengthMeters === Number(length) || (isProfile && variant.lengthRangeMeters && Number(length) >= variant.lengthRangeMeters[0] && Number(length) <= variant.lengthRangeMeters[1]))
      && (!availability || variant.availability === availability)
      && (min === null || (priceValue(variant) !== undefined && priceValue(variant)! >= min))
      && (max === null || (priceValue(variant) !== undefined && priceValue(variant)! <= max)),
    ).sort((left, right) => {
      if (sort === "relevance") return 0;
      if (sort === "diameter-desc") return sizeValue(right).localeCompare(sizeValue(left), "ru", {numeric: true});
      if (sort === "price-asc" || sort === "price-desc") return comparePrices(priceValue(left), priceValue(right), sort === "price-desc");
      if (sort === "weight-asc") return (left.weightPerMeterKg ?? Infinity) - (right.weightPerMeterKg ?? Infinity);
      if (sort === "weight-desc") return (right.weightPerMeterKg ?? -Infinity) - (left.weightPerMeterKg ?? -Infinity);
      return sizeValue(left).localeCompare(sizeValue(right), "ru", {numeric: true});
    });
  }, [hits, deferredQuery, availability, diameter, form, length, maximumPrice, minimumPrice, sort, variants, isBeam, isVgp, isProfile]);
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
      <FilterPanel className="lg:col-start-2" query={query}
        onQueryChange={value => {setQuery(value);setSort("relevance");}} onReset={resetFilters}
        sorting={
          <label className="text-sm font-semibold">
            Сортировка
            <Select value={sort} onChange={(event) => setSort(event.target.value as SortMode)}
              className="mt-1">
              <option value="relevance">По релевантности</option>
              <option value="diameter-asc">{isVgp || isProfile ? "Размер: по возрастанию" : isBeam ? "Профиль: по возрастанию" : "Диаметр: по возрастанию"}</option>
              <option value="diameter-desc">{isVgp || isProfile ? "Размер: по убыванию" : isBeam ? "Профиль: по убыванию" : "Диаметр: по убыванию"}</option>
              <option value="price-asc">Цена: по возрастанию</option>
              <option value="price-desc">Цена: по убыванию</option>
              <option value="weight-asc">Вес метра: по возрастанию</option>
              <option value="weight-desc">Вес метра: по убыванию</option>
            </Select>
          </label>
        }>
          <Filter label={isProfile ? "Размер, мм" : isVgp ? "Ду × стенка, мм" : isBeam ? "Профиль" : "Диаметр, мм"} value={diameter} onChange={setDiameter}>
            {diameters.map((value) => <option key={value} value={value}>{value}</option>)}
          </Filter>
          <Filter label={isProfile ? "Стенка, мм" : isVgp ? "Серия" : isBeam ? "Тип балки" : "Форма продукции"} value={form} onChange={setForm}>
            {forms.map((value) => (
              <option key={value} value={value}>{isVgp || isBeam || isProfile ? value : formLabel(value as "coil" | "bar")}</option>
            ))}
          </Filter>
          <Filter label="Длина, м" value={length} onChange={setLength}>
            {lengths.map((value) => <option key={value} value={value}>{value}</option>)}
          </Filter>
          <label className="text-sm font-semibold">
            Минимальная цена за {isProfile ? "метр" : "тонну"}
            <PriceInput type="number" min={0} value={minimumPrice}
              onChange={(event) => setMinimumPrice(event.target.value)}
               placeholder="От"/>
          </label>
          <label className="text-sm font-semibold">
            Максимальная цена за {isProfile ? "метр" : "тонну"}
            <PriceInput type="number" min={0} value={maximumPrice}
              onChange={(event) => setMaximumPrice(event.target.value)}
               placeholder="До"/>
          </label>
          <Filter label="Наличие" value={availability} onChange={setAvailability}>
            <option value="IN_STOCK">В наличии</option>
            <option value="ON_ORDER">Под заказ</option>
            {(isVgp || isProfile) && <option value="UNKNOWN">Наличие уточняется</option>}
          </Filter>
      </FilterPanel>

      <section className="min-w-0 lg:col-span-2" aria-label="Продукция">
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
