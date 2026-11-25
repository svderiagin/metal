import type {ProductVariant} from "@/types/product";

export type ProfileSheetVariant = ProductVariant & Required<Pick<
  ProductVariant,
  "profileMark" | "sheetSizeMeters" | "wallThicknessMm" | "coatingType"
>>;

export function isProfileSheetVariant(variant: ProductVariant): variant is ProfileSheetVariant {
  return variant.categoryId === "cat-pnf"
    && variant.unit === "piece"
    && variant.profileMark !== undefined
    && variant.sheetSizeMeters !== undefined
    && variant.wallThicknessMm !== undefined
    && variant.coatingType !== undefined;
}

export function profileSheetCoatingLabel(variant: ProfileSheetVariant) {
  if (variant.coatingType === "galvanized") return "Оцинкованный";
  return variant.ralCode
    ? `RAL ${variant.ralCode} (${variant.colorName ?? "цветной"})`
    : variant.colorName ?? "Окрашенный";
}

export function profileSheetDimensions(size: string) {
  const match = /^(\d+(?:[.,]\d+)?)\s*[×xх]\s*(\d+(?:[.,]\d+)?)$/iu.exec(size);
  if (!match) return;
  const width = Number(match[1].replace(",", "."));
  const length = Number(match[2].replace(",", "."));
  if (width > 0 && length > 0 && Number.isFinite(width) && Number.isFinite(length)) {
    return {width, length};
  }
}
