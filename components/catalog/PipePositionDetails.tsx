import type {ReactNode} from "react";
import type {ProductVariant} from "@/types/product";
import {formatMassPerMeter, formatNumber} from "@/lib/numberFormat";
import {vgpSeries} from "@/lib/vgp";
import {CatalogPositionDetails, CatalogStandardLink} from "./CatalogPositionDetails";
import {VgpPositionFigures} from "./VgpDetailsVisuals";

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
    {label: "Толщина стенки", value: millimeters(variant.wallThicknessMm)},
    {label: "Длина по каталогу", value: length},
    {label: "Серия", value: isVgp ? vgpSeries(variant) : null},
    {label: "Марка стали", value: isVgp ? null : variant.steelGrade || "Уточняется"},
    {label: "Покрытие", value: galvanized ? "Цинковое" : null},
    {label: massLabel, value: mass === undefined ? null : `${formatMassPerMeter(mass)} кг/м`},
    ...(isVgp ? [{label: "Стандарт", value: variant.standard}] : variant.specifications
      .filter(item => item.name === "Сортамент по каталогу" || item.name === "Технические условия по каталогу" ||
        (item.name === "Стандарт" && !variant.specifications.some(spec => spec.name === "Сортамент по каталогу")))
      .map(({name, value}) => ({label: name, value}))),
  ];
  const supply = <>
    {isVgp ? <>
      <p>{galvanized
        ? <>Размеры приведены по <CatalogStandardLink href={vgpTableUrl}>таблице 1 ГОСТ 3262-75</CatalogStandardLink>. При пересчёте учтена масса цинкового покрытия.</>
        : <>Размеры и теоретическая масса приведены по <CatalogStandardLink href={vgpTableUrl}>таблице 1 ГОСТ 3262-75</CatalogStandardLink>. Фактические характеристики партии подтверждаются документами поставщика.</>}</p>
      <p>Марка стали, исполнение резьбы и наличие муфт уточняются по документам поставки.</p>
    </> : <p>Теоретическая масса стальной трубы приведена по <ElectroweldedMassTable>таблице 1 ГОСТ 10704-91</ElectroweldedMassTable>. {galvanized
      ? "Фактическую длину и массу цинкового покрытия подтверждает изготовитель."
      : "Фактическую массу, длину и исполнение сверяйте по документам партии."}</p>}
    {variant.sourceProductName && <p>Обозначение поставщика — {variant.sourceProductName}</p>}
  </>;

  return <CatalogPositionDetails title="Характеристики трубы" fields={fields} supply={supply}
    figures={<VgpPositionFigures length={length}/>}/>;
}

function millimeters(value: number | undefined) {
  return value === undefined ? null : `${formatNumber(value)} мм`;
}
