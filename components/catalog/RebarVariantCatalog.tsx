"use client";

import {useMemo, useState} from "react";
import {Button} from "@/components/ui/Button";
import {Input} from "@/components/ui/Input";
import {Select} from "@/components/ui/Select";
import {useCart} from "@/hooks/useCart";
import {formatCurrency} from "@/lib/currency";
import {
  calculateLineTotal,
  formatDecimal,
  metersToTons,
  parseNonNegativeDecimal,
  tonsToMeters,
} from "@/lib/orderMeasurement";
import type {OrderInputMode} from "@/types/cart";
import type {ProductVariant} from "@/types/product";

type RebarVariant = ProductVariant & Required<Pick<
  ProductVariant,
  "diameterMm" | "form" | "steelGrade" | "pricePerTon" | "weightPerMeterKg"
>>;

type SortMode =
  | "diameter-asc"
  | "diameter-desc"
  | "price-asc"
  | "price-desc"
  | "weight-asc"
  | "weight-desc";

export function isMeasuredRebarVariant(variant: ProductVariant): variant is RebarVariant {
  return variant.diameterMm !== undefined
    && variant.form !== undefined
    && variant.steelGrade !== undefined
    && variant.pricePerTon !== undefined
    && variant.weightPerMeterKg !== undefined;
}

export function RebarVariantCatalog({variants}: {variants: RebarVariant[]}) {
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
    return variants.filter((variant) =>
      (!diameter || variant.diameterMm === Number(diameter))
      && (!form || variant.form === form)
      && (!length || variant.lengthMeters === Number(length))
      && (!availability || variant.availability === availability)
      && (min === null || variant.pricePerTon >= min)
      && (max === null || variant.pricePerTon <= max),
    ).sort((left, right) => {
      if (sort === "diameter-desc") return right.diameterMm - left.diameterMm;
      if (sort === "price-asc") return left.pricePerTon - right.pricePerTon;
      if (sort === "price-desc") return right.pricePerTon - left.pricePerTon;
      if (sort === "weight-asc") return left.weightPerMeterKg - right.weightPerMeterKg;
      if (sort === "weight-desc") return right.weightPerMeterKg - left.weightPerMeterKg;
      return left.diameterMm - right.diameterMm;
    });
  }, [availability, diameter, form, length, maximumPrice, minimumPrice, sort, variants]);

  function resetFilters() {
    setDiameter("");
    setForm("");
    setLength("");
    setMinimumPrice("");
    setMaximumPrice("");
    setAvailability("");
    setSort("diameter-asc");
  }

  return (
    <section className="mt-8" aria-labelledby="variants-heading">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-xl font-bold">Фильтры вариантов</h2>
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
            <Input type="number" min={0} value={minimumPrice}
              onChange={(event) => setMinimumPrice(event.target.value)}
              className="mt-1" placeholder="От"/>
          </label>
          <label className="text-sm font-semibold">
            Максимальная цена за тонну
            <Input type="number" min={0} value={maximumPrice}
              onChange={(event) => setMaximumPrice(event.target.value)}
              className="mt-1" placeholder="До"/>
          </label>
          <Filter label="Наличие" value={availability} onChange={setAvailability}>
            <option value="IN_STOCK">В наличии</option>
            <option value="ON_ORDER">Под заказ</option>
          </Filter>
          <label className="text-sm font-semibold sm:col-span-2 xl:col-span-3">
            Сортировка
            <Select value={sort} onChange={(event) => setSort(event.target.value as SortMode)}
              className="mt-1 sm:max-w-sm">
              <option value="diameter-asc">Диаметр: по возрастанию</option>
              <option value="diameter-desc">Диаметр: по убыванию</option>
              <option value="price-asc">Цена: по возрастанию</option>
              <option value="price-desc">Цена: по убыванию</option>
              <option value="weight-asc">Вес метра: по возрастанию</option>
              <option value="weight-desc">Вес метра: по убыванию</option>
            </Select>
          </label>
        </div>
        <button type="button" onClick={resetFilters}
          className="mt-5 min-h-11 text-sm font-semibold text-red-700 underline underline-offset-2">
          Сбросить фильтры
        </button>
      </div>

      <div className="my-6 flex items-center justify-between gap-4">
        <h2 id="variants-heading" className="text-2xl font-black">Варианты продукции</h2>
        <p className="text-sm text-slate-600">Найдено: {results.length}</p>
      </div>

      {results.length ? (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-slate-900 text-white">
              <tr>
                {[
                  "Диаметр, мм", "Форма продукции", "Марка стали", "Цена за тонну",
                  "Вес метра, кг", "Длина, м", "Длина заказа, м", "Вес заказа, т",
                ].map((label) => (
                  <th
                    key={label}
                    className={`py-3 font-semibold ${
                      label === "Длина заказа, м" || label === "Вес заказа, т"
                        ? "w-24 px-2"
                        : "px-3"
                    }`}
                  >
                    {label}
                  </th>
                ))}
                <th className="px-3 py-3"><span className="sr-only">Действие</span></th>
              </tr>
            </thead>
            <tbody>
              {results.map((variant) => <RebarVariantRow key={variant.id} variant={variant}/>)}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <strong className="text-lg">Варианты не найдены</strong>
          <p className="mt-2 text-sm text-slate-600">Измените или сбросьте фильтры.</p>
        </div>
      )}
    </section>
  );
}

