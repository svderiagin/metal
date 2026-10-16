import type {ProductVariantSource} from "@/types/product";

type ProfileSheetInput = {
  id: string;
  subcategoryId: "cat-pnf-sub-1" | "cat-pnf-sub-2" | "cat-pnf-sub-3";
  profileMark: "С8" | "С20" | "Н75";
  thickness: number;
  size: string;
  price: number;
  colorName?: string;
  ralCode?: string;
};

const rows: ProfileSheetInput[] = [
  {id: "profnastil-c8-03-ral-3005", subcategoryId: "cat-pnf-sub-1", profileMark: "С8", thickness: 0.3, size: "1,2×2", price: 800, colorName: "вишня", ralCode: "3005"},
  {id: "profnastil-c8-03-ral-6005", subcategoryId: "cat-pnf-sub-1", profileMark: "С8", thickness: 0.3, size: "1,2×2", price: 800, colorName: "зелёный", ralCode: "6005"},
  {id: "profnastil-c8-03-ral-8017", subcategoryId: "cat-pnf-sub-1", profileMark: "С8", thickness: 0.3, size: "1,2×2", price: 800, colorName: "коричневый", ralCode: "8017"},
  {id: "profnastil-c8-03-galvanized", subcategoryId: "cat-pnf-sub-1", profileMark: "С8", thickness: 0.3, size: "1,2×2", price: 780},
  {id: "profnastil-c8-03-ral-7024", subcategoryId: "cat-pnf-sub-1", profileMark: "С8", thickness: 0.3, size: "1,2×2", price: 800, colorName: "серый", ralCode: "7024"},
  {id: "profnastil-c8-045-ral-6005", subcategoryId: "cat-pnf-sub-1", profileMark: "С8", thickness: 0.45, size: "1,2×2", price: 1200, colorName: "зелёный", ralCode: "6005"},
  {id: "profnastil-c8-045-ral-8017", subcategoryId: "cat-pnf-sub-1", profileMark: "С8", thickness: 0.45, size: "1,2×2", price: 1200, colorName: "коричневый", ralCode: "8017"},
  {id: "profnastil-c8-045-ral-7024", subcategoryId: "cat-pnf-sub-1", profileMark: "С8", thickness: 0.45, size: "1,2×2", price: 1200, colorName: "серый", ralCode: "7024"},
  {id: "profnastil-c20-03-ral-3005", subcategoryId: "cat-pnf-sub-2", profileMark: "С20", thickness: 0.3, size: "1,15×2", price: 800, colorName: "вишня", ralCode: "3005"},
  {id: "profnastil-c20-03-ral-6005", subcategoryId: "cat-pnf-sub-2", profileMark: "С20", thickness: 0.3, size: "1,15×2", price: 800, colorName: "зелёный", ralCode: "6005"},
  {id: "profnastil-c20-03-ral-8017", subcategoryId: "cat-pnf-sub-2", profileMark: "С20", thickness: 0.3, size: "1,15×2", price: 800, colorName: "коричневый", ralCode: "8017"},
  {id: "profnastil-c20-03-galvanized", subcategoryId: "cat-pnf-sub-2", profileMark: "С20", thickness: 0.3, size: "1,15×2", price: 800},
  {id: "profnastil-c20-045-ral-7024", subcategoryId: "cat-pnf-sub-2", profileMark: "С20", thickness: 0.45, size: "1,15×2", price: 1200, colorName: "серый", ralCode: "7024"},
  {id: "profnastil-c20-045-ral-6005", subcategoryId: "cat-pnf-sub-2", profileMark: "С20", thickness: 0.45, size: "1,15×2", price: 1200, colorName: "зелёный", ralCode: "6005"},
  {id: "profnastil-c20-045-ral-8017", subcategoryId: "cat-pnf-sub-2", profileMark: "С20", thickness: 0.45, size: "1,15×2", price: 1200, colorName: "коричневый", ralCode: "8017"},
  {id: "profnastil-h75-05-galvanized", subcategoryId: "cat-pnf-sub-3", profileMark: "Н75", thickness: 0.5, size: "0,75×6", price: 4300},
  {id: "profnastil-h75-07-galvanized", subcategoryId: "cat-pnf-sub-3", profileMark: "Н75", thickness: 0.7, size: "0,75×6", price: 5100},
];

export const profnastilProducts: ProductVariantSource[] = rows.map((row) => {
  const painted = row.ralCode !== undefined;
  const thickness = formatDecimal(row.thickness);
  const name = painted
    ? `Профнастил ${row.profileMark}, ${thickness} мм, RAL ${row.ralCode} (${row.colorName}), ${row.size} м`
    : `Профнастил ${row.profileMark} оцинкованный, ${thickness} мм, ${row.size} м`;
  const coating = painted ? `RAL ${row.ralCode} (${row.colorName})` : "Оцинкованный";

  return {
    id: row.id,
    categoryId: "cat-pnf",
    subcategoryId: row.subcategoryId,
    name,
    slug: row.id,
    sku: `ПН-${row.id.replace("profnastil-", "").toUpperCase()}`,
    shortDescription: `${name}. Цена указана за один лист.`,
    description: `${name}. Цена указана за один лист.`,
    price: row.price,
    priceUnit: "за штуку",
    priceQualifier: "exact",
    priceConfirmed: true,
    inStock: false,
    availability: "UNKNOWN",
    featured: false,
    imageUrls: [],
    profileMark: row.profileMark,
    wallThicknessMm: row.thickness,
    sheetSizeMeters: row.size,
    colorName: row.colorName,
    ralCode: row.ralCode,
    coatingType: painted ? "painted" : "galvanized",
    attributes: [
      {key: "class", label: "Марка профиля", value: row.profileMark},
      {key: "wallThickness", label: "Толщина металла, мм", value: thickness},
      {key: "size", label: "Размер листа, м", value: row.size},
    ],
    specifications: [
      {name: "Марка профиля", value: row.profileMark},
      {name: "Толщина металла, мм", value: thickness},
      {name: "Цвет / покрытие", value: coating},
      ...(painted ? [
        {name: "Цвет", value: capitalize(row.colorName!)},
        {name: "Код RAL", value: row.ralCode!},
      ] : []),
      {name: "Тип покрытия", value: painted ? "Окрашенный" : "Оцинкованный"},
      {name: "Размер листа, м", value: row.size},
      {name: "Единица продажи", value: "Штука"},
    ],
  };
});

function formatDecimal(value: number) {
  return String(value).replace(".", ",");
}

function capitalize(value: string) {
  return value.charAt(0).toLocaleUpperCase("ru") + value.slice(1);
}
