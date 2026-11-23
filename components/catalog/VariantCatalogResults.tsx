"use client";

import type {ProductVariant} from "@/types/product";
import {referenceCategorySlugs, referenceProfileName} from "@/lib/variantCatalog";
import {ProductOrderControls} from "./ProductOrderControls";
import {CatalogDescription} from "./CatalogDescription";
import {ChannelSpecificationNote} from "./ChannelSpecificationNote";
import {ChannelProductPreview} from "./ChannelProductPreview";
import {formatUnitPrice} from "@/lib/currency";
import {getSheetDesignation, getSheetTableDesignation, isPlainHotRolledSheet, sheetFormatLabel} from "@/lib/sheetPresentation";
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
  heading: string;
  parameters: readonly (readonly [label: string, key: string, secondDimension?: string])[];
  shape?: DimensionDiagram["shape"]; diagramKeys?: readonly string[];
};

const tableSpecs = {
  shveller: {
    heading: "Профиль", parameters: [["Высота × полка", "Высота", "Ширина полки"], ["Длина", "Длина по каталогу"]], shape: "channel",
    diagramKeys: ["Высота", "Ширина полки", "Толщина стенки"],
  },
  ugolok: {
    heading: "Полки × толщина, мм", parameters: [["Длина", "Длина по каталогу"]], shape: "angle",
    diagramKeys: ["Размеры уголка", "Толщина полок уголка"],
  },
  kvadrat: {
    heading: "Сечение, мм", parameters: [["Длина", "Длина по каталогу"]], shape: "solid-square",
    diagramKeys: ["Сечение"],
  },
  polosa: {
    heading: "Сечение, мм", parameters: [["Длина", "Длина по каталогу"]], shape: "strip",
    diagramKeys: ["Ширина", "Толщина"],
  },
  shtaketnik: {
    heading: "Цвет / окраска", parameters: [["Ширина × толщина", "Ширина", "Толщина"], ["Длина", "Длина"]], shape: "strip",
    diagramKeys: ["Ширина", "Толщина", "Длина"],
  },
  "listovoy-prokat": {
    heading: "Толщина / исполнение", parameters: [["Формат", sheetFormatLabel]], shape: "plate",
    diagramKeys: [sheetFormatLabel, "Толщина"],
  },
  "truby-profilnye": {
    heading: "Обозначение", parameters: [["Сечение", "Размер"], ["Длина", "Длина поставки"]],
  },
  armatura: {
    heading: "Обозначение", parameters: [["Диаметр", "Номинальный диаметр, мм"], ["Длина", "Длина, мм"]],
  },
} satisfies Record<string, TableSpecifications>;

export function VariantCatalogResults({visible, categorySlug, isSheetCatalog, hasVerifiedSpecifications, resultsCount, currentPage, pages, onPageChange, onReset}: {
  visible: ProductVariant[]; categorySlug: string; isSheetCatalog: boolean; hasVerifiedSpecifications: boolean; resultsCount: number; currentPage: number; pages: number;
  onPageChange: (page: number) => void; onReset: () => void;
}) {
  const isChannel = categorySlug === "shveller";
  const hasMetreQuantities = referenceCategorySlugs.some(slug => slug === categorySlug);
  const showAvailability = !hasMetreQuantities && !isSheetCatalog;
  const presentation: TableSpecifications = isSheetCatalog ? tableSpecs["listovoy-prokat"]
    : tableSpecs[categorySlug as keyof typeof tableSpecs] ?? tableSpecs.armatura;
  const parameters = hasVerifiedSpecifications ? presentation.parameters : [];
  const columns = singleQuantityColumns(presentation.heading, parameters.map(([label]) => label),
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
    const specifications = parameters.map(([label, key, secondDimension]) => ({
      label, value: secondDimension ? pairedSize(key, secondDimension) : value(key),
    }));
    let tableName = formatSpecification(referenceProfileName(variant.name, categorySlug)).replace(/^№\s+(?=\d+ ×)/u, "");
    let cardName = isPlainHotRolledSheet(variant) ? getSheetDesignation(variant) : variant.name;
    if (isSheetCatalog) tableName = getSheetTableDesignation(variant);
    const section = categorySlug === "kvadrat" ? value("Сечение") : undefined;
    if (section) {
      tableName = section.replace(/\s*мм$/u, "");
      cardName = `Квадрат стальной ${section}`;
    }
    if (categorySlug === "polosa") tableName = pairedSize("Ширина", "Толщина")?.replace(/\s*мм$/u, "") ?? tableName;
    if (categorySlug === "shtaketnik") {
      const ral = variant.ralCode ?? variant.name.match(/\bRAL\s+(\d{4})\b/iu)?.[1];
      const finish = value("Тип покраски");
      const sides = finish === "Односторонний" ? "1 сторона" : finish === "Двухсторонний" ? "2 стороны" : finish;
      const coating = [ral ? `RAL ${ral}` : value("Код цвета"), sides].filter(Boolean).join(" · ");
      if (coating) {
        tableName = coating;
        cardName = `Штакетник ${coating}`;
      }
    }
    const diagram = presentation.shape ? {
      shape: presentation.shape,
      dimensions: fields.filter(field => presentation.diagramKeys?.includes(field.label)).map(({label, value}) => [label, value] as const),
    } : undefined;
    const photo = isChannel ? <ChannelProductPreview variant={variant} compact={view === "table"}/> : undefined;
    return <CatalogVariantLayout key={variant.id} variant={variant} view={view}
      name={view === "table" ? tableName : cardName}
      preview={photo}
      tableSpecifications={{cells: specifications.map(({label, value}) =>
        <td key={label} className="tabular-nums">{value ?? "—"}</td>)}}
      specifications={unverified
        ? <p className="text-sm text-slate-600 dark:text-slate-400">Характеристики требуют подтверждения перед заказом.</p>
        : <CatalogVariantSpecifications items={specifications}/>}
      details={<CatalogPositionDetails title={variant.name} fields={fields}
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

