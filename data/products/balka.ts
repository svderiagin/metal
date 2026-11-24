import type {ProductVariantSource} from "@/types/product";

const families = {
  Б: {subcategoryId: "cat-bal-sub-1", name: "нормальная", folder: "normalnaya", cover: "balka-regular.jpg"},
  Ш: {subcategoryId: "cat-bal-sub-2", name: "широкополочная", folder: "shirokopolochnaya", cover: "balka-shirokopolochnaya.jpg"},
  К: {subcategoryId: "cat-bal-sub-3", name: "колонная", folder: "kolonnaya", cover: "balka-kolonnaya.jpg"},
} as const;

const rows: readonly {
  key: string;
  profile: string;
  series: keyof typeof families;
  mass: number;
  price: number;
  onOrder?: boolean;
}[] = [
  {key: "10b1", profile: "10Б1", series: "Б", mass: 8.1, price: 100000},
  {key: "12b1", profile: "12Б1", series: "Б", mass: 8.7, price: 117300},
  {key: "14b1", profile: "14Б1", series: "Б", mass: 10.5, price: 118400},
  {key: "16b1", profile: "16Б1", series: "Б", mass: 12.7, price: 91700},
  {key: "18b1", profile: "18Б1", series: "Б", mass: 15.4, price: 119300},
  {key: "50sh1", profile: "50Ш1", series: "Ш", mass: 114.2, price: 88900},
  {key: "50sh2", profile: "50Ш2", series: "Ш", mass: 138.4, price: 96400, onOrder: true},
  {key: "25k1", profile: "25К1", series: "К", mass: 62.6, price: 88300},
  {key: "35k2", profile: "35К2", series: "К", mass: 136.5, price: 89400, onOrder: true},
  {key: "40k2", profile: "40К2", series: "К", mass: 171.7, price: 115500, onOrder: true},
];

export const balkaProducts: ProductVariantSource[] = rows.map(({key, profile, series, mass, price, onOrder}) => {
  const family = families[series];
  const id = `balka-${key}-s255-12m`;
  const name = `Балка ${family.name} ${profile}, С255, 12 м`;
  const standard = "ГОСТ 35087-2024; 27772-2021";
  return {
    id, slug: id, name, categoryId: "cat-bal", subcategoryId: family.subcategoryId,
    shortDescription: `Двутавр ${profile} из стали С255, 12 м.`,
    description: `${name}. Сортамент по ГОСТ 35087-2024, требования к стали по ГОСТ 27772-2021.`,
    price, pricePerTon: price, priceQualifier: "exact", currency: "RUB", priceUnit: "за тонну",
    availability: onOrder ? "ON_ORDER" : "IN_STOCK", inStock: !onOrder, featured: false,
    steelGrade: "С255", lengthMeters: 12, weightPerMeterKg: mass,
    imageUrls: [`/images/catalog/balka/balka-${family.folder}/cover/${family.cover}`],
    attributes: [
      {key: "size", label: "Профиль", value: profile},
      {key: "grade", label: "Марка стали", value: "С255"},
      {key: "length", label: "Длина", value: "12 м"},
      {key: "standard", label: "Стандарт", value: standard},
    ],
    specifications: [
      {name: "Профиль", value: profile},
      {name: "Марка стали", value: "С255"},
      {name: "Длина", value: "12 м"},
      {name: "Стандарт", value: standard},
    ],
  };
});
