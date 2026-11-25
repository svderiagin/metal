"use client";

import type {ReactNode} from "react";
import type {ProductVariant} from "@/types/product";
import {referenceCategorySlugs, referenceProfileName} from "@/lib/variantCatalog";
import {ProductOrderControls} from "./ProductOrderControls";
import {MeterPricedOrderControls} from "./MeasuredVariantItem";
import {CatalogDescription} from "./CatalogDescription";
import {CatalogTableNote} from "./CatalogTableNote";
import {formatUnitPrice} from "@/lib/currency";
import {getSheetParameters, getSheetTableDesignation, getTreadPlateExecution, hotRolledSheetSupply, hotRolledSheetTitle, isColdRolledSheet, isGalvanizedSheet, isPlainHotRolledSheet, isTreadPlate, sheetFormatLabel, treadPlateStandard, treadPlateTitle} from "@/lib/sheetPresentation";
import {hasSheetOrderMass} from "@/lib/sheetOrder";
import {Button} from "@/components/ui/Button";
import {ResetFiltersButton} from "./ResetFiltersButton";
import {CatalogVariantLayout, CatalogVariantSpecifications, CatalogVariantTable} from "./CatalogVariantLayout";
import {isDemonstrationProduct, storefrontAvailability} from "@/lib/catalogOffer";
import {isSquareProfilePipe} from "@/lib/profilePipe";
import {CatalogPositionDetails} from "./CatalogPositionDetails";
import {CatalogStandardReference} from "./CatalogStandardReference";
import {formatSpecification, storefrontPositionFields} from "./StorefrontPositionSpecifications";
import {getVariantAttribute} from "@/lib/variantPresentation";

const unverifiedOrderNote = "Укажите в заявке нужные размеры и документы на партию.";
const picketColumnWidths = [11, 13, 9.5, 10.5, 7, 12.5, 11.5, 12, 13] as const;
type TableSpecifications = {
  heading: string;
  parameters: readonly (readonly [label: string, key: string])[];
};

const tableSpecs = {
  ugolok: {
    heading: "Полки × толщина, мм", parameters: [["Тип", "Тип уголка"], ["Длина", "Длина по каталогу"]],
  },
  kvadrat: {
    heading: "Сечение, мм", parameters: [["Длина", "Длина по каталогу"]],
  },
  polosa: {
    heading: "Ширина × толщина, мм", parameters: [["Длина", "Длина по каталогу"]],
  },
  shtaketnik: {
    heading: "Ширина × толщина, мм", parameters: [["Длина", "Длина"]],
  },
  "listovoy-prokat": {
    heading: "Толщина / исполнение", parameters: [["Формат", sheetFormatLabel]],
  },
  pieceSheet: {
    heading: "Толщина, мм", parameters: [["Формат", sheetFormatLabel]],
  },
  "truby-profilnye": {
    heading: "Обозначение", parameters: [["Сечение", "Размер"], ["Длина", "Длина поставки"]],
  },
  armatura: {
    heading: "Обозначение", parameters: [["Диаметр", "Номинальный диаметр, мм"], ["Длина", "Длина, мм"]],
  },
} satisfies Record<string, TableSpecifications>;

