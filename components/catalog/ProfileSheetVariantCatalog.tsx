"use client";

import {useMemo, useState} from "react";
import {Select} from "@/components/ui/Select";
import {useLinkedVariant} from "@/hooks/useLinkedVariant";
import {comparePrices, parseCatalogPrice} from "@/lib/catalogFilters";
import {normalizeText} from "@/lib/search/russian";
import {createCatalogSearchIndex} from "@/lib/search";
import {requiresCatalogPriceQuote} from "@/lib/catalogOffer";
import {formatUnitPrice} from "@/lib/currency";
import {formatNumber} from "@/lib/numberFormat";
import {h75Reference, parseProfileSheetQuery, profileSheetCoatingLabel, profileSheetDimensions, type ProfileSheetVariant} from "@/lib/profileSheet";
import {h75StandardReferenceHref} from "@/lib/catalogStandards";
import {ProductOrderControls} from "./ProductOrderControls";
import {FilterPanel} from "./FilterPanel";
import {PriceRangeFeedback, PriceRangeInputs, useCatalogPriceRange} from "./PriceInput";
import {ResetFiltersButton} from "./ResetFiltersButton";
import {CatalogVariantLayout, CatalogVariantSpecifications, CatalogVariantTable} from "./CatalogVariantLayout";
import {CatalogPositionDetails} from "./CatalogPositionDetails";
import {CatalogTableNote} from "./CatalogTableNote";
import {CatalogStandardLink, CatalogStandardReference} from "./CatalogStandardReference";
import {formatSpecification} from "./StorefrontPositionSpecifications";

type SortMode = "thickness-asc" | "thickness-desc" | "price-asc" | "price-desc";
type SharedSheetProperties = {profile?: string; width?: number; zincCoating: boolean; widthLabel: string};
const coatingHeading = "Покрытие и цвет";
const detailSpecifications = new Set(["Площадь по габаритам", "Площадь по рабочей ширине", "Справочная масса листа"]);

