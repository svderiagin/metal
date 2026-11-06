"use client";

import {useMemo, useState} from "react";
import {Button} from "@/components/ui/Button";
import {Input} from "@/components/ui/Input";
import {Select} from "@/components/ui/Select";
import {useCart} from "@/hooks/useCart";
import {useLinkedVariant} from "@/hooks/useLinkedVariant";
import {comparePrices} from "@/lib/catalogFilters";
import {formatCurrency, formatUnitPrice} from "@/lib/currency";
import {
  metalMeshFormat,
  metalMeshSpecification,
  type MetalMeshVariant,
} from "@/lib/metalMesh";
import {getQuantityUnit, requiresWholeMetalMeshQuantity} from "@/lib/variantPresentation";
import {FilterPanel} from "./FilterPanel";
import {CatalogVariantLayout, CatalogVariantOrder, CatalogVariantQuantity, CatalogVariantSpecifications, CatalogVariantTable} from "./CatalogVariantLayout";
import filterStyles from "./FilterPanel.module.css";
import tableStyles from "./RebarTable.module.css";

type SortMode = "name" | "cell-asc" | "price-asc" | "price-desc";

export function MetalMeshVariantCatalog({variants}: {variants: MetalMeshVariant[]}) {
  const [query, setQuery] = useState("");
  const [cellSize, setCellSize] = useState("");
  const [wireDiameter, setWireDiameter] = useState("");
  const [format, setFormat] = useState("");
  const [sort, setSort] = useState<SortMode>("name");
  useLinkedVariant(variants, (variant) => { reset(); setQuery(variant.name); });

  const cellSizes = useMemo(() => uniqueValues(variants, "Размер ячейки"), [variants]);
  const wireDiameters = useMemo(() => uniqueValues(variants, "Диаметр проволоки"), [variants]);
  const formats = useMemo(() => [...new Set(variants.map(metalMeshFormat))]
    .filter((value) => value !== "—")
    .sort(numericCompare), [variants]);
  const results = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("ru");
    return variants.filter((variant) => {
      const cell = metalMeshSpecification(variant, "Размер ячейки");
      const wire = metalMeshSpecification(variant, "Диаметр проволоки");
      const productFormat = metalMeshFormat(variant);
      const searchable = `${variant.name} ${variant.sku} ${cell} ${wire} ${productFormat}`.toLocaleLowerCase("ru");
      return (!needle || searchable.includes(needle))
        && (!cellSize || cell === cellSize)
        && (!wireDiameter || wire === wireDiameter)
        && (!format || productFormat === format);
    }).sort((left, right) => {
      if (sort === "price-asc" || sort === "price-desc") {
        return comparePrices(left.price, right.price, sort === "price-desc");
      }
      if (sort === "cell-asc") {
        return numericCompare(
          metalMeshSpecification(left, "Размер ячейки"),
          metalMeshSpecification(right, "Размер ячейки"),
        ) || numericCompare(
          metalMeshSpecification(left, "Диаметр проволоки"),
          metalMeshSpecification(right, "Диаметр проволоки"),
        );
      }
      return left.name.localeCompare(right.name, "ru", {numeric: true});
    });
  }, [cellSize, format, query, sort, variants, wireDiameter]);

  function reset() {
    setQuery("");
    setCellSize("");
    setWireDiameter("");
    setFormat("");
    setSort("name");
  }

  return <>
    <FilterPanel className="lg:col-start-2" query={query}
      onQueryChange={setQuery} onReset={reset}
      sorting={<label className="text-sm font-semibold">
        Сортировка
        <Select value={sort} onChange={(event) => setSort(event.target.value as SortMode)} className="mt-1">
          <option value="name">По наименованию</option>
          <option value="cell-asc">По размеру ячейки</option>
          <option value="price-asc">Цена: по возрастанию</option>
          <option value="price-desc">Цена: по убыванию</option>
        </Select>
      </label>}>
      <MeshFilter label="Размер ячейки" value={cellSize} values={cellSizes} onChange={setCellSize}/>
      <MeshFilter label="Диаметр проволоки" value={wireDiameter} values={wireDiameters} onChange={setWireDiameter}/>
      <MeshFilter label="Размер рулона / карты" value={format} values={formats} onChange={setFormat}/>
    </FilterPanel>

    <section className="min-w-0 lg:col-span-2" aria-label="Сетка металлическая">
      {results.length ? <>
        <CatalogVariantTable>
          {results.map(variant => <MetalMeshItem key={variant.id} variant={variant} view="table"/>)}
        </CatalogVariantTable>
        <div className="grid gap-4 sm:grid-cols-2 xl:hidden">
          {results.map((variant) => <MetalMeshItem key={variant.id} variant={variant} view="card"/>)}
        </div>
      </> : <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 p-8 text-center">
        <strong className="text-lg">Варианты не найдены</strong>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Измените или сбросьте фильтры.</p>
      </div>}
    </section>
  </>;
}

