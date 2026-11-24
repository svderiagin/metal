import sections from "@/data/channel-sections.json";
import type {ProductVariant} from "@/types/product";
import {formatNumber} from "./numberFormat";

export const channelCategoryId = "catalog-cat-shveller";

type ChannelSection = {height: number; width: number; web: number; flange: number; mass: number};
const channelSections: Readonly<Partial<Record<string, ChannelSection>>> = sections;
const legacyMeterIds = new Set(Array.from({length: 14}, (_, index) => `catalog-${2235 + index}`));

export function hasLegacyChannelMeterQuantity(product: Pick<ProductVariant, "id" | "categoryId" | "unit">) {
  return product.categoryId === channelCategoryId && product.unit === "ton" && legacyMeterIds.has(product.id);
}

export function channelProfile(product: ProductVariant) {
  return product.channelNumber !== undefined && product.channelSeries
    ? `${formatNumber(product.channelNumber)}${product.channelSeries}` : undefined;
}

export function channelSection(product: ProductVariant) {
  const profile = channelProfile(product);
  return profile && product.standard === "ГОСТ 8240-97" ? channelSections[profile] : undefined;
}

export function normalizeChannelVariant(product: ProductVariant): ProductVariant {
  const section = channelSection(product);
  if (!section || product.lengthMeters === undefined) return product;
  const profile = channelProfile(product)!;
  const length = `${formatNumber(product.lengthMeters)} м`;
  const millimeters = (value: number) => `${formatNumber(value)} мм`;
  return {
    ...product,
    profileHeightMm: section.height, profileWidthMm: section.width, wallThicknessMm: section.web,
    weight: {value: section.mass, unit: "кг/м"}, weightConfirmed: true, weightPerMeterKg: section.mass,
    specifications: [
      {name: "Профиль", value: profile},
      {name: "Высота", value: millimeters(section.height)},
      {name: "Ширина полки", value: millimeters(section.width)},
      {name: "Толщина стенки", value: millimeters(section.web)},
      {name: "Толщина полки", value: millimeters(section.flange)},
      {name: "Длина по каталогу", value: length},
      {name: "Теоретическая масса", value: `${formatNumber(section.mass)} кг/м`},
      ...(product.steelGrade ? [{name: "Марка стали", value: product.steelGrade}] : []),
    ],
  };
}
