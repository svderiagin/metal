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
