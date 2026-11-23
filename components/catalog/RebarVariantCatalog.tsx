"use client";

import {MeasuredVariantItem} from "./MeasuredVariantItem";

import {beamProfile, beamKind, beamReferenceMassKg, beamTableNames} from "@/lib/beam";
import {vgpSize, vgpSeries} from "@/lib/vgp";
import {isProfilePipeVariant, profilePipePricePerTon, profilePipeSize} from "@/lib/profilePipe";
import {isGalvanizedElectroweldedVariant} from "@/lib/pipeFamily";
import {formatNumber} from "@/lib/numberFormat";
import {isDemonstrationProduct, storefrontAvailability} from "@/lib/catalogOffer";
import {a240SubcategoryId, a40025g2sSubcategoryId, a40035gsSubcategoryId, a500cSubcategoryId} from "@/lib/rebar";

import {FilterPanel} from "./FilterPanel";
import {CatalogVariantTable} from "./CatalogVariantLayout";
import {VariantCatalogResults} from "./VariantCatalogResults";
import {getQuantityUnit} from "@/lib/variantPresentation";
import {PriceRangeFeedback, PriceRangeInputs, useCatalogPriceRange} from "./PriceInput";
import {ResetFiltersButton} from "./ResetFiltersButton";

import {createCatalogSearchIndex} from "@/lib/search";
import {useDeferredValue, useMemo, useState} from "react";
import {CatalogStandardReference} from "./CatalogStandardReference";
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