function MetalMeshItem({variant, view}: {variant: MetalMeshVariant; view: "table" | "card"}) {
  const {addItem, updateQuantity, lines, hydrated} = useCart();
  const line = lines.find((item) => item.productId === variant.id);
  const [draft, setDraft] = useState<string | null>(null);
  const value = draft ?? String(line?.quantity ?? 1);
  const quantity = Number(value);
  const whole = requiresWholeMetalMeshQuantity(variant);
  const valid = value.trim() !== "" && Number.isFinite(quantity) && quantity > 0 && quantity <= 999
    && (!whole || Number.isInteger(quantity));
  const saved = !!line && !line.invalidReason && valid && quantity === line.quantity;
  const total = valid && variant.price !== null ? quantity * variant.price : null;
  const quantityUnit = getQuantityUnit(variant);
  const buttonClassName = saved ? filterStyles.savedCartButton
    : line ? filterStyles.updateCartButton : filterStyles.cartButton;
  const buttonLabel = saved ? "✓ В корзине" : line ? "Обновить" : "В корзину";
  const cell = metalMeshSpecification(variant, "Размер ячейки");
  const wire = metalMeshSpecification(variant, "Диаметр проволоки");
  const productFormat = metalMeshFormat(variant);

  function submit() {
    if (!hydrated || !valid || saved) return;
    if (line) updateQuantity(variant.id, quantity);
    else addItem(variant.id, quantity);
    setDraft(null);
  }

  const quantityInput = <CatalogVariantQuantity unit={quantityUnit}>
    <Input aria-label={`Количество для ${variant.name}`} type="number"
      inputMode={whole ? "numeric" : "decimal"} min={whole ? 1 : 0.1} max={999} step={whole ? 1 : 0.1}
      value={value} onChange={(event) => setDraft(event.target.value)}
      className={`${filterStyles.field} w-full min-w-0 pl-2 pr-10 text-center tabular-nums`}/>
  </CatalogVariantQuantity>;
  const totalOutput = <output aria-label={`Сумма заказа для ${variant.name}`} aria-live="polite"
    className={total === null ? "text-xs text-slate-500 dark:text-slate-400" : "font-semibold tabular-nums text-slate-900 dark:text-slate-100"}>
    {total === null ? "Укажите количество" : formatCurrency(total)}
  </output>;
  const action = <Button type="button" disabled={!hydrated || !valid || saved} onClick={submit}
    className={`${buttonClassName} ${view === "card" ? "w-full" : tableStyles.tableAction} px-3`}>
    {buttonLabel}
  </Button>;
  const error = whole ? "Введите целое количество от 1 до 999." : "Введите количество от 0,1 до 999.";

  const specifications = <CatalogVariantSpecifications items={[
    {label: "Размер ячейки", value: cell},
    {label: "Диаметр проволоки", value: wire},
    {label: "Размер рулона / карты", value: productFormat},
  ]}/>;
  const status = !valid && <p role="alert" className="text-xs text-red-700 dark:text-red-400">{error}</p>;

  return <CatalogVariantLayout view={view} variant={variant} specifications={specifications}
    price={formatUnitPrice(variant.price, variant.priceUnit)}
    order={<CatalogVariantOrder view={view} quantity={quantityInput} action={action} total={totalOutput} status={status}/>}/>;
}

function MeshFilter({label, value, values, onChange}: {
  label: string;
  value: string;
  values: string[];
  onChange: (value: string) => void;
}) {
  return <label className="text-sm font-semibold">
    {label}
    <Select value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="">Все значения</option>
      {values.map((option) => <option key={option} value={option}>{option}</option>)}
    </Select>
  </label>;
}

function uniqueValues(variants: MetalMeshVariant[], specification: string) {
  return [...new Set(variants.map((variant) => metalMeshSpecification(variant, specification)))]
    .filter((value) => value !== "—")
    .sort(numericCompare);
}

function numericCompare(left: string, right: string) {
  return left.localeCompare(right, "ru", {numeric: true});
}
