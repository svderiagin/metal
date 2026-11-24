"use client";

import type {ProductVariant} from "@/types/product";
import {referenceCategorySlugs, referenceProfileName} from "@/lib/variantCatalog";
import {ProductOrderControls} from "./ProductOrderControls";
import {CatalogDescription} from "./CatalogDescription";
import {ChannelSpecificationNote} from "./ChannelSpecificationNote";
import {CatalogTableNote} from "./CatalogTableNote";
import {ChannelProductPreview} from "./ChannelProductPreview";
import {formatUnitPrice} from "@/lib/currency";
import {getSheetDesignation, getSheetTableDesignation, isPlainHotRolledSheet, sheetFormatLabel} from "@/lib/sheetPresentation";
import {Button} from "@/components/ui/Button";
import {ResetFiltersButton} from "./ResetFiltersButton";
import {CatalogVariantLayout, CatalogVariantSpecifications, CatalogVariantTable} from "./CatalogVariantLayout";
import {isDemonstrationProduct, storefrontAvailability} from "@/lib/catalogOffer";
import {isSquareProfilePipe} from "@/lib/profilePipe";
import {CatalogPositionDetails} from "./CatalogPositionDetails";
import {formatSpecification, storefrontPositionFields} from "./StorefrontPositionSpecifications";

const unverifiedOrderNote = "Укажите в заявке нужные размеры и документы на партию.";
type TableSpecifications = {
  heading: string;
  parameters: readonly (readonly [label: string, key: string, secondDimension?: string])[];
};

const tableSpecs = {
  shveller: {
    heading: "Профиль", parameters: [["Высота × полка", "Высота", "Ширина полки"], ["Длина", "Длина по каталогу"]],
  },
  ugolok: {
    heading: "Полки × толщина, мм", parameters: [["Длина", "Длина по каталогу"]],
  },
  kvadrat: {
    heading: "Сечение, мм", parameters: [["Длина", "Длина по каталогу"]],
  },
  polosa: {
    heading: "Сечение, мм", parameters: [["Длина", "Длина по каталогу"]],
  },
  shtaketnik: {
    heading: "Цвет / окраска", parameters: [["Ширина × толщина", "Ширина", "Толщина"], ["Длина", "Длина"]],
  },
  "listovoy-prokat": {
    heading: "Толщина / исполнение", parameters: [["Формат", sheetFormatLabel]],
  },
  "truby-profilnye": {
    heading: "Обозначение", parameters: [["Сечение", "Размер"], ["Длина", "Длина поставки"]],
  },
  armatura: {
    heading: "Обозначение", parameters: [["Диаметр", "Номинальный диаметр, мм"], ["Длина", "Длина, мм"]],
  },
} satisfies Record<string, TableSpecifications>;

export function VariantCatalogResults({visible, categorySlug, unit, isSheetCatalog, hasVerifiedSpecifications, resultsCount, currentPage = 1, pages = 1, onPageChange, onReset}: {
  unit?: string;
  visible: ProductVariant[]; categorySlug: string; isSheetCatalog: boolean; hasVerifiedSpecifications: boolean; resultsCount: number; currentPage?: number; pages?: number;
  onPageChange?: (page: number) => void; onReset: () => void;
}) {
  const isChannel = categorySlug === "shveller";
  const hasUnverified = visible.some(isDemonstrationProduct);
  const hasMetreQuantities = referenceCategorySlugs.some(slug => slug === categorySlug);
  const presentation: TableSpecifications = isSheetCatalog ? tableSpecs["listovoy-prokat"]
    : tableSpecs[categorySlug as keyof typeof tableSpecs] ?? tableSpecs.armatura;
  const parameters = hasVerifiedSpecifications ? presentation.parameters : [];
  const specificationLabels = parameters.length ? parameters.map(([label]) => label) : ["Наличие"];
  function renderVariant(variant: ProductVariant, view: "table" | "card") {
    const unverified = isDemonstrationProduct(variant);
    const isUnverifiedSquarePipe = unverified && isSquareProfilePipe(variant);
    const price = variant.quoteOnly ? (isUnverifiedSquarePipe ? "По запросу" : "Цена по запросу")
      : `${variant.priceQualifier === "from" ? "от " : ""}${formatUnitPrice(variant.price, variant.priceUnit)}`;
    const fields = storefrontPositionFields(variant);
    const description = !unverified && !isChannel && !hasMetreQuantities && !isSheetCatalog && categorySlug !== "polosa"
      ? variant.description : undefined;
    const value = (label: string) => fields.find(field => field.label === label)?.value;
    const pairedSize = (first: string, second: string) => {
      const a = value(first);
      const b = value(second);
      return a && b ? `${a.replace(/\s*мм$/u, "")} × ${b}` : a;
    };
    const specifications = parameters.map(([label, key, secondDimension]) => ({
      label, value: secondDimension ? pairedSize(key, secondDimension) : value(key),
    }));
    const availability = specifications.length === 0 ? <Availability availability={variant.availability}/> : null;
    let tableName = formatSpecification(referenceProfileName(variant.name, categorySlug)).replace(/^№\s+(?=\d+ ×)/u, "");
    if (unverified && categorySlug === "truby-profilnye") {
      tableName = tableName.replace(/^Труба профильная (?:квадратная|прямоугольная)\s+(?=\d)/iu, "");
    }
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
    const photo = isChannel ? <ChannelProductPreview variant={variant} compact={view === "table"}/> : undefined;
    return <CatalogVariantLayout key={variant.id} variant={variant} view={view}
      name={view === "table" ? tableName : cardName}
      preview={photo}
      tableSpecifications={specifications.length ? specifications.map(({value}) => value ?? "—")
        : [availability]}
      specifications={isUnverifiedSquarePipe ? <CatalogVariantSpecifications items={[{label: "Характеристики", value: "Уточняются"}]}/> : unverified
        ? <p className="text-sm text-slate-600 dark:text-slate-400">Характеристики требуют подтверждения перед заказом.</p>
        : availability ?? <CatalogVariantSpecifications items={specifications}/>}
      details={(fields.length > 0 || description) && <CatalogPositionDetails productName={variant.name} fields={fields}
        note={description && <CatalogDescription description={description}/>}/>}
      price={price}
      order={<ProductOrderControls variant={variant} view={view} showUnit={!unit}/>}/>;
  }
  return (
      <section className="min-w-0 lg:col-span-2" aria-label="Продукция">
      {isChannel && <ChannelSpecificationNote/>}
      {resultsCount ? (
        <>
          {hasUnverified && <CatalogTableNote>{unverifiedOrderNote}</CatalogTableNote>}
          <CatalogVariantTable designation={presentation.heading} specifications={specificationLabels} unit={unit}>
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
      {pages > 1 && onPageChange && <nav aria-label="Страницы вариантов" className="mt-6 flex flex-wrap items-center justify-center gap-4"><Button variant="secondary" disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)}>Назад</Button><span>Страница {currentPage} из {pages}</span><Button variant="secondary" disabled={currentPage === pages} onClick={() => onPageChange(currentPage + 1)}>Далее</Button></nav>}
      </section>
  );
}

function Availability({availability}: {availability: ProductVariant["availability"]}) {
  const inStock = storefrontAvailability(availability) === "IN_STOCK";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
      inStock ? "bg-green-100 dark:bg-green-950/60 text-green-800 dark:text-green-300"
        : "bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200"
    }`}>
      {inStock ? "В наличии" : "Под заказ"}
    </span>
  );
}

