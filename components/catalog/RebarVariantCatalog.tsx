"use client";

import {MeasuredVariantItem} from "./MeasuredVariantItem";

import {beamProfile, beamKind, beamReferenceMassKg, beamTableNames} from "@/lib/beam";
import {vgpSize, vgpSeries} from "@/lib/vgp";
import {hasConfirmedProfilePipePrice, profilePipeSize} from "@/lib/profilePipe";
import {isGalvanizedElectroweldedVariant} from "@/lib/pipeFamily";
import {formatNumber} from "@/lib/numberFormat";
import {isDemonstrationProduct} from "@/lib/catalogOffer";
import {requiresWholeLengthOrder} from "@/lib/orderMeasurement";

import {FilterPanel} from "./FilterPanel";
import {CatalogVariantTable, type CatalogColumn} from "./CatalogVariantLayout";
import {PriceRangeFeedback, PriceRangeInputs, useCatalogPriceRange} from "./PriceInput";
import {ResetFiltersButton} from "./ResetFiltersButton";
import tableStyles from "./RebarTable.module.css";

import {createCatalogSearchIndex} from "@/lib/search";
import {useDeferredValue, useMemo, useState} from "react";
import {ElectroweldedMassTable} from "./PipePositionDetails";
import {CatalogStandardLink} from "./CatalogPositionDetails";
import {CatalogTableNote} from "./CatalogTableNote";
import {Select} from "@/components/ui/Select";
import {useLinkedVariant} from "@/hooks/useLinkedVariant";
import {comparePrices, parseCatalogPrice} from "@/lib/catalogFilters";
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

function tonneOrderColumns({price = 11, tons = 10, total = 14, action = 15} = {}): CatalogColumn[] {
  return [
    {label: "Цена, ₽/т", width: price},
    {label: "Заказ, м", width: 10},
    {label: "Заказ, т", width: tons},
    {label: "Сумма", width: total, className: tableStyles.sumColumn},
    {label: "Действие", width: action, visuallyHidden: true},
  ];
}

const vgpColumns = [
  {label: "Ду × стенка, мм", width: 13, className: tableStyles.sizeColumn},
  {label: "Фото", width: 13},
  {label: "Наружный", unit: "Ø, мм", width: 8, className: tableStyles.vgpDiameterColumn},
  {label: "Длина, м", width: 7.25},
  ...tonneOrderColumns({tons: 10.25, total: 13.5, action: 14}),
] as const;

function measuredColumns(designation: string, specification: string): CatalogColumn[] {
  return [
    {label: designation, width: [9, 7]},
    {label: "Фото", width: 13},
    {label: specification, width: 11},
    ...tonneOrderColumns(),
  ];
}

function rebarColumns(showSteelGrade: boolean): CatalogColumn[] {
  return [
    {label: "Диаметр, мм", width: 8, className: tableStyles.sizeColumn},
    {label: "Фото", width: 13},
    {label: "Форма", width: showSteelGrade ? 8 : 12},
    ...(showSteelGrade ? [{label: "Марка стали", width: 8}] : []),
    {label: "Длина, м", width: showSteelGrade ? 6 : 10},
    ...tonneOrderColumns({price: 11.5, total: 12.5, action: 13}),
  ];
}
const rebarSubcategoriesWithoutSteelGradeColumn = ["cat-arm-sub-2", "cat-arm-sub-3", "cat-arm-sub-4"];
const beamColumns = measuredColumns("Профиль", "Длина, м");
const electroweldedColumns = measuredColumns("Ø × стенка, мм", "Длина, м");

const profilePipeColumns = [
  {label: "Сечение × стенка, мм", width: [10, 8]},
  {label: "Фото", width: 17},
  {label: "Длина, м", width: 11},
  {label: "Цена, ₽/м", width: 12},
  {label: "Заказ, шт.", width: [7, 6]},
  {label: "Сумма", width: 14, className: tableStyles.sumColumn},
  {label: "Действие", width: 15, visuallyHidden: true},
] as const;

const columnsByKind = {
  beam: beamColumns, vgp: vgpColumns, pipe: electroweldedColumns, profile: profilePipeColumns,
} satisfies Record<string, readonly CatalogColumn[]>;

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
  const names = useMemo(() => beamTableNames(variants, {compact: true}), [variants]);
  return <MeasuredVariantCatalog variants={variants} kind="beam" names={names}/>;
}

export function VgpVariantCatalog({variants}: {variants: ProductVariant[]}) {
  return <MeasuredVariantCatalog variants={variants} kind="vgp"/>;
}

export function ElectroweldedPipeVariantCatalog({variants}: {variants: ProductVariant[]}) {
  return <MeasuredVariantCatalog variants={variants} kind="pipe"/>;
}

export function ProfilePipeVariantCatalog({variants}: {variants: ProductVariant[]}) {
  return <MeasuredVariantCatalog variants={variants} kind="profile"/>;
}

