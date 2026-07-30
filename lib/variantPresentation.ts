import type {ProductAttributeKey, ProductVariant} from "@/types/product";

export interface VariantAttributeColumn {
  key: ProductAttributeKey;
  label: string;
}

export interface VariantPresentation {
  columns: VariantAttributeColumn[];
  filterKeys: ProductAttributeKey[];
}

const commonFilters: ProductAttributeKey[] = ["material", "standard"];

const presentations: Record<string, VariantPresentation> = {
  armatura: {
    columns: [
      {key: "size", label: "Диаметр"},
      {key: "grade", label: "Класс / марка"},
      {key: "standard", label: "Стандарт"},
      {key: "length", label: "Длина"},
    ],
    filterKeys: [...commonFilters, "size", "grade", "length"],
  },
  "listovoy-prokat": {
    columns: [
      {key: "size", label: "Толщина"},
      {key: "grade", label: "Марка стали"},
      {key: "standard", label: "Стандарт"},
      {key: "length", label: "Длина листа"},
    ],
    filterKeys: [...commonFilters, "size", "grade", "length"],
  },
  "truby-stalnye": pipePresentation("Диаметр"),
  "truby-nerzhaveyushchie": pipePresentation("Диаметр"),
  "truby-profilnye": pipePresentation("Профиль / размер"),
};

const defaultPresentation: VariantPresentation = {
  columns: [
    {key: "size", label: "Размер"},
    {key: "material", label: "Материал"},
    {key: "standard", label: "Стандарт"},
    {key: "grade", label: "Марка"},
    {key: "length", label: "Длина"},
  ],
  filterKeys: [...commonFilters, "size", "grade", "length"],
};

export function getVariantPresentation(categorySlug: string) {
  return presentations[categorySlug] ?? defaultPresentation;
}

export function getVariantAttribute(
  variant: ProductVariant,
  key: ProductAttributeKey,
) {
  return variant.attributes.find((attribute) => attribute.key === key)?.value ?? "—";
}

export function getQuantityUnit(variant: ProductVariant) {
  if (variant.unit === "meter") return "м";
  if (variant.unit === "ton") return "т";
  if (variant.unit === "sheet") return "лист";
  return "шт.";
}

function pipePresentation(sizeLabel: string): VariantPresentation {
  return {
    columns: [
      {key: "size", label: sizeLabel},
      {key: "grade", label: "Марка стали"},
      {key: "standard", label: "Стандарт"},
      {key: "length", label: "Длина"},
    ],
    filterKeys: [...commonFilters, "size", "grade", "length"],
  };
}
