import type {ProductAttribute, ProductVariantSource} from "@/types/product";

type MeshGroup = "chain-link" | "welded-roll" | "welded-sheet";
type PriceBasis = "roll" | "meter" | "piece";

type MeshRow = {
  sourceId: string;
  group: MeshGroup;
  name: string;
  size: string;
  price: number;
  priceBasis: PriceBasis;
  onOrder?: true;
};

const rows: MeshRow[] = [
  {sourceId: "2249", group: "chain-link", name: "Сетка рабица оцинк. 55х55х1.6мм (1.5х10м)", size: "10 м", price: 1100, priceBasis: "roll"},
  {sourceId: "2250", group: "chain-link", name: "Сетка рабица оцинк. 55х55х1.6мм (1.8х10м)", size: "10 м", price: 1300, priceBasis: "roll"},
  {sourceId: "2251", group: "chain-link", name: "Сетка рабица оцинк. 55х55х1.6мм (2х10м)", size: "10 м", price: 1350, priceBasis: "roll"},
  {sourceId: "2252", group: "chain-link", name: "Сетка рабица оцинк. 55х55х2.3мм (1.5х10м)", size: "10 м", price: 2650, priceBasis: "roll"},
  {sourceId: "2253", group: "chain-link", name: "Сетка рабица оцинк. 55х55х2.3мм (1.8х10м)", size: "10 м", price: 2850, priceBasis: "roll"},
  {sourceId: "2254", group: "chain-link", name: "Сетка рабица оцинк. 55х55х2.3мм (2х10м)", size: "10 м", price: 3100, priceBasis: "roll", onOrder: true},
  {sourceId: "2255", group: "chain-link", name: "Сетка рабица оцинк. 25х25х1.4мм (1х10м)", size: "10 м", price: 1950, priceBasis: "roll"},
  {sourceId: "21517", group: "welded-roll", name: "Сетка штукатурная черная 2х2мм", size: "80 м", price: 205, priceBasis: "meter", onOrder: true},
  {sourceId: "2264", group: "welded-roll", name: "Сетка тканая 5х5х0.7мм", size: "80 м", price: 190, priceBasis: "meter"},
  {sourceId: "2267", group: "welded-roll", name: "Сетка оцинкованная 6х6х0,6мм рулон 1х15м", size: "15 м", price: 1650, priceBasis: "roll"},
  {sourceId: "28997", group: "welded-roll", name: "Сетка сварная оцинкованная 15х15х0.7мм, рулон 1х15м", size: "15 м", price: 750, priceBasis: "roll"},
  {sourceId: "2271", group: "welded-roll", name: "Сетка сварная оцинкованная 10х10х0.6мм, рулон 1х15м", size: "15 м", price: 1300, priceBasis: "roll"},
  {sourceId: "2272", group: "welded-roll", name: "Сетка сварная оцинкованная 12х12х0.6мм, рулон 1х15м", size: "15 м", price: 1200, priceBasis: "roll"},
  {sourceId: "2260", group: "welded-roll", name: "Сетка штукатурная оц. плетеная 14х14х0.8 рулон 1х80", size: "80 м", price: 90, priceBasis: "meter"},
  {sourceId: "2263", group: "welded-roll", name: "Сетка штукатурная плетеная 14х14х0.8 рулон 1х80", size: "80 м", price: 90, priceBasis: "meter"},
  {sourceId: "2266", group: "welded-roll", name: "Сетка сварная оцинк. 20х20х0.8 рулон 1х25м", size: "25 м", price: 1750, priceBasis: "roll"},
  {sourceId: "2265", group: "welded-roll", name: "Сетка сварная оцинк. 25х25х0.8 рулон 1х25м", size: "25 м", price: 1650, priceBasis: "roll"},
  {sourceId: "20179", group: "welded-roll", name: "Сетка сварная оцинк. 25х25х1.5 рулон 1х25м", size: "25 м", price: 3600, priceBasis: "roll"},
  {sourceId: "2262", group: "welded-roll", name: "Сетка сварная оцинк. 25х25х1.3 рулон 1.5х25м", size: "25 м.", price: 5300, priceBasis: "roll"},
  {sourceId: "2259", group: "welded-roll", name: "Сетка сварная 30х30х1,6 (1х40м.) оцинк.", size: "40 м", price: 5790, priceBasis: "roll", onOrder: true},
  {sourceId: "20182", group: "welded-roll", name: "Сетка сварная 50х50х1.6 рулон 0.2х50м", size: "50 м", price: 700, priceBasis: "roll", onOrder: true},
  {sourceId: "28918", group: "welded-roll", name: "Сетка сварная 50х50х1.6 рулон 0.30х50м", size: "50 м", price: 875, priceBasis: "roll"},
  {sourceId: "20209", group: "welded-roll", name: "Сетка сварная 50х50х1.6 рулон 0.35х50м", size: "50 м", price: 1200, priceBasis: "roll"},
  {sourceId: "20210", group: "welded-roll", name: "Сетка сварная 50х50х1.6 рулон 0.5х50м", size: "50 м", price: 1700, priceBasis: "roll"},
  {sourceId: "26578", group: "welded-roll", name: "Сетка сварная 50х50х1.6 рулон 1х50м", size: "50 м", price: 3700, priceBasis: "roll"},
  {sourceId: "2270", group: "welded-roll", name: "Сетка сварная 50х60х1.6 рулон 1.5х20м", size: "20 м", price: 1900, priceBasis: "roll"},
  {sourceId: "2261", group: "welded-roll", name: "Сетка сварная 50х50х2,5(1,5х15) оцинк", size: "15 м", price: 3900, priceBasis: "roll"},
  {sourceId: "20180", group: "welded-roll", name: "Сетка сварная 50х50х2,5(2,0х15) оцинк", size: "15 м", price: 5250, priceBasis: "roll"},
  {sourceId: "20181", group: "welded-roll", name: "Сетка сварная оцинк. 50х60х1.6 рулон 1.5х40м", size: "40 м", price: 4850, priceBasis: "roll"},
  {sourceId: "2273", group: "welded-sheet", name: "Сетка сварная (в картах) 55х55х2,5мм (0,5х2м)", size: "0,5х2 м", price: 140, priceBasis: "piece"},
  {sourceId: "2274", group: "welded-sheet", name: "Сетка сварная (в картах) 55х55х2,5мм (2х1м)", size: "2х1 м", price: 260, priceBasis: "piece"},
  {sourceId: "2276", group: "welded-sheet", name: "Сетка сварная (в картах) 55х55х3,5 мм (0,5х2м)", size: "0,5х2 м", price: 235, priceBasis: "piece"},
  {sourceId: "2275", group: "welded-sheet", name: "Сетка сварная (в картах) 55х55х3,5мм (2х1м)", size: "2х1 м", price: 490, priceBasis: "piece"},
  {sourceId: "20183", group: "welded-sheet", name: "Сетка сварная (в картах) 55х55х5мм (0.5х2м)", size: "0,5х2 м", price: 470, priceBasis: "piece", onOrder: true},
  {sourceId: "29073", group: "welded-sheet", name: "Сетка сварная (в картах) 110х110х2,5мм (2x3м)", size: "2х3 м", price: 600, priceBasis: "piece"},
  {sourceId: "29074", group: "welded-sheet", name: "Сетка сварная (в картах) 110х110х3,5мм (2x3м)", size: "2х3 м", price: 850, priceBasis: "piece"},
  {sourceId: "29075", group: "welded-sheet", name: "Сетка сварная (в картах) 110х110х4,5мм (2x3м)", size: "2х3 м", price: 1390, priceBasis: "piece", onOrder: true},
  {sourceId: "29076", group: "welded-sheet", name: "Сетка сварная (в картах)150х150х4,5мм (2х3м)", size: "2х3 м", price: 890, priceBasis: "piece"},
];

