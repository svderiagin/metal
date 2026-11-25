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
import {profileSheetCoatingLabel, profileSheetDimensions, type ProfileSheetVariant} from "@/lib/profileSheet";
import {ProductOrderControls} from "./ProductOrderControls";
import {FilterPanel} from "./FilterPanel";
import {PriceRangeFeedback, PriceRangeInputs, useCatalogPriceRange} from "./PriceInput";
import {ResetFiltersButton} from "./ResetFiltersButton";
import {CatalogVariantLayout, CatalogVariantSpecifications, CatalogVariantTable} from "./CatalogVariantLayout";
import {CatalogPositionDetails} from "./CatalogPositionDetails";
import {CatalogTableNote} from "./CatalogTableNote";
import {CatalogStandardReference} from "./CatalogStandardReference";
import {formatSpecification} from "./StorefrontPositionSpecifications";

type SortMode = "thickness-asc" | "thickness-desc" | "price-asc" | "price-desc";
type SharedSheetProperties = {profile?: string; width?: number; coating?: string; widthLabel: string};

function sheetSpecifications(shared: SharedSheetProperties, coating: string, dimensions: string) {
  return shared.coating ? [dimensions] : [coating, dimensions];
}

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
    coating: coatings.length === 1 ? coatings[0] : undefined,
    widthLabel: first?.profileMark === "Н75" ? "Рабочая ширина" : "Габаритная ширина",
  };
  const dimensionsHeading = shared.width !== undefined ? "Длина, м"
    : first?.profileMark === "Н75" ? "Рабочая ширина × длина, м" : "Формат, м";
  const searchIndex = useMemo(() => createCatalogSearchIndex(variants), [variants]);
  const results = useMemo(() => {
    const needle = normalizeText(query);
    const hits = needle ? new Set(searchIndex.search(query).hits.map(hit => hit.product.id)) : undefined;
    return variants.filter((variant) => {
      const searchable = normalizeText(`${variant.name} ${profileSheetCoatingLabel(variant)} ${variant.sheetSizeMeters}`);
      const hasPrice = !requiresCatalogPriceQuote(variant);
      return (!needle || searchable.includes(needle) || hits?.has(variant.id))
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
        Цвет / покрытие
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
          {shared.coating && <>Покрытие — {shared.coating === "Оцинкованный" ? "цинковое" : shared.coating}.{" "}</>}
          <CatalogStandardReference>ГОСТ 24045-2016</CatalogStandardReference> устанавливает требования для профилей с толщиной основы от 0,5 до 1,5 мм.{" "}
          {variants.some(variant => variant.wallThicknessMm < 0.5) && <>Для более тонких листов сверяйте документацию исполнения.</>}
        </CatalogTableNote>
        <CatalogVariantTable designation={shared.profile ? "Толщина, мм" : "Профиль / толщина"}
          specifications={sheetSpecifications(shared, "Цвет / покрытие", dimensionsHeading)}
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
  const size = formatSpecification(variant.sheetSizeMeters);
  const dimensions = profileSheetDimensions(variant.sheetSizeMeters);
  const length = dimensions ? formatNumber(dimensions.length) : undefined;
  const displaySize = shared.width !== undefined && length !== undefined ? length : size;
  const thickness = formatNumber(variant.wallThicknessMm);
  const specifications = [
    ...(!shared.coating ? [{label: "Цвет / покрытие", value: coating}] : []),
    {label: "Длина листа", value: length !== undefined ? `${length} м` : undefined},
    ...(shared.width === undefined && dimensions ? [{label: shared.widthLabel, value: `${formatNumber(dimensions.width)} м`}] : []),
  ];
  const fields = [
    {label: "Толщина по каталогу", value: `${thickness} мм`},
    ...specifications.filter(({label}) => label !== "Цвет / покрытие"),
    ...(variant.coatingType === "painted" ? [
      {label: "Покрытие", value: variant.specifications.find(({name}) => name === "Тип покраски")?.value ?? "Окрашенное"},
      {label: "Код RAL", value: variant.ralCode},
    ] : []),
  ];

  return <CatalogVariantLayout view={view} variant={variant}
    name={view === "table" && shared.profile ? thickness : `${variant.profileMark} · ${thickness} мм`}
    tableSpecifications={sheetSpecifications(shared, coating, displaySize)}
    specifications={<CatalogVariantSpecifications items={specifications}/>}
    details={<CatalogPositionDetails productName={variant.name} fields={fields}/>}
    price={variant.quoteOnly ? "Цена по запросу"
      : `${variant.priceQualifier === "from" ? "от " : ""}${formatUnitPrice(variant.price, variant.priceUnit)}`}
    order={<ProductOrderControls view={view} variant={variant} wholeQuantity startEmpty showUnit={false}/>}/>;
}
