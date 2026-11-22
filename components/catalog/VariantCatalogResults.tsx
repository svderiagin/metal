"use client";

import type {ProductVariant} from "@/types/product";
import {referenceCategorySlugs, referenceProfileName} from "@/lib/variantCatalog";
import {ProductOrderControls} from "./ProductOrderControls";
import {CatalogDescription} from "./CatalogDescription";
import {ChannelSpecificationNote} from "./ChannelSpecificationNote";
import {ChannelProductPreview} from "./ChannelProductPreview";
import {formatUnitPrice} from "@/lib/currency";
import {getSheetDesignation, isPlainHotRolledSheet, sheetFormatLabel} from "@/lib/sheetPresentation";
import {Button} from "@/components/ui/Button";
import {ResetFiltersButton} from "./ResetFiltersButton";
import {CatalogVariantLayout, CatalogVariantSpecifications, CatalogVariantTable, singleQuantityColumns} from "./CatalogVariantLayout";
import {isDemonstrationProduct} from "@/lib/catalogOffer";
import {CatalogPositionDetails} from "./CatalogPositionDetails";
import {CatalogGuideFigure} from "./CatalogGuideFigure";
import {formatSpecification, storefrontPositionFields} from "./StorefrontPositionSpecifications";
import type {CatalogGuideDiagram} from "@/data/catalog-description-copy";

type DimensionDiagram = Extract<CatalogGuideDiagram, {dimensions: unknown}>;
type TableSpecifications = {
  heading: string; labels: readonly [string, string]; keys: readonly [string, string];
  shape?: DimensionDiagram["shape"]; diagramKeys?: readonly string[];
};

const tableSpecs = {
  shveller: {
    heading: "Профиль", labels: ["Высота × полка", "Длина"], keys: ["Высота", "Длина по каталогу"], shape: "channel",
    diagramKeys: ["Высота", "Ширина полки", "Толщина стенки"],
  },
  ugolok: {
    heading: "Полки × толщина, мм", labels: ["Тип", "Длина"], keys: ["Тип уголка", "Длина по каталогу"], shape: "angle",
    diagramKeys: ["Размеры уголка", "Толщина полок уголка"],
  },
  kvadrat: {
    heading: "Профиль", labels: ["Сечение", "Длина"], keys: ["Сечение", "Длина по каталогу"], shape: "solid-square",
    diagramKeys: ["Сечение"],
  },
  polosa: {
    heading: "Сечение, мм", labels: ["Длина", "Масса"], keys: ["Длина по каталогу", "Теоретическая масса"], shape: "strip",
    diagramKeys: ["Ширина", "Толщина"],
  },
  shtaketnik: {
    heading: "Профиль / цвет", labels: ["Ширина × толщина", "Длина"], keys: ["Ширина", "Длина"], shape: "strip",
    diagramKeys: ["Ширина", "Толщина", "Длина"],
  },
  "listovoy-prokat": {
    heading: "Обозначение", labels: ["Толщина", "Формат"], keys: ["Толщина", sheetFormatLabel], shape: "plate",
    diagramKeys: [sheetFormatLabel, "Толщина"],
  },
  "truby-profilnye": {
    heading: "Обозначение", labels: ["Сечение", "Длина"], keys: ["Размер", "Длина поставки"],
  },
  armatura: {
    heading: "Обозначение", labels: ["Диаметр", "Длина"], keys: ["Номинальный диаметр, мм", "Длина, мм"],
  },
} satisfies Record<string, TableSpecifications>;