const subcategoryByGroup: Record<MeshGroup, string> = {
  "chain-link": "cat-mesh-sub-1",
  "welded-roll": "cat-mesh-sub-2",
  "welded-sheet": "cat-mesh-sub-3",
};

const kindByGroup: Record<MeshGroup, string> = {
  "chain-link": "Сетка-рабица",
  "welded-roll": "Сварная сетка в рулоне",
  "welded-sheet": "Сварная сетка в карте",
};

const priceUnitByBasis: Record<PriceBasis, string> = {
  roll: "за рулон",
  meter: "за погонный метр",
  piece: "за штуку",
};

export const metalMeshProducts: ProductVariantSource[] = rows.map((row) => {
  const dimensions = meshDimensions(row.name);
  const coating = coatingLabel(row.name);
  const format = productFormat(row.name) ?? row.size;
  const attributes: ProductAttribute[] = [
    {key: "material", label: "Материал", value: coating ? `${coating} стальная сетка` : "Стальная сетка"},
    ...(dimensions.cell ? [{key: "size" as const, label: "Размер ячейки", value: dimensions.cell}] : []),
    ...(dimensions.wire ? [{key: "wallThickness" as const, label: "Диаметр проволоки", value: dimensions.wire}] : []),
    {key: "length", label: row.group === "welded-sheet" ? "Размер карты" : "Размер рулона", value: format},
  ];

  return {
    id: `mesh-${row.sourceId}`,
    categoryId: "cat-mesh",
    subcategoryId: subcategoryByGroup[row.group],
    name: row.name,
    slug: `mesh-${row.sourceId}`,
    shortDescription: `${row.name}. Цена указана ${priceUnitByBasis[row.priceBasis]}.`,
    description: `${row.name}. Цена указана ${priceUnitByBasis[row.priceBasis]}.`,
    price: row.price,
    priceUnit: priceUnitByBasis[row.priceBasis],
    priceQualifier: "exact",
    priceConfirmed: true,
    imported: true,
    inStock: !row.onOrder,
    availability: row.onOrder ? "ON_ORDER" : "IN_STOCK",
    featured: false,
    imageUrls: [],
    sourceProductName: row.name,
    attributes,
    specifications: [
      {name: "Тип", value: meshKind(row)},
      ...(dimensions.cell ? [{name: "Размер ячейки", value: dimensions.cell}] : []),
      ...(dimensions.wire ? [{name: "Диаметр проволоки", value: dimensions.wire}] : []),
      ...(coating ? [{name: "Покрытие", value: coating}] : []),
      {name: row.group === "welded-sheet" ? "Размер карты" : "Размер рулона", value: format},
      {name: "Единица цены", value: priceUnitByBasis[row.priceBasis].replace("за ", "")},
    ],
  };
});

