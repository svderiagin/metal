"use client";

import {useMemo, useState} from "react";
import {Button} from "@/components/ui/Button";
import {Input} from "@/components/ui/Input";
import {Select} from "@/components/ui/Select";
import {useCart} from "@/hooks/useCart";
import {useLinkedVariant} from "@/hooks/useLinkedVariant";
import {comparePrices} from "@/lib/catalogFilters";
import {formatCurrency, formatUnitPrice} from "@/lib/currency";
import {formatNumber} from "@/lib/numberFormat";
import {profileSheetCoatingLabel, type ProfileSheetVariant} from "@/lib/profileSheet";
import {FilterPanel} from "./FilterPanel";
import {CatalogVariantLayout, CatalogVariantOrder, CatalogVariantQuantity, CatalogVariantSpecifications, CatalogVariantTable} from "./CatalogVariantLayout";
import filterStyles from "./FilterPanel.module.css";
import tableStyles from "./RebarTable.module.css";

type SortMode = "thickness-asc" | "thickness-desc" | "price-asc" | "price-desc";

export function ProfileSheetVariantCatalog({variants}: {variants: ProfileSheetVariant[]}) {
  const [query, setQuery] = useState("");
  const [thickness, setThickness] = useState("");
  const [coating, setCoating] = useState("");
  const [sort, setSort] = useState<SortMode>("thickness-asc");
  useLinkedVariant(variants, (variant) => { reset(); setQuery(variant.name); });

  const thicknesses = useMemo(() => [...new Set(variants.map((variant) => variant.wallThicknessMm))]
    .sort((left, right) => left - right), [variants]);
  const coatings = useMemo(() => [...new Set(variants.map(profileSheetCoatingLabel))]
    .sort((left, right) => left.localeCompare(right, "ru", {numeric: true})), [variants]);
  const results = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("ru");
    return variants.filter((variant) => {
      const searchable = `${variant.name} ${variant.sku} ${profileSheetCoatingLabel(variant)}`.toLocaleLowerCase("ru");
      return (!needle || searchable.includes(needle))
        && (!thickness || variant.wallThicknessMm === Number(thickness))
        && (!coating || profileSheetCoatingLabel(variant) === coating);
    }).sort((left, right) => {
      if (sort === "thickness-desc") return right.wallThicknessMm - left.wallThicknessMm
        || profileSheetCoatingLabel(left).localeCompare(profileSheetCoatingLabel(right), "ru", {numeric: true});
      if (sort === "price-asc" || sort === "price-desc") {
        return comparePrices(left.price, right.price, sort === "price-desc");
      }
      return left.wallThicknessMm - right.wallThicknessMm
        || profileSheetCoatingLabel(left).localeCompare(profileSheetCoatingLabel(right), "ru", {numeric: true});
    });
  }, [coating, query, sort, thickness, variants]);

  function reset() {
    setQuery("");
    setThickness("");
    setCoating("");
    setSort("thickness-asc");
  }

  return <>
    <FilterPanel className="lg:col-start-2" query={query}
      onQueryChange={setQuery} onReset={reset}
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
      <label className="text-sm font-semibold">
        Цвет / покрытие
        <Select value={coating} onChange={(event) => setCoating(event.target.value)}>
          <option value="">Все значения</option>
          {coatings.map((value) => <option key={value} value={value}>{value}</option>)}
        </Select>
      </label>
    </FilterPanel>

    <section className="min-w-0 lg:col-span-2" aria-label="Профнастил">
      {results.length ? <>
        <CatalogVariantTable>
          {results.map(variant => <ProfileSheetItem key={variant.id} variant={variant} view="table"/>)}
        </CatalogVariantTable>
        <div className="grid gap-4 sm:grid-cols-2 xl:hidden">
          {results.map((variant) => <ProfileSheetItem key={variant.id} variant={variant} view="card"/>)}
        </div>
      </> : <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 p-8 text-center">
        <strong className="text-lg">Варианты не найдены</strong>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Измените или сбросьте фильтры.</p>
      </div>}
    </section>
  </>;
}

function ProfileSheetItem({variant, view}: {variant: ProfileSheetVariant; view: "table" | "card"}) {
  const {addItem, updateQuantity, lines, hydrated} = useCart();
  const line = lines.find((item) => item.productId === variant.id);
  const [draft, setDraft] = useState<string | null>(null);
  const value = draft ?? String(line?.quantity ?? 1);
  const quantity = Number(value);
  const valid = /^\d+$/.test(value) && Number.isInteger(quantity) && quantity > 0 && quantity <= 999;
  const saved = !!line && !line.invalidReason && valid && quantity === line.quantity;
  const total = valid && variant.price !== null ? quantity * variant.price : null;
  const buttonClassName = saved ? filterStyles.savedCartButton
    : line ? filterStyles.updateCartButton : filterStyles.cartButton;
  const buttonLabel = saved ? "✓ В корзине" : line ? "Обновить" : "В корзину";

  function submit() {
    if (!hydrated || !valid || saved) return;
    if (line) updateQuantity(variant.id, quantity);
    else addItem(variant.id, quantity);
    setDraft(null);
  }

  const quantityInput = <CatalogVariantQuantity unit="шт.">
    <Input aria-label={`Количество листов для ${variant.name}`} type="number" inputMode="numeric"
      min={1} max={999} step={1} value={value}
      onChange={(event) => {
        const next = event.target.value;
        if (next === "" || /^\d+$/.test(next)) setDraft(next);
      }}
      className={`${filterStyles.field} w-full min-w-0 px-7 text-center tabular-nums`} />
  </CatalogVariantQuantity>;
  const totalOutput = <output aria-label={`Сумма заказа для ${variant.name}`} aria-live="polite"
    className={total === null ? "text-xs text-slate-500 dark:text-slate-400" : "font-semibold tabular-nums text-slate-900 dark:text-slate-100"}>
    {total === null ? "Укажите количество" : formatCurrency(total)}
  </output>;
  const action = <Button type="button" disabled={!hydrated || !valid || saved} onClick={submit}
    className={`${buttonClassName} ${view === "card" ? "w-full" : tableStyles.tableAction} px-3`}>
    {buttonLabel}
  </Button>;

  const specifications = <CatalogVariantSpecifications items={[
    {label: "Толщина, мм", value: formatNumber(variant.wallThicknessMm)},
    {label: "Цвет / покрытие", value: profileSheetCoatingLabel(variant)},
    {label: "Размер листа, м", value: variant.sheetSizeMeters},
  ]}/>;
  const status = !valid && <p role="alert" className="text-xs text-red-700 dark:text-red-400">Введите целое количество от 1 до 999.</p>;

  return <CatalogVariantLayout view={view} variant={variant} specifications={specifications}
    price={formatUnitPrice(variant.price, variant.priceUnit)}
    order={<CatalogVariantOrder view={view} quantity={quantityInput} action={action} total={totalOutput} status={status}/>}/>;
}