export function ProfileSheetVariantCatalog({variants}: {variants: ProfileSheetVariant[]}) {
  const [query, setQuery] = useState("");
  const [thickness, setThickness] = useState("");
  const [coating, setCoating] = useState("");
  const [length, setLength] = useState("");
  const [stockOnly, setStockOnly] = useState(false);
  const [sort, setSort] = useState<SortMode>("thickness-asc");
  const priceRange = useCatalogPriceRange();
  const minimum = parseCatalogPrice(priceRange.minimumPrice);
  const maximum = parseCatalogPrice(priceRange.maximumPrice);
  useLinkedVariant(variants, (variant) => { reset(); setQuery(variant.name); });

  const thicknesses = useMemo(() => [...new Set(variants.map((variant) => variant.wallThicknessMm))]
    .sort((left, right) => left - right), [variants]);
  const coatings = useMemo(() => [...new Set(variants.map(profileSheetCoatingLabel))]
    .sort((left, right) => left.localeCompare(right, "ru", {numeric: true})), [variants]);
  const lengths = useMemo(() => [...new Set(variants.flatMap(variant => {
    const dimensions = profileSheetDimensions(variant.sheetSizeMeters);
    return dimensions ? [dimensions.length] : [];
  }))].sort((left, right) => left - right), [variants]);
  const first = variants[0];
  const firstWidth = first && profileSheetDimensions(first.sheetSizeMeters)?.width;
  const shared: SharedSheetProperties = {
    profile: variants.every(p => p.profileMark === first?.profileMark) ? first?.profileMark : undefined,
    width: variants.every(p => profileSheetDimensions(p.sheetSizeMeters)?.width === firstWidth) ? firstWidth : undefined,
    zincCoating: variants.every(p => p.coatingType === "galvanized"),
    widthLabel: first?.profileMark === "Н75" ? "Рабочая ширина" : "Габаритная ширина",
  };
  const referenceH75 = shared.profile === "Н75" && shared.width === h75Reference.workingWidthMeters;
  const dimensionsHeading = shared.width !== undefined ? "Длина, м"
    : first?.profileMark === "Н75" ? "Рабочая ширина × длина, м" : "Формат, м";
  const searchIndex = useMemo(() => createCatalogSearchIndex(variants), [variants]);
  const results = useMemo(() => {
    const needle = normalizeText(query);
    const {text, matches} = parseProfileSheetQuery(needle);
    const hits = text ? new Set(searchIndex.search(text).hits.map(hit => hit.product.id)) : undefined;
    return variants.filter((variant) => {
      const name = normalizeText(variant.name);
      const searchable = normalizeText(`${name} ${profileSheetCoatingLabel(variant)} ${variant.sheetSizeMeters}`);
      const matchesQuery = needle === name || matches(variant) && (!text || searchable.includes(text) || hits?.has(variant.id));
      const hasPrice = !requiresCatalogPriceQuote(variant);
      return matchesQuery
        && (!thickness || variant.wallThicknessMm === Number(thickness))
        && (!coating || profileSheetCoatingLabel(variant) === coating)
        && (!length || profileSheetDimensions(variant.sheetSizeMeters)?.length === Number(length))
        && (!stockOnly || variant.inStock)
        && (minimum === null || (hasPrice && variant.price! >= minimum))
        && (maximum === null || (hasPrice && variant.price! <= maximum));
    }).sort((left, right) => {
      if (sort === "price-asc" || sort === "price-desc") {
        return comparePrices(requiresCatalogPriceQuote(left) ? null : left.price,
          requiresCatalogPriceQuote(right) ? null : right.price, sort === "price-desc");
      }
      const thicknessOrder = left.wallThicknessMm - right.wallThicknessMm;
      return (sort === "thickness-desc" ? -thicknessOrder : thicknessOrder)
        || (profileSheetDimensions(left.sheetSizeMeters)?.length ?? 0) - (profileSheetDimensions(right.sheetSizeMeters)?.length ?? 0)
        || profileSheetCoatingLabel(left).localeCompare(profileSheetCoatingLabel(right), "ru", {numeric: true});
    });
  }, [coating, length, maximum, minimum, query, searchIndex, sort, stockOnly, thickness, variants]);

  function reset() {
    setQuery("");
    setThickness("");
    setCoating("");
    setLength("");
    setStockOnly(false);
    setSort("thickness-asc");
    priceRange.reset();
  }

  return <>
    <FilterPanel className="lg:col-start-2" query={query}
      queryPlaceholder={shared.zincCoating ? "Профиль, толщина или длина" : "Профиль, размер или RAL"}
      activeFilters={[thickness, coating, length, stockOnly, priceRange.minimumPrice, priceRange.maximumPrice].filter(Boolean).length}
      extraControls={<>
        {variants.some(variant => variant.inStock) && variants.some(variant => !variant.inStock) && <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-semibold">
          <input type="checkbox" checked={stockOnly} onChange={event => setStockOnly(event.target.checked)}
            className="size-5 shrink-0 accent-brand-700"/>
          Только в наличии
        </label>}
        <PriceRangeFeedback message={priceRange.message}/>
      </>}
      onQueryChange={setQuery} onReset={reset} resultCount={{visible: results.length, total: variants.length}}
      sorting={<label className="text-sm font-semibold">
        Сортировка
        <Select value={sort} onChange={(event) => setSort(event.target.value as SortMode)} className="mt-1">
          <option value="thickness-asc">Толщина: по возрастанию</option>
          <option value="thickness-desc">Толщина: по убыванию</option>
          <option value="price-asc">Цена: по возрастанию</option>
          <option value="price-desc">Цена: по убыванию</option>
        </Select>
      </label>}>
      <label className="text-sm font-semibold">
        Толщина, мм
        <Select className="mt-1" value={thickness} onChange={(event) => setThickness(event.target.value)}>
          <option value="">Все значения</option>
          {thicknesses.map((value) => <option key={value} value={value}>{formatNumber(value)}</option>)}
        </Select>
      </label>
      {coatings.length > 1 && <label className="text-sm font-semibold">
        {coatingHeading}
        <Select className="mt-1" value={coating} onChange={(event) => setCoating(event.target.value)}>
          <option value="">Все значения</option>
          {coatings.map((value) => <option key={value} value={value}>{value}</option>)}
        </Select>
      </label>}
      {lengths.length > 1 && <label className="text-sm font-semibold">
        Длина, м
        <Select className="mt-1" value={length} onChange={event => setLength(event.target.value)}>
          <option value="">Все значения</option>
          {lengths.map(value => <option key={value} value={value}>{formatNumber(value)}</option>)}
        </Select>
      </label>}
      <PriceRangeInputs range={priceRange} unit="штуку"/>
    </FilterPanel>

    <section className="min-w-0 lg:col-span-2" aria-label="Профнастил">
      {results.length ? <>
        <CatalogTableNote>
          {shared.width !== undefined && <>{shared.widthLabel} — {formatNumber(shared.width)} м.{" "}</>}
          {shared.zincCoating && <>Покрытие — цинковое.{" "}</>}
          {referenceH75 ? <>
            Высота гофры — {h75Reference.heightMm} мм, габаритная ширина — {h75Reference.overallWidthMm} мм.
            {" "}Справочные размеры и масса Н75-750 приведены в{" "}
            <CatalogStandardLink href={h75StandardReferenceHref}>приложении Б ГОСТ 24045-2016</CatalogStandardLink>.
          </> : <>
            <CatalogStandardReference>ГОСТ 24045-2016</CatalogStandardReference> указывает толщину основы от 0,5 до 1,5 мм.
            {" "}{variants.some(variant => variant.wallThicknessMm < 0.5) && <>Для более тонких листов параметры уточняют по документации изделия.</>}
          </>}
        </CatalogTableNote>
        <CatalogVariantTable designation={shared.profile ? "Толщина, мм" : "Профиль / толщина"}
          specifications={shared.zincCoating ? [dimensionsHeading] : [coatingHeading, dimensionsHeading]}
          unit="шт.">
          {results.map(variant => <ProfileSheetItem key={variant.id} variant={variant} shared={shared} view="table"/>)}
        </CatalogVariantTable>
        <div className="grid gap-4 sm:grid-cols-2 xl:hidden">
          {results.map((variant) => <ProfileSheetItem key={variant.id} variant={variant} shared={shared} view="card"/>)}
        </div>
      </> : <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 p-8 text-center">
        <strong className="text-lg">Варианты не найдены</strong>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Измените или сбросьте фильтры.</p>
        <div className="mt-4"><ResetFiltersButton onClick={reset}/></div>
      </div>}
    </section>
  </>;
}

