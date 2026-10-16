import type {ProductVariantSource} from "@/types/product";

type HotRolledRow = {
  number: number;
  series: "П" | "У";
  weightPerMeterKg: number;
  steelGrade?: "09Г2С";
  existing?: {
    id: string;
    slug: string;
    sku: string;
    pricePerTon?: number;
    lengthMeters: number;
  };
};

type BentRow = {
  heightMm: number;
  widthMm: number;
  wallThicknessMm: number;
  weightPerMeterKg: number;
  existing?: {
    id: string;
    slug: string;
    sku: string;
    pricePerTon: number;
    lengthMeters: number;
  };
};

// Nominal masses from the requested assortment for GOST 8240-97.
const hotRolledRows: HotRolledRow[] = [
  {number: 8, series: "П", weightPerMeterKg: 7.05, existing: {id: "local--516", slug: "sveller-8px12000-gost-8240", sku: "МП--516", pricePerTon: 83250, lengthMeters: 12}},
  {number: 8, series: "У", weightPerMeterKg: 7.05},
  {number: 10, series: "П", weightPerMeterKg: 8.59, existing: {id: "local-1420", slug: "sveller-10px12000-gost-8240", sku: "МП-1420", pricePerTon: 78750, lengthMeters: 12}},
  {number: 10, series: "У", weightPerMeterKg: 8.59},
  {number: 12, series: "П", weightPerMeterKg: 10.4, existing: {id: "local--756", slug: "sveller-12px12000-gost-8240", sku: "МП--756", pricePerTon: 85500, lengthMeters: 12}},
  {number: 12, series: "У", weightPerMeterKg: 10.4},
  {number: 14, series: "П", weightPerMeterKg: 12.3, existing: {id: "local-902", slug: "sveller-14px12000-gost-8240", sku: "МП-902", pricePerTon: 87750, lengthMeters: 12}},
  {number: 14, series: "У", weightPerMeterKg: 12.3},
  {number: 16, series: "П", weightPerMeterKg: 14.2, existing: {id: "local-970", slug: "sveller-16px12000-gost-8240", sku: "МП-970", pricePerTon: 84150, lengthMeters: 12}},
  {number: 16, series: "У", weightPerMeterKg: 14.2},
  {number: 18, series: "П", weightPerMeterKg: 16.3, existing: {id: "local--967", slug: "sveller-18px12000-gost-8240", sku: "МП--967", lengthMeters: 12}},
  {number: 18, series: "У", weightPerMeterKg: 16.3},
  {number: 20, series: "П", weightPerMeterKg: 18.4, existing: {id: "local-1259", slug: "sveller-20px12000-gost-8240", sku: "МП-1259", pricePerTon: 115200, lengthMeters: 12}},
  {number: 20, series: "У", weightPerMeterKg: 18.4},
  {number: 10, series: "П", weightPerMeterKg: 8.59, steelGrade: "09Г2С"},
  {number: 12, series: "П", weightPerMeterKg: 10.4, steelGrade: "09Г2С"},
  {number: 14, series: "П", weightPerMeterKg: 12.3, steelGrade: "09Г2С"},
  {number: 16, series: "П", weightPerMeterKg: 14.2, steelGrade: "09Г2С"},
  {number: 18, series: "П", weightPerMeterKg: 16.3, steelGrade: "09Г2С"},
  {number: 20, series: "П", weightPerMeterKg: 18.4, steelGrade: "09Г2С"},
];

// Nominal masses supplied for equal-flange bent channels under GOST 8278-83.
const bentRows: BentRow[] = [
  {heightMm: 50, widthMm: 40, wallThicknessMm: 3, weightPerMeterKg: 2.81},
  {heightMm: 60, widthMm: 32, wallThicknessMm: 2.5, weightPerMeterKg: 2.26},
  {heightMm: 60, widthMm: 32, wallThicknessMm: 4, weightPerMeterKg: 3.43},
  {heightMm: 60, widthMm: 40, wallThicknessMm: 3, weightPerMeterKg: 3.04},
  {heightMm: 80, widthMm: 40, wallThicknessMm: 3, weightPerMeterKg: 3.51},
  {heightMm: 80, widthMm: 50, wallThicknessMm: 4, weightPerMeterKg: 5.18},
  {heightMm: 80, widthMm: 60, wallThicknessMm: 4, weightPerMeterKg: 5.81},
  {heightMm: 100, widthMm: 50, wallThicknessMm: 3, weightPerMeterKg: 4.47, existing: {id: "local-74057", slug: "sveller-xolodnognutyi-100x50x3x12000-gost-8278-tm", sku: "МП-74057", pricePerTon: 61650, lengthMeters: 12}},
  {heightMm: 100, widthMm: 50, wallThicknessMm: 4, weightPerMeterKg: 5.81},
  {heightMm: 120, widthMm: 50, wallThicknessMm: 3, weightPerMeterKg: 4.91},
  {heightMm: 120, widthMm: 50, wallThicknessMm: 4, weightPerMeterKg: 6.44},
];

