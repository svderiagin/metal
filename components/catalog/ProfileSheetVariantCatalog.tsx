"use client";

import {useMemo, useState} from "react";
import {Select} from "@/components/ui/Select";
import {useLinkedVariant} from "@/hooks/useLinkedVariant";
import {comparePrices, parseCatalogPrice} from "@/lib/catalogFilters";
import {normalizeText} from "@/lib/search/russian";
import {formatUnitPrice} from "@/lib/currency";
import {formatNumber} from "@/lib/numberFormat";
import {profileSheetCoatingLabel, type ProfileSheetVariant} from "@/lib/profileSheet";
import {ProductOrderControls} from "./ProductOrderControls";
import {FilterPanel} from "./FilterPanel";
import {PriceRangeFeedback, PriceRangeInputs, useCatalogPriceRange} from "./PriceInput";
import {ResetFiltersButton} from "./ResetFiltersButton";
import {CatalogVariantLayout, CatalogVariantSpecifications, CatalogVariantTable} from "./CatalogVariantLayout";
import {CatalogPositionDetails} from "./CatalogPositionDetails";
import {CatalogTableNote} from "./CatalogTableNote";
import {formatSpecification} from "./StorefrontPositionSpecifications";

type SortMode = "thickness-asc" | "thickness-desc" | "price-asc" | "price-desc";
type SharedSheetProperties = {profile?: string; size?: string; coating?: string};

function sheetSpecifications(shared: SharedSheetProperties, coating: string, size: string) {
  if (shared.coating) return [size];
  return shared.size ? [coating] : [coating, size];
}

export function ProfileSheetVariantCatalog({variants}: {variants: ProfileSheetVariant[]}) {
  const [query, setQuery] = useState("");
  const [thickness, setThickness] = useState("");
  const [coating, setCoating] = useState("");
  const [sort, setSort] = useState<SortMode>("thickness-asc");
  const priceRange = useCatalogPriceRange();
  const minimum = parseCatalogPrice(priceRange.minimumPrice);
  const maximum = parseCatalogPrice(priceRange.maximumPrice);
  useLinkedVariant(variants, (variant) => { reset(); setQuery(variant.name); });

  const thicknesses = useMemo(() => [...new Set(variants.map((variant) => variant.wallThicknessMm))]
    .sort((left, right) => left - right), [variants]);
  const coatings = useMemo(() => [...new Set(variants.map(profileSheetCoatingLabel))]
    .sort((left, right) => left.localeCompare(right, "ru", {numeric: true})), [variants]);
  const first = variants[0];
  const shared: SharedSheetProperties = {
    profile: variants.every(p => p.profileMark === first.profileMark) ? first?.profileMark : undefined,
    size: variants.every(p => p.sheetSizeMeters === first.sheetSizeMeters) ? first?.sheetSizeMeters : undefined,
    coating: coatings.length === 1 ? coatings[0] : undefined,
  };
  const results = useMemo(() => {
    const needle = normalizeText(query);
    return variants.filter((variant) => {
      const searchable = normalizeText(`${variant.name} ${profileSheetCoatingLabel(variant)}`);
      return (!needle || searchable.includes(needle))
        && (!thickness || variant.wallThicknessMm === Number(thickness))
        && (!coating || profileSheetCoatingLabel(variant) === coating)
        && (minimum === null || (variant.price !== null && variant.price >= minimum))
        && (maximum === null || (variant.price !== null && variant.price <= maximum));
    }).sort((left, right) => {
      if (sort === "thickness-desc") return right.wallThicknessMm - left.wallThicknessMm
        || profileSheetCoatingLabel(left).localeCompare(profileSheetCoatingLabel(right), "ru", {numeric: true});
      if (sort === "price-asc" || sort === "price-desc") {
        return comparePrices(left.price, right.price, sort === "price-desc");
      }
      return left.wallThicknessMm - right.wallThicknessMm
        || profileSheetCoatingLabel(left).localeCompare(profileSheetCoatingLabel(right), "ru", {numeric: true});
    });
  }, [coating, maximum, minimum, query, sort, thickness, variants]);

  function reset() {
    setQuery("");
    setThickness("");
    setCoating("");
    setSort("thickness-asc");
    priceRange.reset();
  }

  return <>
    <FilterPanel className="lg:col-start-2" query={query}
      activeFilters={[thickness, coating, priceRange.minimumPrice, priceRange.maximumPrice].filter(Boolean).length}
      extraControls={<PriceRangeFeedback message={priceRange.message}/>}
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
        <Select value={thickness} onChange={(event) => setThickness(event.target.value)}>
          <option value="">Все значения</option>
          {thicknesses.map((value) => <option key={value} value={value}>{formatNumber(value)}</option>)}
        </Select>
      </label>
      {coatings.length > 1 && <label className="text-sm font-semibold">
        Цвет / покрытие
        <Select value={coating} onChange={(event) => setCoating(event.target.value)}>
          <option value="">Все значения</option>
          {coatings.map((value) => <option key={value} value={value}>{value}</option>)}
        </Select>
      </label>}
      <PriceRangeInputs range={priceRange} unit="штуку"/>
    </FilterPanel>

    <section className="min-w-0 lg:col-span-2" aria-label="Профнастил">
      {results.length ? <>
        {(shared.size || shared.coating) && <CatalogTableNote>
          {shared.size && <>Размер листа — {formatSpecification(shared.size)} м. </>}
          {shared.coating && <>Покрытие — {shared.coating === "Оцинкованный" ? "цинк" : shared.coating}.</>}
        </CatalogTableNote>}
        <CatalogVariantTable designation={shared.profile ? "Толщина, мм" : "Профиль / толщина"}
          specifications={sheetSpecifications(shared, "Цвет / покрытие", "Размер листа, м")}
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
  const thickness = formatNumber(variant.wallThicknessMm);
  const fields = [
    {label: "Марка профиля", value: variant.profileMark},
    {label: "Толщина, мм", value: thickness},
    {label: "Цвет / покрытие", value: coating},
    {label: "Размер листа, м", value: size},
  ];

  return <CatalogVariantLayout view={view} variant={variant}
    name={view === "table" && shared.profile ? thickness : `${variant.profileMark} · ${thickness} мм`}
    tableSpecifications={sheetSpecifications(shared, coating, size)}
    specifications={<CatalogVariantSpecifications items={fields.slice(2)}/>}
    details={<CatalogPositionDetails productName={variant.name} fields={fields}/>}
    price={formatUnitPrice(variant.price, variant.priceUnit)}
    order={<ProductOrderControls view={view} variant={variant} wholeQuantity showUnit={false}/>}/>;
}
