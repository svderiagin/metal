import type {ProductVariantSource} from "@/types/product";
import {formatNumber} from "@/lib/numberFormat";
import {h75Reference, profileSheetColorLabel, profileSheetDimensions} from "@/lib/profileSheet";

const ralColors = {
  "3005": "Винно-красный",
  "6005": "Зелёный мох",
  "7024": "Графитовый серый",
  "8017": "Шоколадно-коричневый",
};

type ProfileSheetInput = {
  id: string;
  subcategoryId: "cat-pnf-sub-1" | "cat-pnf-sub-2" | "cat-pnf-sub-3";
  profileMark: "С8" | "С20" | "Н75";
  thickness: number;
  size: string;
  price: number;
  ralCode?: keyof typeof ralColors;
  paintFinish?: string;
  onOrder?: true;
};

const rows: ProfileSheetInput[] = [
  {id: "profnastil-c8-03-ral-3005", subcategoryId: "cat-pnf-sub-1", profileMark: "С8", thickness: 0.3, size: "1,2×2", price: 800, ralCode: "3005", onOrder: true},
  {id: "profnastil-c8-03-ral-6005", subcategoryId: "cat-pnf-sub-1", profileMark: "С8", thickness: 0.3, size: "1,2×2", price: 800, ralCode: "6005"},
  {id: "profnastil-c8-03-ral-8017", subcategoryId: "cat-pnf-sub-1", profileMark: "С8", thickness: 0.3, size: "1,2×2", price: 800, ralCode: "8017"},
  {id: "profnastil-c8-03-galvanized", subcategoryId: "cat-pnf-sub-1", profileMark: "С8", thickness: 0.3, size: "1,2×2", price: 780},
  {id: "profnastil-c8-03-ral-7024", subcategoryId: "cat-pnf-sub-1", profileMark: "С8", thickness: 0.3, size: "1,2×2", price: 800, ralCode: "7024", onOrder: true},
  {id: "profnastil-c8-04-galvanized", subcategoryId: "cat-pnf-sub-1", profileMark: "С8", thickness: 0.4, size: "1,2×2", price: 990},
  {id: "profnastil-c8-045-galvanized", subcategoryId: "cat-pnf-sub-1", profileMark: "С8", thickness: 0.45, size: "1,2×2", price: 1050},
  {id: "profnastil-c8-045-ral-3005", subcategoryId: "cat-pnf-sub-1", profileMark: "С8", thickness: 0.45, size: "1,2×2", price: 1200, ralCode: "3005"},
  {id: "profnastil-c8-045-ral-6005", subcategoryId: "cat-pnf-sub-1", profileMark: "С8", thickness: 0.45, size: "1,2×2", price: 1200, ralCode: "6005"},
  {id: "profnastil-c8-045-ral-8017", subcategoryId: "cat-pnf-sub-1", profileMark: "С8", thickness: 0.45, size: "1,2×2", price: 1200, ralCode: "8017"},
  {id: "profnastil-c8-045-ral-7024", subcategoryId: "cat-pnf-sub-1", profileMark: "С8", thickness: 0.45, size: "1,2×2", price: 1200, ralCode: "7024"},
  {id: "profnastil-c8-05-galvanized", subcategoryId: "cat-pnf-sub-1", profileMark: "С8", thickness: 0.5, size: "1,2×2", price: 1090},
  {id: "profnastil-c8-05-ral-8017", subcategoryId: "cat-pnf-sub-1", profileMark: "С8", thickness: 0.5, size: "1,2×2", price: 1290, ralCode: "8017"},
  {id: "profnastil-c20-03-ral-3005", subcategoryId: "cat-pnf-sub-2", profileMark: "С20", thickness: 0.3, size: "1,15×2", price: 800, ralCode: "3005", onOrder: true},
  {id: "profnastil-c20-03-ral-6005", subcategoryId: "cat-pnf-sub-2", profileMark: "С20", thickness: 0.3, size: "1,15×2", price: 800, ralCode: "6005", onOrder: true},
  {id: "profnastil-c20-03-ral-8017", subcategoryId: "cat-pnf-sub-2", profileMark: "С20", thickness: 0.3, size: "1,15×2", price: 800, ralCode: "8017"},
  {id: "profnastil-c20-03-galvanized", subcategoryId: "cat-pnf-sub-2", profileMark: "С20", thickness: 0.3, size: "1,15×2", price: 800},
  {id: "profnastil-c20-04-galvanized", subcategoryId: "cat-pnf-sub-2", profileMark: "С20", thickness: 0.4, size: "1,15×2", price: 1090},
  {id: "profnastil-c20-045-galvanized", subcategoryId: "cat-pnf-sub-2", profileMark: "С20", thickness: 0.45, size: "1,15×2", price: 1190},
  {id: "profnastil-c20-045-ral-3005", subcategoryId: "cat-pnf-sub-2", profileMark: "С20", thickness: 0.45, size: "1,15×2", price: 1200, ralCode: "3005"},
  {id: "profnastil-c20-045-ral-7024", subcategoryId: "cat-pnf-sub-2", profileMark: "С20", thickness: 0.45, size: "1,15×2", price: 1200, ralCode: "7024"},
  {id: "profnastil-c20-045-ral-6005", subcategoryId: "cat-pnf-sub-2", profileMark: "С20", thickness: 0.45, size: "1,15×2", price: 1200, ralCode: "6005"},
  {id: "profnastil-c20-045-ral-8017", subcategoryId: "cat-pnf-sub-2", profileMark: "С20", thickness: 0.45, size: "1,15×2", price: 1200, ralCode: "8017"},
  {id: "profnastil-c20-05-galvanized", subcategoryId: "cat-pnf-sub-2", profileMark: "С20", thickness: 0.5, size: "1,15×2", price: 1290},
  {id: "profnastil-c20-05-3m-ral-8017", subcategoryId: "cat-pnf-sub-2", profileMark: "С20", thickness: 0.5, size: "1,15×3", price: 2190, ralCode: "8017", paintFinish: "Односторонний гладкий полиэстер"},
  {id: "profnastil-h75-05-galvanized", subcategoryId: "cat-pnf-sub-3", profileMark: "Н75", thickness: 0.5, size: "0,75×6", price: 4300, onOrder: true},
  {id: "profnastil-h75-07-3m-galvanized", subcategoryId: "cat-pnf-sub-3", profileMark: "Н75", thickness: 0.7, size: "0,75×3", price: 2690},
  {id: "profnastil-h75-07-galvanized", subcategoryId: "cat-pnf-sub-3", profileMark: "Н75", thickness: 0.7, size: "0,75×6", price: 5100},
  {id: "profnastil-h75-08-3m-galvanized", subcategoryId: "cat-pnf-sub-3", profileMark: "Н75", thickness: 0.8, size: "0,75×3", price: 2990},
  {id: "profnastil-h75-08-6m-galvanized", subcategoryId: "cat-pnf-sub-3", profileMark: "Н75", thickness: 0.8, size: "0,75×6", price: 5990},
  {id: "profnastil-h75-09-6m-galvanized", subcategoryId: "cat-pnf-sub-3", profileMark: "Н75", thickness: 0.9, size: "0,75×6", price: 7090},
];