function MeasuredVariantCatalog({variants, kind = "rebar", names}: {
  variants: ProductVariant[];
  kind?: "rebar" | "beam" | "vgp" | "pipe" | "profile";
  names?: ReadonlyMap<string, string>;
}) {
  const isBeam = kind === "beam";
  const isVgp = kind === "vgp";
  const isProfile = kind === "profile";
  const showRebarSteelGrade = kind === "rebar" && !rebarSubcategoriesWithoutSteelGradeColumn.some(
    subcategoryId => variants.every(variant => variant.subcategoryId === subcategoryId),
  );
  const columns = kind === "rebar" ? rebarColumns(showRebarSteelGrade) : columnsByKind[kind];
  const isElectrowelded = kind === "pipe";
  const showSizeFilter = !isVgp && !isElectrowelded;
  const isGalvanized = isElectrowelded && variants.every(isGalvanizedElectroweldedVariant);
  const wholePipeOrderNote = <strong>Заказ округляется вверх до целых труб.</strong>;
  const electroweldedMassSource = <ElectroweldedMassTable>таблицы 1 <span className="whitespace-nowrap">ГОСТ 10704-91</span></ElectroweldedMassTable>;
  const electroweldedNote = isGalvanized
    ? <>Для пересчёта используется масса стальной трубы <strong>без цинкового покрытия</strong> из {electroweldedMassSource}. <span className="block">{wholePipeOrderNote}</span></>
    : <>Масса и стоимость заказа по длине рассчитываются по <strong>теоретической массе</strong> из {electroweldedMassSource}.</>;
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const resultsPending = query !== deferredQuery;
  const index = useMemo(() => createCatalogSearchIndex(variants), [variants]);
  const hits = useMemo(() => index.search(deferredQuery).hits, [index, deferredQuery]);
  const [diameter, setDiameter] = useState("");
  const [form, setForm] = useState("");
  const [length, setLength] = useState("");
  const priceRange = useCatalogPriceRange();
  const {minimumPrice, maximumPrice} = priceRange;
  const [availability, setAvailability] = useState("");
  const [sort, setSort] = useState<SortMode>("diameter-asc");
  useLinkedVariant(variants, variant => {resetFilters(); setQuery(variant.name);}, resultsPending);
  const specifiedVariants = useMemo(() => variants.filter(variant => !isDemonstrationProduct(variant)), [variants]);
  const availabilityOptions = [...new Set(specifiedVariants.map(variant => variant.availability))];

  const diameters = useMemo(
    () => showSizeFilter
      ? [...new Set(specifiedVariants.map(variant => isProfile ? profilePipeSize(variant) : isBeam ? beamProfile(variant) : String(variant.diameterMm ?? "")))]
        .filter(value => value && value !== "—").sort((a, b) => a.localeCompare(b, "ru", {numeric: true}))
      : [],
    [specifiedVariants, isBeam, isProfile, showSizeFilter],
  );
  const lengths = useMemo(
    () => uniqueNumbers(specifiedVariants.flatMap((variant) =>
      variant.lengthMeters === undefined ? variant.lengthRangeMeters ?? [] : [variant.lengthMeters],
    )),
    [specifiedVariants],
  );
  const forms = useMemo(
    () => {
      const values = [...new Set(specifiedVariants.map(variant => (isProfile || isElectrowelded) ? formatNumber(variant.wallThicknessMm!) : isVgp ? vgpSeries(variant) : isBeam ? beamKind(variant) : variant.form ?? ""))]
        .filter(value => value && value !== "—");
      return isProfile || isElectrowelded ? values.sort((a, b) => a.localeCompare(b, "ru", {numeric: true})) : values;
    },
    [specifiedVariants, isBeam, isVgp, isProfile, isElectrowelded],
  );

  const results = useMemo(() => {
    const sizeValue = (variant: ProductVariant) => isProfile ? profilePipeSize(variant) : isVgp ? vgpSize(variant) : isBeam ? beamProfile(variant) : String(variant.diameterMm ?? "");
    const formValue = (variant: ProductVariant) => (isProfile || isElectrowelded) ? formatNumber(variant.wallThicknessMm!) : isVgp ? vgpSeries(variant) : isBeam ? beamKind(variant) : variant.form;
    const priceValue = (variant: ProductVariant) => isProfile ? hasConfirmedProfilePipePrice(variant) ? variant.price ?? undefined : undefined : variant.pricePerTon;
    const massValue = (variant: ProductVariant) => variant.weightPerMeterKg ?? beamReferenceMassKg(variant);
    const compareSizes = (left: ProductVariant, right: ProductVariant) =>
      sizeValue(left).localeCompare(sizeValue(right), "ru", {numeric: true})
      || (isElectrowelded ? (left.wallThicknessMm ?? 0) - (right.wallThicknessMm ?? 0) : 0);
    const min = parseCatalogPrice(minimumPrice);
    const max = parseCatalogPrice(maximumPrice);
    return (deferredQuery.trim() ? hits.map(hit => hit.product) : variants).filter((variant) =>
      (!(diameter || form || length || availability) || !isDemonstrationProduct(variant))
      && (!diameter || sizeValue(variant) === diameter)
      && (!form || formValue(variant) === form)
      && (!length || variant.lengthMeters === Number(length) || (variant.lengthRangeMeters && Number(length) >= variant.lengthRangeMeters[0] && Number(length) <= variant.lengthRangeMeters[1]))
      && (!availability || variant.availability === availability)
      && (min === null || (priceValue(variant) !== undefined && priceValue(variant)! >= min))
      && (max === null || (priceValue(variant) !== undefined && priceValue(variant)! <= max)),
    ).sort((left, right) => {
      if (sort === "relevance") return 0;
      if (sort === "diameter-desc") return compareSizes(right, left);
      if (sort === "price-asc" || sort === "price-desc") return comparePrices(priceValue(left), priceValue(right), sort === "price-desc");
      if (sort === "weight-asc") return (massValue(left) ?? Infinity) - (massValue(right) ?? Infinity);
      if (sort === "weight-desc") return (massValue(right) ?? -Infinity) - (massValue(left) ?? -Infinity);
      return compareSizes(left, right);
    });
  }, [hits, deferredQuery, availability, diameter, form, length, maximumPrice, minimumPrice, sort, variants, isBeam, isVgp, isProfile, isElectrowelded]);
  const hasRebarBars = kind === "rebar" && results.some(requiresWholeLengthOrder);
  const hasGostRebarMass = kind === "rebar" && results.some(variant => variant.specifications.some(
    spec => spec.name === "Теоретическая масса по ГОСТ 5781-82",
  ));
  const orderNote = isVgp ? wholePipeOrderNote : isElectrowelded ? electroweldedNote
    : hasRebarBars || hasGostRebarMass ? <>
      {hasRebarBars && <span className="block"><strong>Заказ округляется вверх до целых прутков.</strong></span>}
      {hasGostRebarMass && <>Теоретическая масса метра приведена в <CatalogStandardLink href="https://meganorm.ru/Data1/3/3937/index.htm#i25093">таблице 1 <span className="whitespace-nowrap">ГОСТ 5781-82</span></CatalogStandardLink>.</>}
    </> : null;

  function resetFilters() {
    setQuery("");
    setDiameter("");
    setForm("");
    setLength("");
    priceRange.reset();
    setAvailability("");
    setSort("diameter-asc");
  }

  return (
    <>
      <FilterPanel className="lg:col-start-2" query={query}
        activeFilters={[diameter, form, length, availability, minimumPrice, maximumPrice].filter(Boolean).length}
        onQueryChange={value => {setQuery(value);setSort("relevance");}} onReset={resetFilters}
        extraControls={<PriceRangeFeedback message={priceRange.message}/>}
        resultCount={{visible: results.length, total: variants.length, pending: resultsPending}}
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
          {diameters.length > 0 && <Filter label={isProfile ? "Размер, мм" : isBeam ? "Профиль" : "Диаметр, мм"} value={diameter} onChange={setDiameter}>
            {diameters.map((value) => <option key={value} value={value}>{value}</option>)}
          </Filter>}
          {forms.length > 0 && <Filter label={isProfile || isElectrowelded ? "Стенка, мм" : isVgp ? "Серия" : isBeam ? "Тип балки" : "Форма продукции"} value={form} onChange={setForm}>
            {forms.map((value) => (
              <option key={value} value={value}>{isVgp || isBeam || isProfile || isElectrowelded ? value : formLabel(value as "coil" | "bar")}</option>
            ))}
          </Filter>}
          {lengths.length > 0 && <Filter label="Длина, м" value={length} onChange={setLength}>
            {lengths.map((value) => <option key={value} value={value}>{formatNumber(value)}</option>)}
          </Filter>}
          {availabilityOptions.length > 1 && <Filter label="Наличие" value={availability} onChange={setAvailability}>
            {availabilityOptions.includes("IN_STOCK") && <option value="IN_STOCK">В наличии</option>}
            {availabilityOptions.includes("ON_ORDER") && <option value="ON_ORDER">Под заказ</option>}
            {availabilityOptions.includes("UNKNOWN") && <option value="UNKNOWN">Наличие уточняется</option>}
          </Filter>}
          <PriceRangeInputs range={priceRange} unit={isProfile ? "метр" : "тонну"}/>
      </FilterPanel>

      <section className="min-w-0 lg:col-span-2" aria-label="Продукция">
      {results.length ? (
        <>
        {orderNote && <CatalogTableNote>{orderNote}</CatalogTableNote>}
        <CatalogVariantTable columns={columns}>
          {results.map(variant => <MeasuredVariantItem key={variant.id} variant={variant} name={names?.get(variant.id)} kind={kind} view="table" showRebarSteelGrade={showRebarSteelGrade}/>)}
        </CatalogVariantTable>
        <div className="grid gap-4 sm:grid-cols-2 xl:hidden">
          {results.map((variant) => (
            <MeasuredVariantItem key={variant.id} variant={variant} name={names?.get(variant.id)} kind={kind} view="card" showRebarSteelGrade={showRebarSteelGrade}/>
          ))}
        </div>
        </>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 p-8 text-center">
          <strong className="text-lg">Варианты не найдены</strong>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Измените или сбросьте фильтры.</p>
          <div className="mt-4"><ResetFiltersButton onClick={resetFilters}/></div>
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
