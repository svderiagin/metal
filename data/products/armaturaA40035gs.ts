import {formatNumber} from "@/lib/numberFormat";
import type {ProductVariantSource} from "@/types/product";

// Public supplier listings checked on 2026-11-22. Prices are RUB per tonne.
// Nominal kg/m for conversion: table 1, https://meganorm.ru/Data1/3/3937/index.htm
const suppliers = {
  "Астим": {base: "https://as-tim.ru/", qualifier: "from"},
  "Металл-МК": {base: "https://metallmk.ru/armatura/armatura-riflenaya/", qualifier: "exact"},
  "Стамет": {base: "https://novametcom.ru/produkciya/prod/", qualifier: "from"},
} as const;

type SupplierRow = {
  diameterMm: number;
  weightPerMeterKg: number;
  pricePerTon: number;
  supplier: keyof typeof suppliers;
  path: string;
  lengthMeters?: number; // Coils have no catalogue length.
  standard?: string; // Only when explicitly identified for this item.
};

const rows: SupplierRow[] = [
  {diameterMm: 6, weightPerMeterKg: 0.222, pricePerTon: 43000, supplier: "Астим", path: "a3-35gs-6mm-6m/", lengthMeters: 6},
  {diameterMm: 8, weightPerMeterKg: 0.395, pricePerTon: 42000, supplier: "Астим", path: "a3-35gs-8mm-6m/", lengthMeters: 6},
  {diameterMm: 10, weightPerMeterKg: 0.617, pricePerTon: 41000, supplier: "Астим", path: "a3-35gs-10mm-11-7m/", lengthMeters: 11.7},
  {diameterMm: 14, weightPerMeterKg: 1.21, pricePerTon: 40000, supplier: "Астим", path: "a3-35gs-14mm-11-7m/", lengthMeters: 11.7},
  {diameterMm: 16, weightPerMeterKg: 1.58, pricePerTon: 40000, supplier: "Астим", path: "a3-35gs-16mm-11-7m/", lengthMeters: 11.7, standard: "ГОСТ 5781-82"},
  {diameterMm: 18, weightPerMeterKg: 2, pricePerTon: 40000, supplier: "Астим", path: "a3-35gs-18mm-11-7m/", lengthMeters: 11.7},
  {diameterMm: 22, weightPerMeterKg: 2.98, pricePerTon: 40000, supplier: "Астим", path: "a3-35gs-22mm-11-7m/", lengthMeters: 11.7},
  {diameterMm: 25, weightPerMeterKg: 3.85, pricePerTon: 58086, supplier: "Стамет", path: "armatura-25-a3-35gs-15/", lengthMeters: 11.7, standard: "ГОСТ 5781-82"},
  {diameterMm: 28, weightPerMeterKg: 4.83, pricePerTon: 42021, supplier: "Металл-МК", path: "armatura-28-mm-a3-a400-riflenaya-35gs/", lengthMeters: 11.7, standard: "ГОСТ 5781-82"},
  {diameterMm: 32, weightPerMeterKg: 6.31, pricePerTon: 40000, supplier: "Астим", path: "a3-35gs-32mm-11-7m/", lengthMeters: 11.7},
  {diameterMm: 36, weightPerMeterKg: 7.99, pricePerTon: 40000, supplier: "Астим", path: "a3-35gs-36mm-11-7m/", lengthMeters: 11.7},
  {diameterMm: 40, weightPerMeterKg: 9.87, pricePerTon: 43000, supplier: "Астим", path: "a3-35gs-40mm-11-7m/", lengthMeters: 11.7},
  {diameterMm: 6, weightPerMeterKg: 0.222, pricePerTon: 57580, supplier: "Металл-МК", path: "armatura-6-mm-a3-a400-riflenaya-35gs-buhta/", standard: "ГОСТ 5781-82"},
  {diameterMm: 8, weightPerMeterKg: 0.395, pricePerTon: 56780, supplier: "Металл-МК", path: "armatura-8-mm-a3-a400-riflenaya-35gs-buhta/", standard: "ГОСТ 5781-82"},
  {diameterMm: 10, weightPerMeterKg: 0.617, pricePerTon: 51500, supplier: "Металл-МК", path: "armatura-10-mm-a3-a400-riflenaya-35gs-buhta/", standard: "ГОСТ 5781-82"},
];

export const armaturaA40035gsVariants: ProductVariantSource[] = rows.map(row => {
  const {diameterMm, weightPerMeterKg, pricePerTon, lengthMeters, standard} = row;
  const length = lengthMeters === undefined ? undefined : `${formatNumber(lengthMeters)} м`;
  const form = length === undefined ? "coil" : "bar";
  const formName = length ? `пруток ${length}` : "в бунтах";
  const id = `rebar-a400-35gs-${diameterMm}-${form}`;
  const name = `Арматура рифлёная А400 (А3), 35ГС ${diameterMm} мм, ${formName}`;
  const supplier = suppliers[row.supplier];

  return {
    id, slug: id, categoryId: "cat-arm", subcategoryId: "cat-arm-sub-2",
    sku: `MS-A400-35GS-${diameterMm}-${form === "bar" ? "B" : "C"}`,
    name, shortDescription: name + ".",
    description: `Рифлёная арматура класса А400 (А3) из стали 35ГС диаметром ${diameterMm} мм. ${length ? `Поставляется прутками длиной ${length}.` : "Поставляется в бунтах."}`,
    diameterMm, weightPerMeterKg, lengthMeters, form, steelGrade: "35ГС",
    price: pricePerTon, pricePerTon, priceUnit: "за тонну", currency: "RUB",
    priceQualifier: supplier.qualifier,
    quoteOnly: true, availability: "UNKNOWN", inStock: false,
    sourceReference: supplier.base + row.path,
    featured: false, imageUrls: [],
    attributes: [
      {key: "material", label: "Материал", value: "Низколегированная сталь 35ГС"},
      {key: "class", label: "Класс арматуры", value: "А400 (А3)"},
      {key: "grade", label: "Марка стали", value: "35ГС"},
      {key: "size", label: "Диаметр", value: `${diameterMm} мм`},
      ...(length ? [{key: "length" as const, label: "Длина прутка", value: length}] : []),
      ...(standard ? [{key: "standard" as const, label: "Стандарт", value: standard}] : []),
    ],
    specifications: [
      {name: "Форма поставки", value: form === "bar" ? "Пруток" : "В бунтах"},
      {name: "Теоретическая масса по ГОСТ 5781-82", value: `${formatNumber(weightPerMeterKg)} кг/м`},
    ],
  };
});
