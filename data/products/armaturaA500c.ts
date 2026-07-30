import type {ProductVariantSource} from "@/types/product";

const productTypeId = "cat-arm-sub-1";
const steelGrade = "3сп(пс)";

type A500cRow = {
  diameterMm: number;
  form: "coil" | "bar";
  pricePerTon: number;
  weightPerMeterKg: number;
  lengthMeters?: number;
};

const rows: A500cRow[] = [
  {diameterMm: 6, form: "coil", pricePerTon: 73300, weightPerMeterKg: 0.222},
  {diameterMm: 6, form: "bar", lengthMeters: 6, pricePerTon: 73300, weightPerMeterKg: 0.222},
  {diameterMm: 8, form: "coil", pricePerTon: 71400, weightPerMeterKg: 0.395},
  {diameterMm: 8, form: "bar", lengthMeters: 6, pricePerTon: 73300, weightPerMeterKg: 0.395},
  {diameterMm: 10, form: "coil", pricePerTon: 71400, weightPerMeterKg: 0.617},
  {diameterMm: 10, form: "bar", lengthMeters: 6, pricePerTon: 71800, weightPerMeterKg: 0.617},
  {diameterMm: 12, form: "coil", pricePerTon: 70400, weightPerMeterKg: 0.888},
  {diameterMm: 12, form: "bar", lengthMeters: 11.7, pricePerTon: 68400, weightPerMeterKg: 0.888},
  {diameterMm: 14, form: "bar", lengthMeters: 11.7, pricePerTon: 68400, weightPerMeterKg: 1.21},
  {diameterMm: 16, form: "bar", lengthMeters: 11.7, pricePerTon: 67800, weightPerMeterKg: 1.58},
  {diameterMm: 18, form: "bar", lengthMeters: 11.7, pricePerTon: 68400, weightPerMeterKg: 2},
  {diameterMm: 20, form: "bar", lengthMeters: 11.7, pricePerTon: 68400, weightPerMeterKg: 2.47},
  {diameterMm: 22, form: "bar", lengthMeters: 11.7, pricePerTon: 68400, weightPerMeterKg: 2.98},
  {diameterMm: 25, form: "bar", lengthMeters: 11.7, pricePerTon: 68400, weightPerMeterKg: 3.85},
  {diameterMm: 28, form: "bar", lengthMeters: 11.7, pricePerTon: 68400, weightPerMeterKg: 4.83},
  {diameterMm: 32, form: "bar", lengthMeters: 11.7, pricePerTon: 68400, weightPerMeterKg: 6.31},
  {diameterMm: 36, form: "bar", lengthMeters: 11.7, pricePerTon: 68400, weightPerMeterKg: 7.99},
  {diameterMm: 40, form: "bar", lengthMeters: 11.7, pricePerTon: 68400, weightPerMeterKg: 9.87},
];

export const armaturaA500cVariants: ProductVariantSource[] = rows.map((row, index) => {
  const formSlug = row.form === "coil" ? "coil" : "bar";
  const formName = row.form === "coil"
    ? "в бунтах"
    : `пруток${row.lengthMeters ? ` ${formatNumber(row.lengthMeters)} м` : ""}`;
  const id = `rebar-a500c-${row.diameterMm}-${formSlug}`;

  return {
    id,
    categoryId: "cat-arm",
    subcategoryId: productTypeId,
    name: `Арматура А500С ${row.diameterMm} мм, ${formName}`,
    slug: id,
    sku: `MS-A500C-${String(row.diameterMm).padStart(2, "0")}-${row.form === "coil" ? "C" : "B"}`,
    shortDescription: `Арматура А500С диаметром ${row.diameterMm} мм, ${formName}, сталь ${steelGrade}.`,
    description: `Вариант арматуры А500С диаметром ${row.diameterMm} мм в форме «${formName}».`,
    price: row.pricePerTon,
    priceUnit: "за тонну",
    inStock: true,
    featured: index < 4,
    imageUrls: [],
    diameterMm: row.diameterMm,
    form: row.form,
    steelGrade,
    pricePerTon: row.pricePerTon,
    weightPerMeterKg: row.weightPerMeterKg,
    lengthMeters: row.lengthMeters,
    sourceProductName: row.form === "coil"
      ? "арматура, в бунтах"
      : `арматура, ${formatNumber(row.lengthMeters ?? 0)} м`,
    sourceReference: `armatura__${row.diameterMm}_a500s${row.form === "coil" ? "_buhty" : ""}.htm`,
    attributes: [
      {key: "material", label: "Материал", value: `Сталь ${steelGrade}`},
      {key: "size", label: "Диаметр", value: `${row.diameterMm} мм`},
      {key: "grade", label: "Марка стали", value: steelGrade},
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