export function VariantCatalogResults({visible, categorySlug, isSheetCatalog, resultsCount, currentPage, pages, onPageChange, onReset}: {
  visible: ProductVariant[]; categorySlug: string; isSheetCatalog: boolean; resultsCount: number; currentPage: number; pages: number;
  onPageChange: (page: number) => void; onReset: () => void;
}) {
  const isChannel = categorySlug === "shveller";
  const hasMetreQuantities = referenceCategorySlugs.some(slug => slug === categorySlug);
  const showAvailability = !hasMetreQuantities && !isSheetCatalog;
  const presentation: TableSpecifications = isSheetCatalog ? tableSpecs["listovoy-prokat"]
    : tableSpecs[categorySlug as keyof typeof tableSpecs] ?? tableSpecs.armatura;
  const columns = singleQuantityColumns(presentation.heading, ...presentation.labels,
    hasMetreQuantities || categorySlug === "polosa" ? "Заказ, м" : "Количество");
  function renderVariant(variant: ProductVariant, view: "table" | "card") {
    const price = variant.quoteOnly ? "Цена по запросу" : `${variant.priceQualifier === "from" ? "от " : ""}${formatUnitPrice(variant.price, variant.priceUnit)}`;
    const unverified = isDemonstrationProduct(variant);
    const fields = storefrontPositionFields(variant);
    const value = (label: string) => fields.find(field => field.label === label)?.value;
    const pairedSize = (first: string, second: string) => {
      const a = value(first);
      const b = value(second);
      return a && b ? `${a.replace(/\s*мм$/u, "")} × ${b}` : a;
    };
    const angleType = value("Тип уголка");
    const values = [
      isChannel ? pairedSize("Высота", "Ширина полки")
        : categorySlug === "shtaketnik" ? pairedSize("Ширина", "Толщина")
          : categorySlug === "ugolok" && angleType ? angleType === "Равнополочный" ? "Равные полки" : "Неравные полки"
            : value(presentation.keys[0]),
      value(presentation.keys[1]),
    ];
    const tableName = isSheetCatalog ? getSheetDesignation(variant)
      : categorySlug === "polosa" ? pairedSize("Ширина", "Толщина")?.replace(/\s*мм$/u, "")
        : categorySlug === "shtaketnik" ? [value("Вид профиля штакетника"), variant.ralCode ? `RAL ${variant.ralCode}` : value("Код цвета")].filter(Boolean).join(" · ")
          : formatSpecification(referenceProfileName(variant.name, categorySlug)).replace(/^№\s+(?=\d+ ×)/u, "");
    const diagram = presentation.shape ? {
      shape: presentation.shape,
      dimensions: fields.filter(field => presentation.diagramKeys?.includes(field.label)).map(({label, value}) => [label, value] as const),
    } : undefined;
    const photo = isChannel ? <ChannelProductPreview variant={variant} compact={view === "table"}/> : undefined;
    return <CatalogVariantLayout key={variant.id} variant={variant} view={view}
      name={view === "table" ? tableName || variant.name : isPlainHotRolledSheet(variant) ? getSheetDesignation(variant) : variant.name}
      preview={photo}
      tableSpecifications={{cells: values.map((specification, index) =>
        <td key={presentation.keys[index]} className="tabular-nums">{specification ?? "—"}</td>)}}
      specifications={unverified
        ? <p className="text-sm text-slate-600 dark:text-slate-400">Характеристики требуют подтверждения перед заказом.</p>
        : <CatalogVariantSpecifications items={values.map((value, index) => ({label: presentation.labels[index], value})).filter(({value}) => value)}/>}
      details={<CatalogPositionDetails fields={fields}
        figures={diagram?.dimensions.length ? <CatalogGuideFigure diagram={diagram}/> : undefined}
        supply={unverified ? <p>Укажите в заявке нужные размеры и документы на партию.</p>
          : isChannel || hasMetreQuantities || isSheetCatalog || categorySlug === "polosa" ? undefined
            : variant.description ? <CatalogDescription description={variant.description}/> : undefined}/>}
      price={price}
      priceNote={showAvailability
        ? <div className="mt-2"><Availability availability={variant.availability}/></div> : undefined}
      order={<ProductOrderControls variant={variant} view={view}
        showUnit={!hasMetreQuantities && categorySlug !== "polosa"}/>}/>;
  }
  return (
      <section className="min-w-0 lg:col-span-2" aria-label="Продукция">
      {isChannel && <ChannelSpecificationNote/>}
      {resultsCount ? (
        <>
          <CatalogVariantTable columns={columns}>
            {visible.map(variant => renderVariant(variant, "table"))}
          </CatalogVariantTable>
          <div className="grid gap-4 sm:grid-cols-2 xl:hidden">
            {visible.map(variant => renderVariant(variant, "card"))}
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 p-8 text-center">
          <strong className="text-lg">Варианты не найдены</strong>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Измените или сбросьте фильтры.</p>
          <ResetFiltersButton onClick={onReset}/>
        </div>
      )}
      {pages > 1 && <nav aria-label="Страницы вариантов" className="mt-6 flex flex-wrap items-center justify-center gap-4"><Button variant="secondary" disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)}>Назад</Button><span>Страница {currentPage} из {pages}</span><Button variant="secondary" disabled={currentPage === pages} onClick={() => onPageChange(currentPage + 1)}>Далее</Button></nav>}
      </section>
  );
}

function Availability({availability}: {availability: ProductVariant["availability"]}) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
      availability === "UNKNOWN" ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
        : availability === "IN_STOCK" ? "bg-green-100 dark:bg-green-950/60 text-green-800 dark:text-green-300" : "bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200"
    }`}>
      {availability === "UNKNOWN" ? "Наличие уточняется" : availability === "IN_STOCK" ? "В наличии" : "Под заказ"}
    </span>
  );
}