const tableHeaders = {
  rebar: {designation: "Диаметр, мм", specifications: ["Форма", "Длина, м"]},
  profile: {designation: "Размер, мм", specifications: ["Стенка, мм", "Длина, м"]},
  beam: {designation: "Профиль", specifications: ["Стандарт", "Длина, м"]},
  pipe: {designation: "Ø × стенка, мм", specifications: ["Длина, м"]},
  vgp: {designation: "Ду × стенка, мм", specifications: [<>Наружный <span className="block whitespace-nowrap">Ø, мм</span></>, "Длина, м"]},
};

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
  const isElectrowelded = kind === "pipe";
  const isA500c = kind === "rebar" && variants.every(variant => variant.subcategoryId === a500cSubcategoryId);
  const isA240 = kind === "rebar" && variants.every(variant => variant.subcategoryId === a240SubcategoryId);
  const sortRebarLengths = isA500c || isA240;
  const isA400 = kind === "rebar" && variants.every(variant =>
    variant.subcategoryId === a40035gsSubcategoryId || variant.subcategoryId === a40025g2sSubcategoryId,
  );
  const showSizeFilter = !isVgp && !isElectrowelded;
  const isGalvanized = isElectrowelded && variants.every(isGalvanizedElectroweldedVariant);
  const showSteelGrade = isElectrowelded;
  const headers = tableHeaders[kind];
  const specifications = showSteelGrade ? [...headers.specifications, "Марка стали"] : headers.specifications;
  const electroweldedMassSource = <CatalogStandardReference>таблице 1 ГОСТ 10704-91</CatalogStandardReference>;
  const electroweldedNote = isGalvanized
    ? <>Для пересчёта используется масса стальной трубы <strong>без цинкового покрытия</strong>, приведённая в {electroweldedMassSource}.</>
    : <>Масса и стоимость заказа по длине рассчитываются по <strong>теоретической массе</strong>, приведённой в {electroweldedMassSource}.</>;
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const resultsPending = query !== deferredQuery;
  const index = useMemo(() => createCatalogSearchIndex(variants), [variants]);
  const hits = useMemo(() => index.search(deferredQuery).hits, [index, deferredQuery]);
  const [diameter, setDiameter] = useState("");
  const [form, setForm] = useState("");
  const [length, setLength] = useState("");
  const [steelGrade, setSteelGrade] = useState("");
  const priceRange = useCatalogPriceRange();
  const {minimumPrice, maximumPrice} = priceRange;
  const [availability, setAvailability] = useState("");
  const [sort, setSort] = useState<SortMode>("diameter-asc");
  useLinkedVariant(variants, variant => {
    resetFilters();
    setQuery(variant.name);
    if (isElectrowelded) setSort("relevance");
  }, resultsPending);
  const specifiedVariants = useMemo(() => variants.filter(variant => !isDemonstrationProduct(variant)), [variants]);
  const availabilityOptions = [...new Set(specifiedVariants.map(variant => storefrontAvailability(variant.availability)))];
  const steelGrades = showSteelGrade
    ? [...new Set(specifiedVariants.flatMap(variant => variant.steelGrade ? [variant.steelGrade] : []))]
      .sort((a, b) => a.localeCompare(b, "ru", {numeric: true}))
    : [];
  // Keep old SKU links and exact-name lookups available without a second catalogue on the square-pipe page.
  const lookup = deferredQuery.trim().toLocaleLowerCase("ru");
  const legacyMatch = isProfile && lookup && !diameter && !form && !length && !availability && !minimumPrice && !maximumPrice
    ? variants.find(variant => !isProfilePipeVariant(variant)
      && [variant.name, variant.sku].some(value => value.toLocaleLowerCase("ru") === lookup))
    : undefined;

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
    const priceValue = (variant: ProductVariant) => isProfile ? profilePipePricePerTon(variant) : variant.pricePerTon;
    const massValue = (variant: ProductVariant) => variant.weightPerMeterKg ?? beamReferenceMassKg(variant);
    const compareSizes = (left: ProductVariant, right: ProductVariant) => {
      const direction = sort === "diameter-desc" ? -1 : 1;
      const size = sizeValue(left).localeCompare(sizeValue(right), "ru", {numeric: true});
      if (size) return size * direction;
      if (sortRebarLengths) return (left.lengthMeters ?? Number.MAX_VALUE) - (right.lengthMeters ?? Number.MAX_VALUE);
      return isElectrowelded ? ((left.wallThicknessMm ?? 0) - (right.wallThicknessMm ?? 0)) * direction : 0;
    };
    const min = parseCatalogPrice(minimumPrice);
    const max = parseCatalogPrice(maximumPrice);
    return (deferredQuery.trim() ? hits.map(hit => hit.product) : variants).filter((variant) =>
      (!isProfile || isProfilePipeVariant(variant))
      && (!(diameter || form || length || availability || steelGrade) || !isDemonstrationProduct(variant))
      && (!diameter || sizeValue(variant) === diameter)
      && (!form || formValue(variant) === form)
      && (!length || variant.lengthMeters === Number(length) || (variant.lengthRangeMeters && Number(length) >= variant.lengthRangeMeters[0] && Number(length) <= variant.lengthRangeMeters[1]))
      && (!steelGrade || variant.steelGrade === steelGrade)
      && (!availability || storefrontAvailability(variant.availability) === availability)
      && (min === null || (priceValue(variant) !== undefined && priceValue(variant)! >= min))
      && (max === null || (priceValue(variant) !== undefined && priceValue(variant)! <= max)),
    ).sort((left, right) => {
      if (sort === "relevance") return 0;
      if (sort === "price-asc" || sort === "price-desc") return comparePrices(priceValue(left), priceValue(right), sort === "price-desc");
      if (sort === "weight-asc") return (massValue(left) ?? Infinity) - (massValue(right) ?? Infinity);
      if (sort === "weight-desc") return (massValue(right) ?? -Infinity) - (massValue(left) ?? -Infinity);
      return compareSizes(left, right);
    });
  }, [hits, deferredQuery, availability, diameter, form, length, steelGrade, maximumPrice, minimumPrice, sort, variants, sortRebarLengths, isBeam, isVgp, isProfile, isElectrowelded]);
  const activeFilters = [diameter, form, length, steelGrade, availability, minimumPrice, maximumPrice].filter(Boolean).length;
  const hasGostRebarMass = kind === "rebar" && results.some(variant => variant.specifications.some(
    spec => spec.name === "Теоретическая масса по ГОСТ 5781-82",
  ));
  const orderNote = isA500c ? <>
    Стандарт для всех позиций — <CatalogStandardReference>ГОСТ 34028-2016</CatalogStandardReference>.{" "}
    Марка стали — Ст3сп или Ст3пс, в зависимости от партии. Химический состав указан в документе о качестве.
  </>
    : isA240 ? <>Стандарт для всех позиций — <CatalogStandardReference>ГОСТ 34028-2016</CatalogStandardReference>.</>
    : isElectrowelded ? electroweldedNote
    : isBeam && results.some(variant => beamReferenceMassKg(variant) !== undefined)
      ? "Справочная масса по сортаменту используется для предварительного расчёта. Массу выбранной балки уточните у поставщика."
    : isA400 ? <>
      Номинальные диаметры и справочная масса 1 м арматуры А400 приведены в{" "}
      <CatalogStandardReference>таблице 1 ГОСТ 5781-82</CatalogStandardReference>.
      {" "}Стандарт поставки указан в документе о качестве партии.
    </>
    : hasGostRebarMass ? <>
      Теоретическая масса 1 м профиля приведена в{" "}
      <CatalogStandardReference>таблице 1 ГОСТ 5781-82</CatalogStandardReference>.
    </> : null;

  function resetFilters() {
    setQuery("");
    setDiameter("");
    setForm("");
    setLength("");
    setSteelGrade("");
    priceRange.reset();
    setAvailability("");
    setSort("diameter-asc");
  }

  return (
    <>
      <FilterPanel className="lg:col-start-2" query={query}
        activeFilters={activeFilters}
        onQueryChange={value => {setQuery(value);setSort("relevance");}} onReset={resetFilters}
        extraControls={<PriceRangeFeedback message={priceRange.message}/>}
        resultCount={{visible: legacyMatch ? 1 : results.length, total: variants.length, pending: resultsPending}}
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
          {steelGrades.length > 0 && <Filter label="Марка стали" value={steelGrade} onChange={setSteelGrade}>
            {steelGrades.map(value => <option key={value} value={value}>{value}</option>)}
          </Filter>}
          {availabilityOptions.length > 1 && <Filter label="Наличие" value={availability} onChange={setAvailability}>
            {availabilityOptions.includes("IN_STOCK") && <option value="IN_STOCK">В наличии</option>}
            {availabilityOptions.includes("ON_ORDER") && <option value="ON_ORDER">Под заказ</option>}
          </Filter>}
          <PriceRangeInputs range={priceRange} unit="тонну"/>
      </FilterPanel>

      {legacyMatch ? <VariantCatalogResults visible={[legacyMatch]} categorySlug="truby-profilnye" unit={getQuantityUnit(legacyMatch)}
        isSheetCatalog={false} hasVerifiedSpecifications={false} resultsCount={1}
        onReset={resetFilters}/> : <section className="min-w-0 lg:col-span-2" aria-label="Продукция">
      {results.length ? (
        <>
        {orderNote && <CatalogTableNote>{orderNote}</CatalogTableNote>}
        <CatalogVariantTable designation={headers.designation} specifications={specifications} unit="т" quantity="Заказ, м" secondaryQuantity="Заказ, т">
          {results.map(variant => <MeasuredVariantItem key={variant.id} variant={variant} name={names?.get(variant.id)} kind={kind} view="table" showSteelGrade={showSteelGrade}/>)}
        </CatalogVariantTable>
        <div className="grid gap-4 sm:grid-cols-2 xl:hidden">
          {results.map((variant) => (
            <MeasuredVariantItem key={variant.id} variant={variant} name={names?.get(variant.id)} kind={kind} view="card" showSteelGrade={showSteelGrade}/>
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
      </section>}
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