const hotRolledProducts = hotRolledRows.map((row, index): ProductVariantSource => {
  const designation = `${row.number}${row.series}`;
  const gradeSuffix = row.steelGrade ? ` ${row.steelGrade}` : "";
  const generatedId = `channel-hot-${row.number}${row.series === "П" ? "p" : "u"}${row.steelGrade ? "-09g2s" : ""}`;
  const pricePerTon = row.existing?.pricePerTon;

  return {
    id: row.existing?.id ?? generatedId,
    categoryId: "cat-shv",
    subcategoryId: "cat-shv-sub-1",
    name: `Швеллер ${designation}${gradeSuffix}`,
    slug: row.existing?.slug ?? generatedId,
    sku: row.existing?.sku ?? `MS-CH-${row.number}${row.series}-${row.steelGrade ?? "STD"}`,
    shortDescription: `Горячекатаный швеллер ${designation}${gradeSuffix} по ГОСТ 8240-97, теоретическая масса ${formatNumber(row.weightPerMeterKg)} кг/м.`,
    description: "Стальной профиль для балок, рам, лестниц и каркасов гаражей. Применяется в несущих конструкциях с учётом проектных нагрузок. ГОСТ 8240-97.",
    price: pricePerTon ?? null,
    quoteOnly: pricePerTon === undefined,
    priceQualifier: "exact",
    currency: "RUB",
    priceUnit: "за тонну",
    inStock: false,
    availability: "UNKNOWN",
    imported: row.existing !== undefined,
    priceConfirmed: pricePerTon !== undefined,
    featured: index < 4,
    imageUrls: [],
    channelNumber: row.number,
    channelSeries: row.series,
    steelGrade: row.steelGrade,
    pricePerTon,
    weightPerMeterKg: row.weightPerMeterKg,
    weightConfirmed: true,
    lengthMeters: row.existing?.lengthMeters,
    attributes: [
      {key: "material", label: "Материал", value: row.steelGrade ? `Сталь ${row.steelGrade}` : "Сталь; марка уточняется"},
      {key: "standard", label: "Стандарт", value: "ГОСТ 8240-97"},
      {key: "size", label: "Номер и серия", value: designation},
      ...(row.steelGrade ? [{key: "grade" as const, label: "Марка стали", value: row.steelGrade}] : []),
      ...(row.existing ? [{key: "length" as const, label: "Длина", value: `${formatNumber(row.existing.lengthMeters)} м`}] : []),
    ],
    specifications: [
      {name: "Номер и серия", value: designation},
      {name: "Стандарт", value: "ГОСТ 8240-97"},
      ...(row.steelGrade ? [{name: "Марка стали", value: row.steelGrade}] : []),
      {name: "Теоретическая масса", value: `${formatNumber(row.weightPerMeterKg)} кг/м`},
      ...(row.existing ? [{name: "Длина поставки", value: `${formatNumber(row.existing.lengthMeters)} м`}] : []),
    ],
  };
});

const bentProducts = bentRows.map((row, index): ProductVariantSource => {
  const size = `${formatNumber(row.heightMm)}×${formatNumber(row.widthMm)}×${formatNumber(row.wallThicknessMm)}`;
  const generatedId = `channel-bent-${row.heightMm}x${row.widthMm}x${String(row.wallThicknessMm).replace(".", "-")}`;
  const pricePerTon = row.existing?.pricePerTon;

  return {
    id: row.existing?.id ?? generatedId,
    categoryId: "cat-shv",
    subcategoryId: "cat-shv-sub-2",
    name: `Швеллер гнутый ${size}`,
    slug: row.existing?.slug ?? generatedId,
    sku: row.existing?.sku ?? `MS-CH-B-${row.heightMm}-${row.widthMm}-${String(row.wallThicknessMm).replace(".", "-")}`,
    shortDescription: `Равнополочный гнутый швеллер ${size} мм по ГОСТ 8278-83, теоретическая масса ${formatNumber(row.weightPerMeterKg)} кг/м.`,
    description: "Стальной профиль для лёгких каркасов, направляющих, обрамлений и вспомогательных металлоконструкций. ГОСТ 8278-83.",
    price: pricePerTon ?? null,
    quoteOnly: pricePerTon === undefined,
    priceQualifier: "exact",
    currency: "RUB",
    priceUnit: "за тонну",
    inStock: false,
    availability: "UNKNOWN",
    imported: row.existing !== undefined,
    priceConfirmed: pricePerTon !== undefined,
    featured: index < 4,
    imageUrls: [],
    profileHeightMm: row.heightMm,
    profileWidthMm: row.widthMm,
    wallThicknessMm: row.wallThicknessMm,
    pricePerTon,
    weightPerMeterKg: row.weightPerMeterKg,
    weightConfirmed: true,
    lengthMeters: row.existing?.lengthMeters,
    attributes: [
      {key: "material", label: "Материал", value: "Сталь; марка уточняется"},
      {key: "standard", label: "Стандарт", value: "ГОСТ 8278-83"},
      {key: "size", label: "Размер", value: `${size} мм`},
      {key: "wallThickness", label: "Стенка", value: `${formatNumber(row.wallThicknessMm)} мм`},
      ...(row.existing ? [{key: "length" as const, label: "Длина", value: `${formatNumber(row.existing.lengthMeters)} м`}] : []),
    ],
    specifications: [
      {name: "Размер", value: `${size} мм`},
      {name: "Стенка", value: `${formatNumber(row.wallThicknessMm)} мм`},
      {name: "Стандарт", value: "ГОСТ 8278-83"},
      {name: "Теоретическая масса", value: `${formatNumber(row.weightPerMeterKg)} кг/м`},
      ...(row.existing ? [{name: "Длина поставки", value: `${formatNumber(row.existing.lengthMeters)} м`}] : []),
    ],
  };
});

export const shvellerProducts: ProductVariantSource[] = [...hotRolledProducts, ...bentProducts];

function formatNumber(value: number) {
  return new Intl.NumberFormat("ru-RU", {maximumFractionDigits: 3}).format(value);
}