export const profnastilProducts: ProductVariantSource[] = rows.map((row) => {
  const painted = row.ralCode !== undefined;
  const colorName = row.ralCode ? ralColors[row.ralCode] : undefined;
  const color = profileSheetColorLabel(row.ralCode, colorName);
  const thickness = formatDecimal(row.thickness);
  const size = profileSheetDimensions(row.size);
  const workingFormat = row.profileMark === "Н75" ? size : undefined;
  const referenceMassPerMeter = workingFormat?.width === h75Reference.workingWidthMeters
    ? h75Reference.massPerMeter.get(row.thickness)
    : undefined;
  const area = size && size.width * size.length;
  const dimensions = workingFormat
    ? `${formatDecimal(workingFormat.length)} м (рабочая ширина ${formatDecimal(workingFormat.width)} м)`
    : `${row.size} м`;
  const name = colorName
    ? `Профнастил ${row.profileMark}, ${thickness} мм, RAL ${row.ralCode} (${colorName.toLocaleLowerCase("ru")}), ${dimensions}`
    : `Профнастил ${row.profileMark} оцинкованный, ${thickness} мм, ${dimensions}`;
  const coating = row.paintFinish ?? (painted ? "Окрашенное" : "Цинковое");

  return {
    id: row.id,
    categoryId: "cat-pnf",
    subcategoryId: row.subcategoryId,
    name,
    slug: row.id,
    shortDescription: `${name}. Цена указана за один лист.`,
    description: `${name}. Цена указана за один лист.`,
    price: row.price,
    priceUnit: "за штуку",
    priceQualifier: "exact",
    priceConfirmed: true,
    inStock: !row.onOrder,
    availability: row.onOrder ? "ON_ORDER" : "IN_STOCK",
    featured: false,
    imageUrls: [],
    profileMark: row.profileMark,
    wallThicknessMm: row.thickness,
    sheetSizeMeters: row.size,
    colorName,
    ralCode: row.ralCode,
    coatingType: painted ? "painted" : "galvanized",
    attributes: [
      {key: "class", label: "Марка профиля", value: row.profileMark},
      {key: "wallThickness", label: "Толщина металла, мм", value: thickness},
      {key: "size", label: workingFormat ? "Рабочая ширина × длина, м" : "Размер листа, м", value: row.size},
    ],
    specifications: [
      {name: "Марка профиля", value: row.profileMark},
      {name: "Толщина металла, мм", value: thickness},
      {name: "Покрытие", value: coating},
      ...(color ? [{name: "Цвет", value: color}] : []),
      ...(workingFormat ? [
        {name: "Рабочая ширина", value: `${formatDecimal(workingFormat.width)} м`},
        {name: "Длина листа", value: `${formatDecimal(workingFormat.length)} м`},
      ] : [{name: "Размер листа, м", value: row.size}]),
      ...(area === undefined ? [] : [{
        name: workingFormat ? "Площадь по рабочей ширине" : "Площадь по габаритам",
        value: `${formatNumber(area)} м²`,
      }]),
      ...(referenceMassPerMeter !== undefined && workingFormat ? [{
        name: "Справочная масса листа",
        value: `${formatNumber(referenceMassPerMeter * workingFormat.length)} кг`,
      }] : []),
      {name: "Единица продажи", value: "Штука"},
    ],
  };
});

function formatDecimal(value: number) {
  return String(value).replace(".", ",");
}