function meshDimensions(name: string) {
  const triple = name.match(/(\d+(?:[.,]\d+)?)\s*[хx]\s*(\d+(?:[.,]\d+)?)\s*[хx]\s*(\d+(?:[.,]\d+)?)(?:\s*мм)?/iu);
  if (triple) return {
    cell: `${decimal(triple[1])}×${decimal(triple[2])} мм`,
    wire: `${decimal(triple[3])} мм`,
  };
  const cell = name.match(/(\d+(?:[.,]\d+)?)\s*[хx]\s*(\d+(?:[.,]\d+)?)\s*мм/iu);
  return {cell: cell ? `${decimal(cell[1])}×${decimal(cell[2])} мм` : undefined, wire: undefined};
}

function productFormat(name: string) {
  const parenthesized = name.match(/\((\d+(?:[.,]\d+)?)\s*[хx]\s*(\d+(?:[.,]\d+)?)\s*м?\.?\)/iu);
  const roll = name.match(/рулон\s+(\d+(?:[.,]\d+)?)\s*[хx]\s*(\d+(?:[.,]\d+)?)(?:\s*м)?\.?$/iu);
  const match = parenthesized ?? roll;
  return match ? `${decimal(match[1])}×${decimal(match[2])} м` : undefined;
}

function meshKind(row: MeshRow) {
  if (/тканая/iu.test(row.name)) return "Тканая сетка";
  if (/плет[её]ная/iu.test(row.name)) return "Плетёная штукатурная сетка";
  if (/штукатурная/iu.test(row.name)) return "Штукатурная сетка";
  return kindByGroup[row.group];
}

function coatingLabel(name: string) {
  if (/оц(?:инк|\.)/iu.test(name)) return "Оцинкованная";
  if (/черн/iu.test(name)) return "Чёрная";
  return undefined;
}

function decimal(value: string) {
  return value.replace(".", ",");
}