function RebarVariantRow({variant}: {variant: RebarVariant}) {
  const {addItem} = useCart();
  const [meters, setMeters] = useState("");
  const [tons, setTons] = useState("");
  const [inputMode, setInputMode] = useState<OrderInputMode>("meter");
  const [message, setMessage] = useState("");

  function updateMeters(value: string) {
    const parsed = parseNonNegativeDecimal(value);
    if (value !== "" && parsed === null) return;
    setInputMode("meter");
    setMeters(value);
    const converted = parsed === null ? null : metersToTons(parsed, variant.weightPerMeterKg);
    setTons(converted === null ? "" : formatDecimal(converted, 3));
    setMessage("");
  }

  function updateTons(value: string) {
    const parsed = parseNonNegativeDecimal(value);
    if (value !== "" && parsed === null) return;
    setInputMode("ton");
    setTons(value);
    const converted = parsed === null ? null : tonsToMeters(parsed, variant.weightPerMeterKg);
    setMeters(converted === null ? "" : formatDecimal(converted, 2));
    setMessage("");
  }

  function addToCart() {
    const parsedMeters = parseNonNegativeDecimal(meters);
    const parsedTons = parseNonNegativeDecimal(tons);
    if (!parsedMeters || !parsedTons) {
      setMessage("Укажите длину или вес больше нуля.");
      return;
    }
    const estimatedTotal = calculateLineTotal(parsedTons, variant.pricePerTon);
    if (estimatedTotal === null) return;
    addItem(
      variant.id,
      inputMode === "meter" ? parsedMeters : parsedTons,
      {
        inputMode,
        meters: parsedMeters,
        weightTons: parsedTons,
        pricePerTon: variant.pricePerTon,
        estimatedTotal,
      },
    );
    setMessage("Добавлено");
  }

  return (
    <tr id={`variant-${variant.id}`} className="border-t border-slate-200 align-top">
      <td className="px-3 py-4 font-bold">{variant.diameterMm}</td>
      <td className="px-3 py-4">{formLabel(variant.form)}</td>
      <td className="px-3 py-4">{variant.steelGrade}</td>
      <td className="px-3 py-4 font-semibold">{formatCurrency(variant.pricePerTon)}</td>
      <td className="px-3 py-4">{formatDecimal(variant.weightPerMeterKg, 3)}</td>
      <td className="px-3 py-4">{variant.lengthMeters ?? "—"}</td>
      <td className="px-2 py-3">
        <OrderInput label={`Длина заказа для ${variant.name}`} value={meters} onChange={updateMeters}/>
      </td>
      <td className="px-2 py-3">
        <OrderInput label={`Вес заказа для ${variant.name}`} value={tons} onChange={updateTons}/>
      </td>
      <td className="px-3 py-3">
        <Button type="button" disabled={!variant.inStock} onClick={addToCart}
          className="whitespace-nowrap">
          {variant.inStock ? "В корзину" : "Под заказ"}
        </Button>
        <span aria-live="polite" className={`mt-1 block max-w-32 text-xs ${
          message === "Добавлено" ? "text-green-700" : "text-red-700"
        }`}>{message}</span>
      </td>
    </tr>
  );
}

function OrderInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Input aria-label={label} type="number" inputMode="decimal" min={0} step="any"
      value={value} onChange={(event) => onChange(event.target.value)}
      className="w-24" placeholder="0"/>
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
