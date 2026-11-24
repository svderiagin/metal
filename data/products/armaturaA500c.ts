import type {ProductVariantSource} from "@/types/product";

const productTypeId = "cat-arm-sub-1";
const steelGrade = "3сп(пс)";

type A500cRow = {
  diameterMm: number;
  pricePerTon: number | null;
  weightPerMeterKg: number;
  inStock?: boolean;
  variantSuffix?: string;
} & ({form: "coil"; lengthMeters?: never} | {form: "bar"; lengthMeters: number});

// Nominal kg/m: GOST 34028-2016, table 1. Preserve three decimal places.
// https://meganorm.ru/Data2/1/4293746/4293746568.htm
const rows: A500cRow[] = [
  {diameterMm: 6, form: "coil", pricePerTon: 73300, weightPerMeterKg: 0.222},
  {diameterMm: 6, form: "bar", lengthMeters: 6, pricePerTon: 73300, weightPerMeterKg: 0.222},
  {diameterMm: 8, form: "coil", pricePerTon: 71400, weightPerMeterKg: 0.395},
  {diameterMm: 8, form: "bar", lengthMeters: 6, pricePerTon: 73300, weightPerMeterKg: 0.395},
  {diameterMm: 10, form: "coil", pricePerTon: 71400, weightPerMeterKg: 0.617},
  {diameterMm: 10, form: "bar", lengthMeters: 6, pricePerTon: 71800, weightPerMeterKg: 0.617},
  {diameterMm: 12, form: "coil", pricePerTon: 70400, weightPerMeterKg: 0.888},
  {diameterMm: 12, form: "bar", lengthMeters: 11.7, pricePerTon: 68400, weightPerMeterKg: 0.888},
  {diameterMm: 14, form: "bar", lengthMeters: 6, pricePerTon: 69000, weightPerMeterKg: 1.208, inStock: false, variantSuffix: "6m"},
  {diameterMm: 14, form: "bar", lengthMeters: 11.7, pricePerTon: 68400, weightPerMeterKg: 1.208},
  {diameterMm: 16, form: "bar", lengthMeters: 6, pricePerTon: 68400, weightPerMeterKg: 1.578, inStock: false, variantSuffix: "6m"},
  {diameterMm: 16, form: "bar", lengthMeters: 11.7, pricePerTon: 67800, weightPerMeterKg: 1.578},
  {diameterMm: 18, form: "bar", lengthMeters: 11.7, pricePerTon: 68400, weightPerMeterKg: 1.998},
  {diameterMm: 20, form: "bar", lengthMeters: 11.7, pricePerTon: 68400, weightPerMeterKg: 2.466},
  {diameterMm: 22, form: "bar", lengthMeters: 11.7, pricePerTon: 68400, weightPerMeterKg: 2.984},
  {diameterMm: 25, form: "bar", lengthMeters: 11.7, pricePerTon: 68400, weightPerMeterKg: 3.853},
  {diameterMm: 28, form: "bar", lengthMeters: 11.7, pricePerTon: 68400, weightPerMeterKg: 4.834},
  {diameterMm: 32, form: "bar", lengthMeters: 11.7, pricePerTon: 68400, weightPerMeterKg: 6.313},
  {diameterMm: 36, form: "bar", lengthMeters: 11.7, pricePerTon: 68400, weightPerMeterKg: 7.99},
  {diameterMm: 40, form: "bar", lengthMeters: 11.7, pricePerTon: 68400, weightPerMeterKg: 9.865, inStock: false},
];

export const armaturaA500cVariants: ProductVariantSource[] = rows.map((row, index) => {
  const formSlug = row.form === "coil" ? "coil" : "bar";
  const formName = row.form === "coil"
    ? "в бунтах"
    : `пруток ${formatNumber(row.lengthMeters)} м`;
  const suffix = row.variantSuffix ? `-${row.variantSuffix}` : "";
  const id = `rebar-a500c-${row.diameterMm}-${formSlug}${suffix}`;

  return {
    id,
    categoryId: "cat-arm",
    subcategoryId: productTypeId,
    name: `Арматура рифлёная А500С ${row.diameterMm} мм, ${formName}`,
    slug: id,
    shortDescription: `Рифлёная арматура А500С Ø${row.diameterMm} мм, ${formName}.`,
    description: `Рифлёная арматура А500С диаметром ${row.diameterMm} мм по ГОСТ 34028-2016. ${row.form === "coil" ? "Поставляется в бунтах." : `Поставляется прутками длиной ${formatNumber(row.lengthMeters)} м.`}`,
    price: row.pricePerTon,
    priceUnit: "за тонну",
    inStock: row.inStock ?? true,
    featured: index < 4,
    imageUrls: [],
    diameterMm: row.diameterMm,
    form: row.form,
    steelGrade,
    pricePerTon: row.pricePerTon ?? undefined,
    weightPerMeterKg: row.weightPerMeterKg,
    lengthMeters: row.lengthMeters,
    sourceProductName: row.form === "coil"
      ? "арматура, в бунтах"
      : `арматура, ${formatNumber(row.lengthMeters)} м`,

    attributes: [
      {key: "material", label: "Материал", value: `Сталь ${steelGrade}`},
      {key: "class", label: "Класс арматуры", value: "А500С"},
      {key: "size", label: "Диаметр", value: `${row.diameterMm} мм`},
      {key: "grade", label: "Марка стали", value: steelGrade},
      {key: "standard", label: "Стандарт", value: "ГОСТ 34028-2016"},
      ...(row.lengthMeters
        ? [{key: "length" as const, label: "Длина", value: `${formatNumber(row.lengthMeters)} м`}]
        : []),
    ],
    specifications: [
      {name: "Диаметр", value: `${row.diameterMm} мм`},
      {name: "Форма поставки", value: row.form === "coil" ? "В бунтах" : "Пруток"},
      {name: "Марка стали", value: steelGrade},
      {name: "Вес погонного метра", value: `${formatNumber(row.weightPerMeterKg)} кг/м`},
      ...(row.lengthMeters
        ? [{name: "Фиксированная длина", value: `${formatNumber(row.lengthMeters)} м`}]
        : []),
    ],
  };
});

function formatNumber(value: number) {
  return new Intl.NumberFormat("ru-RU", {maximumFractionDigits: 3}).format(value);
}