export function VariantCatalogResults({visible, categorySlug, unit, isSheetCatalog, hasMeasuredOrder, hasVerifiedSpecifications, resultsCount, currentPage = 1, pages = 1, onPageChange, onReset}: {
  unit?: string;
  visible: ProductVariant[]; categorySlug: string; isSheetCatalog: boolean; hasMeasuredOrder: boolean; hasVerifiedSpecifications: boolean; resultsCount: number; currentPage?: number; pages?: number;
  onPageChange?: (page: number) => void; onReset: () => void;
}) {
  const hasUnverified = visible.some(isDemonstrationProduct);
  const hasMetreQuantities = referenceCategorySlugs.some(slug => slug === categorySlug);
  const isAngle = categorySlug === "ugolok";
  const isSquare = categorySlug === "kvadrat";
  const isFlatSteel = categorySlug === "polosa";
  const isPicket = categorySlug === "shtaketnik";
  const quantityColSpan = isPicket ? 1 : undefined;
  const pieceSheetTitle = visible.length === 0 ? undefined
    : visible.every(isGalvanizedSheet) ? "Лист оцинкованный"
    : visible.every(isColdRolledSheet) ? "Лист холоднокатаный" : undefined;
  const isPieceSheetCatalog = pieceSheetTitle !== undefined;
  const isTreadPlateCatalog = isSheetCatalog && visible.every(isTreadPlate);
  const isHotRolledSheetCatalog = isSheetCatalog && visible.every(isPlainHotRolledSheet);
  const hasSheetOrder = isSheetCatalog && visible.length > 0 && visible.every(variant => variant.sheetOrder);
  const hasSheetMassOrder = hasSheetOrder && visible.some(variant => hasSheetOrderMass(variant.sheetOrder));
  const presentation: TableSpecifications = isPieceSheetCatalog || isTreadPlateCatalog || isHotRolledSheetCatalog ? tableSpecs.pieceSheet
    : isSheetCatalog ? tableSpecs["listovoy-prokat"]
    : tableSpecs[categorySlug as keyof typeof tableSpecs] ?? tableSpecs.armatura;
  const parameters = hasVerifiedSpecifications ? presentation.parameters : [];
  const specificationLabels = parameters.length
    ? parameters.map(([label]) => label === "Длина" && (hasMeasuredOrder || isPicket) ? "Длина, м" : label)
    : ["Наличие"];
  function renderVariant(variant: ProductVariant, view: "table" | "card") {
    const unverified = isDemonstrationProduct(variant);
    const isUnverifiedSquarePipe = unverified && isSquareProfilePipe(variant);
    const price = variant.quoteOnly ? (isUnverifiedSquarePipe ? "По запросу" : "Цена по запросу")
      : `${variant.priceQualifier === "from" ? "от " : ""}${formatUnitPrice(variant.price, variant.priceUnit)}`;
    const fields = storefrontPositionFields(variant);
    const detailFields = isFlatSteel
      ? fields.filter(({label}) => !["Ширина", "Толщина", "Длина по каталогу", "Стандарт"].includes(label))
      : fields;
    const description = !unverified && !hasMetreQuantities && !isSheetCatalog && !isFlatSteel
      ? variant.description : undefined;
    const value = (label: string) => fields.find(field => field.label === label)?.value;
    const pairedSize = (first: string, second: string) => {
      const a = value(first);
      const b = value(second);
      return a && b ? `${a.replace(/\s*мм$/u, "")} × ${b}` : a;
    };
    const specifications = parameters.map(([label, key]) => ({label, value: value(key)}));
    const availability = specifications.length === 0 ? <Availability availability={variant.availability}/> : null;
    const tableValues: ReactNode[] = specifications.length ? specifications.map(({label, value}) =>
      (label === "Длина" && (hasMeasuredOrder || isPicket) ? value?.replace(/\s*мм?$/u, "") : value) ?? "—")
      : [availability];
    let tableName = formatSpecification(referenceProfileName(variant.name, categorySlug)).replace(/^№\s+(?=\d+ ×)/u, "");
    if (unverified && categorySlug === "truby-profilnye") {
      tableName = tableName.replace(/^Труба профильная (?:квадратная|прямоугольная)\s+(?=\d)/iu, "");
    }
    let cardName = variant.name;
    if (isSheetCatalog) tableName = getSheetTableDesignation(variant);
    const sheetTitle = isTreadPlate(variant) ? treadPlateTitle
      : isPlainHotRolledSheet(variant) ? hotRolledSheetTitle : pieceSheetTitle;
    if (sheetTitle) {
      const sheet = getSheetParameters(variant);
      if (sheet) {
        tableName = sheet.thickness;
        cardName = `${sheetTitle} ${sheet.thickness} мм`;
      }
    }
    const angleSize = isAngle && !unverified ? variant.attributes.find(({key}) => key === "size")?.value : undefined;
    if (angleSize) {
      const size = formatSpecification(angleSize);
      tableName = size.replace(/\s+мм$/u, "");
      cardName = `Уголок стальной ${size}`;
    }
    const section = isSquare ? value("Сечение") : undefined;
    if (section) {
      tableName = section.replace(/\s*мм$/u, "");
      cardName = `Квадрат стальной ${section}`;
    }
    if (isFlatSteel) tableName = pairedSize("Ширина", "Толщина")?.replace(/\s*мм$/u, "") ?? tableName;
    if (isPicket) {
      const size = pairedSize("Ширина", "Толщина");
      const profile = getVariantAttribute(variant, "picketProfile");
      const color = `RAL ${getVariantAttribute(variant, "picketColor")}`;
      const paint = getVariantAttribute(variant, "picketPaint");
      tableName = size?.replace(/\s*мм$/u, "") ?? "—";
      cardName = `Штакетник ${profile === "Полукруглый" ? "полукруглый" : profile}`;
      tableValues.unshift(<span className="block whitespace-nowrap">
        <span className="font-medium">{color}</span>{" "}
        <span className="mt-0.5 block text-xs text-slate-600 dark:text-slate-300">{paint}</span>
      </span>, profile);
      specifications.unshift({label: "Цвет", value: `${color} · ${paint}`}, {label: "Ширина × толщина", value: size});
    }
    return <CatalogVariantLayout key={variant.id} variant={variant} view={view}
      name={view === "table" ? tableName : cardName}
      nameNote={getTreadPlateExecution(variant)}
      tableSpecifications={tableValues}
      specifications={isUnverifiedSquarePipe ? <CatalogVariantSpecifications items={[{label: "Характеристики", value: "Уточняются"}]}/> : unverified
        ? <p className="text-sm text-slate-600 dark:text-slate-400">Характеристики требуют подтверждения перед заказом.</p>
        : availability ?? <CatalogVariantSpecifications items={specifications} stacked={isPieceSheetCatalog}/>}
      details={(detailFields.length > 0 || description) && <CatalogPositionDetails productName={variant.name} fields={detailFields}
        note={description && <CatalogDescription description={description}/>}/>}
      price={price}
      order={hasMeasuredOrder ? <MeterPricedOrderControls variant={variant} view={view}/>
        : <ProductOrderControls variant={variant} view={view} showUnit={!unit} orderBySheet={hasSheetOrder}
          showSheetMassColumn={hasSheetMassOrder}
          quantityColSpan={quantityColSpan}/>}/>;
  }
  return (
      <section className="min-w-0 lg:col-span-2" aria-label="Продукция">
      {resultsCount ? (
        <>
          {hasUnverified && <CatalogTableNote>{unverifiedOrderNote}</CatalogTableNote>}
          {isAngle && hasVerifiedSpecifications && <CatalogTableNote>
            Размеры и теоретическая масса 1 м равнополочных уголков приведены в{" "}
            <CatalogStandardReference>таблице 1 ГОСТ 8509-93</CatalogStandardReference>, неравнополочных — в{" "}
            <CatalogStandardReference>таблице 1 ГОСТ 8510-86</CatalogStandardReference>.
          </CatalogTableNote>}
          {isSquare && hasVerifiedSpecifications && <CatalogTableNote>
            Размеры и теоретическая масса 1 м горячекатаного квадрата приведены в{" "}
            <CatalogStandardReference>таблице 1 ГОСТ 2591-2006</CatalogStandardReference>.
          </CatalogTableNote>}
          {isFlatSteel && hasVerifiedSpecifications && <CatalogTableNote>
            Сумма рассчитывается по метражу, масса — по номинальным размерам полосы. Справочный сортамент горячекатаной полосы приведён в{" "}
            <CatalogStandardReference>таблице 1 ГОСТ 103-2006</CatalogStandardReference>.
          </CatalogTableNote>}
          {isTreadPlateCatalog && <CatalogTableNote>
            Рифление — «чечевица». Толщина указана по основанию листа.
            {hasSheetMassOrder && <> Листы по <CatalogStandardReference>{treadPlateStandard}</CatalogStandardReference> можно заказать
              по теоретической массе с учётом рифления. Количество округляем вверх до целых листов.</>}
            {visible.some(variant => variant.sheetOrder && !hasSheetOrderMass(variant.sheetOrder)) && <>
              {" "}Если масса готового листа уточняется, заказать позицию можно в штуках.
            </>}
          </CatalogTableNote>}
          {isHotRolledSheetCatalog && <CatalogTableNote>
            Марка стали — {hotRolledSheetSupply.grade}. Сортамент — <CatalogStandardReference>{hotRolledSheetSupply.assortment}</CatalogStandardReference>.{" "}
            Технические условия для листов толщиной до 3,9 мм — <CatalogStandardReference>{hotRolledSheetSupply.thinSheetStandard}</CatalogStandardReference>,{" "}
            от 4 мм — <CatalogStandardReference>{hotRolledSheetSupply.thickSheetStandard}</CatalogStandardReference>.
            {hasSheetMassOrder && <> При заказе по массе округляем количество вверх до целых листов.</>}
          </CatalogTableNote>}
          <CatalogVariantTable designation={presentation.heading} specifications={isPicket ? ["Цвет", "Профиль", ...specificationLabels] : specificationLabels}
            columnWidths={isPicket ? picketColumnWidths : undefined}
            specificationWidths={isAngle && parameters.length === 2 ? [12, 6] : undefined}
            unit={unit} quantity={hasMeasuredOrder ? "Заказ, м" : hasSheetOrder ? "Заказ, шт." : undefined} quantityColSpan={quantityColSpan}
            secondaryQuantity={hasMeasuredOrder || hasSheetMassOrder ? "Заказ, т" : undefined}>
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

