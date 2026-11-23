import type {ReactNode} from "react";
import type {ProductVariant} from "@/types/product";
import {formatMassPerMeter, formatNumber} from "@/lib/numberFormat";
import {vgpSeries} from "@/lib/vgp";
import {CatalogPositionDetails, CatalogStandardLink} from "./CatalogPositionDetails";

const vgpTableUrl = "https://meganorm.ru/mega_doc/norm/gost_gosudarstvennyj-standart/5/gost_3262-75_gosudarstvennyy_standart_soyuza_ssr_truby.html#Par103";
const electroweldedTableUrl = "https://meganorm.ru/mega_doc/norm/gost_gosudarstvennyj-standart/0/gost_10704-91_mezhgosudarstvennyy_standart_truby_stalnye.html#Par53";

export function ElectroweldedMassTable({children}: {children: ReactNode}) {
  return <CatalogStandardLink href={electroweldedTableUrl}>{children}</CatalogStandardLink>;
}

export function PipePositionDetails({variant, isVgp, length, mass}: {
  variant: ProductVariant; isVgp: boolean; length?: ReactNode; mass?: number;
}) {
  const galvanized = variant.coatingType === "galvanized";
  const massLabel = galvanized
    ? isVgp ? "Теоретическая масса с покрытием" : "Теоретическая масса без покрытия"
    : "Теоретическая масса";
  const fields = [
    {label: "Условный проход (Ду)", value: variant.nominalBoreMm === undefined ? null : formatNumber(variant.nominalBoreMm)},
    {label: "Наружный диаметр", value: millimeters(variant.diameterMm)},
    {label: "Толщина стенки", value: millimeters(variant.wallThicknessMm), roundWall: true},
    {label: "Длина по каталогу", value: length},
    {label: "Допуск длины по данным поставщика", value: variant.supplierLengthToleranceMm === undefined ? undefined : `±${formatNumber(variant.supplierLengthToleranceMm)} мм`},
    {label: "Серия", value: isVgp ? vgpSeries(variant) : null},
    {label: "Марка стали", value: isVgp ? null : variant.steelGrade || "Уточняется"},
    {label: "Покрытие", value: galvanized ? "Цинковое" : null},
    {label: massLabel, value: mass === undefined ? null : `${formatMassPerMeter(mass)} кг/м`},
    ...(isVgp ? [{label: "Стандарт", value: variant.standard === "ГОСТ 3262-75"
      ? <CatalogStandardLink href={vgpTableUrl}>Таблица 1 {variant.standard}</CatalogStandardLink> : variant.standard}] : variant.specifications
      .filter(item => item.name === "Сортамент по каталогу" || item.name === "Технические условия по каталогу" ||
        (item.name === "Стандарт" && !variant.specifications.some(spec => spec.name === "Сортамент по каталогу")))
      .map(({name, value}) => ({label: name, value}))),
    {label: "Источник теоретической массы", value: !isVgp && mass !== undefined
      ? <ElectroweldedMassTable>Таблица 1 ГОСТ 10704-91</ElectroweldedMassTable> : undefined},
  ];
  return <CatalogPositionDetails productName={variant.name} fields={fields}
    note={variant.sourceProductName && <p>Обозначение поставщика — {variant.sourceProductName}</p>}/>;
}

function millimeters(value: number | undefined) {
  return value === undefined ? null : `${formatNumber(value)} мм`;
}
