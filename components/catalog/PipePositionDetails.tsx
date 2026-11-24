import type {ReactNode} from "react";
import type {ProductVariant} from "@/types/product";
import {formatMassPerMeter, formatNumber} from "@/lib/numberFormat";
import {vgpSeries} from "@/lib/vgp";
import {CatalogPositionDetails} from "./CatalogPositionDetails";

export function PipePositionDetails({variant, isVgp, length, mass, showVgpStandard = true}: {
  variant: ProductVariant; isVgp: boolean; length?: ReactNode; mass?: number; showVgpStandard?: boolean;
}) {
  const galvanized = variant.coatingType === "galvanized";
  const massLabel = galvanized
    ? isVgp ? "Теоретическая масса с покрытием" : "Теоретическая масса без покрытия"
    : "Теоретическая масса";
  const lengthTolerance = {
    label: "Допуск длины по данным поставщика",
    value: variant.supplierLengthToleranceMm === undefined ? undefined : `±${formatNumber(variant.supplierLengthToleranceMm)} мм`,
  };
  const vgpStandard = variant.standard === "ГОСТ 3262-75" ? "ГОСТ 3262-75 (таблица 1)" : variant.standard;
  const fields = [
    {label: "Условный проход (Ду)", value: variant.nominalBoreMm === undefined ? null : formatNumber(variant.nominalBoreMm)},
    {label: "Наружный диаметр", value: millimeters(variant.diameterMm)},
    {label: "Толщина стенки", value: millimeters(variant.wallThicknessMm), roundWall: true},
    {label: "Длина по каталогу", value: length},
    ...(isVgp ? [] : [lengthTolerance]),
    {label: "Серия", value: isVgp ? vgpSeries(variant) : null},
    {label: "Марка стали", value: isVgp ? null : variant.steelGrade || "Уточняется по партии"},
    {label: "Покрытие", value: galvanized ? "Цинковое" : null},
    {label: massLabel, value: mass === undefined ? null : `${formatMassPerMeter(mass)} кг/м`},
    ...(isVgp ? [{label: "Стандарт", value: showVgpStandard ? vgpStandard : null}] : variant.specifications
      .filter(item => item.name === "Сортамент по каталогу" || item.name === "Технические условия по каталогу" ||
        (item.name === "Стандарт" && !variant.specifications.some(spec => spec.name === "Сортамент по каталогу")))
      .map(({name, value}) => ({label: name, value: value.replace(/^ГОСТ 10704-91(?=;|$)/u, "ГОСТ 10704-91 (таблица 1)")}))),
    {label: "Артикул", value: isVgp ? null : variant.sku},
    ...(isVgp ? [lengthTolerance] : []),
  ];
  return <CatalogPositionDetails productName={variant.name} fields={fields}/>;
}

function millimeters(value: number | undefined) {
  return value === undefined ? null : `${formatNumber(value)} мм`;
}
