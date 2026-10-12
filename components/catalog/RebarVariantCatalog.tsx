"use client";

import filterStyles from "./FilterPanel.module.css";
import tableStyles from "./RebarTable.module.css";
import {PriceInput} from "./PriceInput";

import {createCatalogSearchIndex} from "@/lib/search";
import {useDeferredValue, useEffect, useMemo, useState} from "react";
import {CatalogImage} from "./CatalogImage";
import {ButtonLink, Button} from "@/components/ui/Button";
import {Input} from "@/components/ui/Input";
import {Select} from "@/components/ui/Select";
import {ResetFiltersButton} from "@/components/catalog/ResetFiltersButton";
import {useCart} from "@/hooks/useCart";
import {formatCurrency, formatUnitPrice} from "@/lib/currency";
import {formatNumber} from "@/lib/numberFormat";
import {
  calculateLineTotal,
  formatDecimal,
  metersToTons,
  parseNonNegativeDecimal,
  tonsToMeters,
} from "@/lib/orderMeasurement";
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
    () => uniqueNumbers(variants.map((variant) => variant.diameterMm)),
    [variants],
  );
  const lengths = useMemo(
    () => uniqueNumbers(variants.flatMap((variant) =>
      variant.lengthMeters === undefined ? [] : [variant.lengthMeters],
    )),
    [variants],
  );
  const forms = useMemo(
    () => [...new Set(variants.map((variant) => variant.form))],
    [variants],
  );

  const results = useMemo(() => {
    const min = parseOptionalNumber(minimumPrice);
    const max = parseOptionalNumber(maximumPrice);
    return (deferredQuery.trim() ? [...variants].sort((a, b) => (ranks.get(a.id) ?? Infinity) - (ranks.get(b.id) ?? Infinity)) : variants).filter((variant) =>
      (!deferredQuery.trim() || matched.has(variant.id))
      && (!diameter || variant.diameterMm === Number(diameter))
      && (!form || variant.form === form)
      && (!length || variant.lengthMeters === Number(length))
      && (!availability || variant.availability === availability)
      && (min === null || (variant.pricePerTon !== undefined && variant.pricePerTon >= min))
      && (max === null || (variant.pricePerTon !== undefined && variant.pricePerTon <= max)),
    ).sort((left, right) => {
      if (sort === "relevance") return 0;
      if (sort === "diameter-desc") return right.diameterMm - left.diameterMm;
      if (sort === "price-asc") return (left.pricePerTon ?? Infinity) - (right.pricePerTon ?? Infinity);
      if (sort === "price-desc") return (right.pricePerTon ?? -Infinity) - (left.pricePerTon ?? -Infinity);
      if (sort === "weight-asc") return left.weightPerMeterKg - right.weightPerMeterKg;
      if (sort === "weight-desc") return right.weightPerMeterKg - left.weightPerMeterKg;
      return left.diameterMm - right.diameterMm;
    });
  }, [ranks, deferredQuery, matched, availability, diameter, form, length, maximumPrice, minimumPrice, sort, variants]);
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
        <label className="mt-4 block text-sm font-semibold">Поиск вариантов<Input type="search" value={query} onChange={e => {setQuery(e.target.value);setSort("relevance");}} className="mt-1" placeholder="Арматура А500С"/></label>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Filter label="Диаметр, мм" value={diameter} onChange={setDiameter}>
            {diameters.map((value) => <option key={value} value={value}>{value}</option>)}
          </Filter>
          <Filter label="Форма продукции" value={form} onChange={setForm}>
            {forms.map((value) => (
              <option key={value} value={value}>{formLabel(value)}</option>
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
              <option value="diameter-asc">Диаметр: по возрастанию</option>
              <option value="diameter-desc">Диаметр: по убыванию</option>
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
              {tableColumns.map(column => <col key={column.label} style={{width: column.width}}/>)}
            </colgroup>
            <thead className="bg-slate-900 text-white">
              <tr>
                {tableColumns.map(({label}) => (
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
              {results.map((variant) => <RebarVariantItem key={variant.id} variant={variant} view="table"/>)}
            </tbody>
          </table>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:hidden">
          {results.map((variant) => (
            <RebarVariantItem key={variant.id} variant={variant} view="card"/>
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

function RebarVariantItem({
  variant,
  view,
}: {
  variant: RebarVariant;
  view: "table" | "card";
}) {
  const {addItem, removeItem, lines, hydrated} = useCart();
  const cartLine = lines.find((line) => line.productId === variant.id);
  const savedMeasurement = cartLine?.measurement;
  const [draft, setDraft] = useState<{meters: string; tons: string; inputMode: "meter" | "ton"} | null>(null);
  const inputMode = draft?.inputMode ?? (savedMeasurement?.inputMode ?? "meter");
  const meters = draft?.meters ?? (savedMeasurement ? formatDecimal(savedMeasurement.meters, 2) : "");
  const tons = draft?.tons ?? (savedMeasurement ? formatDecimal(savedMeasurement.weightTons, 3) : "");
  const [message, setMessage] = useState("");
  const [removed, setRemoved] = useState(false);

  useEffect(() => {
    if (!removed) return;
    const timer = window.setTimeout(() => setRemoved(false), 1000);
    return () => window.clearTimeout(timer);
  }, [removed]);

  // Calculate from the edited field, preserving precision before display rounding.
  const enteredMeters = draft === null && savedMeasurement ? savedMeasurement.meters : parseNonNegativeDecimal(meters);
  const enteredTons = draft === null && savedMeasurement ? savedMeasurement.weightTons : parseNonNegativeDecimal(tons);
  const parsedMeters = inputMode === "meter" ? enteredMeters : enteredTons === null ? null : tonsToMeters(enteredTons, variant.weightPerMeterKg);
  const parsedTons = inputMode === "ton" ? enteredTons : enteredMeters === null ? null : metersToTons(enteredMeters, variant.weightPerMeterKg);
  const pricePerTon = variant.pricePerTon;
  const needsQuote = pricePerTon === undefined || variant.quoteOnly || variant.priceQualifier === "from";
  const canPurchase = !needsQuote && (variant.inStock || (variant.imported && variant.availability === "UNKNOWN"));
  const estimatedTotal = parsedTons === null || pricePerTon === undefined || variant.quoteOnly ? null : calculateLineTotal(parsedTons, pricePerTon);
  const totalLabel = variant.quoteOnly || pricePerTon === undefined ? "По запросу" : estimatedTotal === null ? "Укажите объём" : `${variant.priceQualifier === "from" ? "от " : ""}${formatCurrency(estimatedTotal)}`;
  const totalClassName = estimatedTotal === null
    ? "text-xs font-normal text-[color-mix(in_oklab,var(--color-slate-300),var(--color-slate-400))]"
    : "font-semibold tabular-nums text-slate-900";
  const isSaved = !!savedMeasurement && !cartLine?.invalidReason && parsedTons !== null && parsedTons > 0
    && Math.abs(parsedTons - savedMeasurement.weightTons) <= Math.max(1, savedMeasurement.weightTons) * 1e-9;
  const hasChanges = !!cartLine && !isSaved;
  const enteredQuantity = inputMode === "meter" ? enteredMeters : enteredTons;
  const shouldRemove = !!cartLine && enteredQuantity === 0;
  const buttonLabel = removed ? "Удалено" : !canPurchase ? "Под заказ" : shouldRemove ? "Удалить" : isSaved ? "✓ В корзине" : hasChanges ? "Обновить" : "В корзину";
  const buttonClassName = removed ? filterStyles.removedCartButton
    : shouldRemove ? filterStyles.removeCartButton
      : isSaved ? filterStyles.savedCartButton
        : hasChanges && canPurchase ? filterStyles.updateCartButton
          : filterStyles.cartButton;
  const status = message || (hasChanges ? "Не сохранено" : "");

  function updateMeters(value: string) {
    const parsed = parseNonNegativeDecimal(value);
    if (value !== "" && parsed === null) return;
    const converted = parsed === null ? null : metersToTons(parsed, variant.weightPerMeterKg);
    setDraft({inputMode: "meter", meters: value, tons: converted === null ? "" : formatDecimal(converted, 3)});
    setMessage("");
  }

  function updateTons(value: string) {
    const parsed = parseNonNegativeDecimal(value);
    if (value !== "" && parsed === null) return;
    const converted = parsed === null ? null : tonsToMeters(parsed, variant.weightPerMeterKg);
    setDraft({inputMode: "ton", tons: value, meters: converted === null ? "" : formatDecimal(converted, 2)});
    setMessage("");
  }

  function addToCart() {
    if (!hydrated || isSaved || removed) return;
    if (shouldRemove) {
      removeItem(variant.id);
      setDraft(null);
      setMessage("");
      setRemoved(true);
      return;
    }
    if (!parsedMeters || !parsedTons) {
      setMessage("Укажите длину или вес больше нуля.");
      return;
    }
    if (!canPurchase || estimatedTotal === null || pricePerTon === undefined) return;
    addItem(
      variant.id,
      inputMode === "meter" ? parsedMeters : parsedTons,
      {
        inputMode,
        meters: parsedMeters,
        weightTons: parsedTons,
        pricePerTon,
        estimatedTotal,
      },
    );
    setDraft(null);
    setMessage("");
  }

  const actionSizeClassName = view === "card" ? "w-full" : tableStyles.tableAction;
  const action = needsQuote ? (
    <ButtonLink href={`/?product=${encodeURIComponent(variant.name)}#request`}
      className={`${filterStyles.quoteButton} ${actionSizeClassName} px-3`}>
      Запросить цену
    </ButtonLink>
  ) : (
    <Button type="button" disabled={!hydrated || isSaved || removed || (!canPurchase && !shouldRemove)} onClick={addToCart}
      className={`${buttonClassName} ${actionSizeClassName} whitespace-nowrap px-3`}>
      {shouldRemove ? "Удалить" : buttonLabel}
    </Button>
  );

  if (view === "card") {
    return (
      <article className="min-w-0 break-words rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{variant.sku}</p>
        <CatalogImage src={variant.imageUrls[0]} name={variant.name}/>
        <h3 className="mt-1 font-bold">{variant.name}</h3>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <VariantDetail label="Диаметр" value={`${formatNumber(variant.diameterMm)} мм`}/>
          <VariantDetail label="Форма" value={formLabel(variant.form)}/>
          <VariantDetail label="Марка стали" value={variant.steelGrade}/>
          <VariantDetail label="Вес" value={`${formatNumber(variant.weightPerMeterKg)} кг/м`}/>
          <VariantDetail
            label="Длина"
            value={variant.lengthMeters === undefined ? "—" : `${formatNumber(variant.lengthMeters)} м`}
          />
          <VariantDetail label="Цена" value={`${variant.priceQualifier === "from" ? "от " : ""}${formatUnitPrice(pricePerTon ?? null, "за тонну")}`}/>
        </dl>
        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
          <OrderInput
            label={`Длина заказа для ${variant.name}`}
            visibleLabel="Заказ, м"
            value={meters}
            onChange={updateMeters}
          />
          <OrderInput
            label={`Вес заказа в тоннах для ${variant.name}`}
            visibleLabel="Заказ, т"
            decimalPlaces={3}
            value={tons}
            onChange={updateTons}
          />
        </div>
        <p className="mt-4 flex items-baseline justify-between gap-3 text-sm text-slate-900">
          <span>Сумма:</span>
          <output aria-label={`Сумма заказа для ${variant.name}`} aria-live="polite" className={totalClassName}>{totalLabel}</output>
        </p>
        <div className="mt-4">{action}</div>
        <span aria-live="polite" className={`mt-1 block text-xs ${message ? "text-red-700" : "text-slate-500"}`}>{status}</span>
      </article>
    );
  }

  return (
    <tr id={`variant-${variant.id}`} title={variant.name} className="border-t border-slate-200 align-middle">
      <td className="px-2 py-4 font-bold">{formatNumber(variant.diameterMm)}</td>
      <td className="px-2 py-4">{formLabel(variant.form)}</td>
      <td className="px-2 py-4">{variant.steelGrade}</td>
      <td className="px-2 py-4 font-semibold tabular-nums">{`${variant.priceQualifier === "from" ? "от " : ""}${formatUnitPrice(pricePerTon ?? null, "за тонну")}`}</td>
      <td className="px-2 py-4">{formatNumber(variant.weightPerMeterKg)}</td>
      <td className="px-2 py-4">{variant.lengthMeters === undefined ? "—" : formatNumber(variant.lengthMeters)}</td>
      <td className="px-2 py-3">
        <OrderInput label={`Длина заказа для ${variant.name}`} value={meters} onChange={updateMeters}/>
      </td>
      <td className="px-2 py-3">
        <OrderInput label={`Вес заказа в тоннах для ${variant.name}`} value={tons} onChange={updateTons} decimalPlaces={3}/>
      </td>
      <td className={`${tableStyles.sumColumn} py-3`}>
        <output aria-label={`Сумма заказа для ${variant.name}`} aria-live="polite" className={totalClassName}>{totalLabel}</output>
      </td>
      <td className="px-2 py-3 text-center">
        {action}
        <span aria-live="polite" className={`mx-auto mt-1 block max-w-32 text-xs ${message ? "text-red-700" : "text-slate-500"}`}>{status}</span>
      </td>
    </tr>
  );
}

function OrderInput({
  decimalPlaces = 2,
  label,
  visibleLabel,
  value,
  onChange,
}: {
  label: string;
  decimalPlaces?: number;
  visibleLabel?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm font-semibold">
      {visibleLabel && <span className="mb-1 block">{visibleLabel}</span>}
      <Input aria-label={label} type="number" inputMode="decimal" min={0} step={10 ** -decimalPlaces}
        value={value} onChange={(event) => {
          const next = event.target.value;
          if (next === "" || new RegExp(`^\\d+(?:[.,]\\d{0,${decimalPlaces}})?$`).test(next)) onChange(next);
        }}
        className={`${filterStyles.field} w-full min-w-0 px-2 tabular-nums focus:placeholder:text-transparent ${visibleLabel ? "" : "text-center"}`} placeholder="0"/>
    </label>
  );
}

function VariantDetail({label, value}: {label: string; value: string}) {
  return (
    <div>
      <dt className="text-slate-500">{label}</dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
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