function ProfileSheetItem({variant, shared, view}: {variant: ProfileSheetVariant; shared: SharedSheetProperties; view: "table" | "card"}) {
  const coating = profileSheetCoatingLabel(variant);
  const coatingCell = variant.coatingType === "painted" && variant.ralCode
    ? <span className="block">
      <span className="block font-medium whitespace-nowrap">RAL {variant.ralCode}</span>
      {variant.colorName && <span className="mt-0.5 block text-xs text-slate-600 dark:text-slate-300">{variant.colorName}</span>}
    </span>
    : coating;
  const size = formatSpecification(variant.sheetSizeMeters);
  const dimensions = profileSheetDimensions(variant.sheetSizeMeters);
  const length = dimensions ? formatNumber(dimensions.length) : undefined;
  const displaySize = shared.width !== undefined && length !== undefined ? length : size;
  const thickness = formatNumber(variant.wallThicknessMm);
  const dimensionsFields = [
    {label: "Длина листа", value: length !== undefined ? `${length} м` : undefined},
    ...(shared.width === undefined && dimensions ? [{label: shared.widthLabel, value: `${formatNumber(dimensions.width)} м`}] : []),
  ];
  const workingWidth = variant.profileMark === "Н75";
  const specificCoating = variant.coatingType === "painted"
    ? variant.specifications.find(({name, value}) => name === "Покрытие" && value !== "Окрашенное")
    : undefined;
  const fields = [
    {label: workingWidth ? "Рабочая ширина × длина" : "Габариты листа", value: dimensions ? `${size} м` : undefined},
    ...variant.specifications.filter(({name}) => detailSpecifications.has(name)).map(({name, value}) => ({label: name, value})),
    ...(specificCoating ? [{label: specificCoating.name, value: specificCoating.value}] : []),
  ];
  const needsSectionData = workingWidth && dimensions?.width === h75Reference.workingWidthMeters
    && !h75Reference.massPerMeter.has(variant.wallThicknessMm);

  return <CatalogVariantLayout view={view} variant={variant}
    name={view === "card" ? `Профнастил ${variant.profileMark} · ${thickness} мм` : shared.profile ? thickness : `${variant.profileMark} · ${thickness} мм`}
    tableSpecifications={shared.zincCoating ? [displaySize] : [coatingCell, displaySize]}
    specifications={<CatalogVariantSpecifications items={[
      ...(!shared.zincCoating ? [{label: coatingHeading, value: coating}] : []),
      ...dimensionsFields,
    ]}/>}
    details={fields.some(({value}) => value) && <CatalogPositionDetails productName={variant.name} fields={fields}
      note={needsSectionData ? `Для несущего настила из листа ${thickness} мм используйте характеристики сечения из документации на это исполнение. В справочной таблице Б.2 приведены значения для толщин 0,7–0,9 мм.` : undefined}/>}
    price={variant.quoteOnly ? "Цена по запросу"
      : `${variant.priceQualifier === "from" ? "от " : ""}${formatUnitPrice(variant.price, variant.priceUnit)}`}
    order={<ProductOrderControls view={view} variant={variant} wholeQuantity startEmpty showUnit={false}/>}/>;
}
