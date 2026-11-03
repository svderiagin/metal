import type {ProductVariant} from "@/types/product";
import {formatAngleSpecificationValue} from "./anglePresentation";

export function getSquareProductParameters(variant: ProductVariant) {
  if (variant.categoryId !== "rozmet-cat-kvadrat") return null;
  const side = variant.name.match(/№\s*(\d+(?:[.,]\d+)?)/u)?.[1];
  const length = variant.specifications.find(s => s.name === "Размер")?.value;
  const mass = variant.specifications.find(s => s.name === "Вес")?.value;
  if (!side || !length || !mass) return null;
  const formattedSide = side.replace(".", ",");
  return {
    side: formattedSide,
    profile: `${formattedSide}x${formattedSide}`,
    section: `${formattedSide}×${formattedSide}\u00a0мм`,
    dimension: `${formattedSide}\u00a0мм`,
    length: formatAngleSpecificationValue(length),
    mass: formatAngleSpecificationValue(mass),
  };
}

export function getSquareProductSpecifications(variant: ProductVariant) {
  const parameters = getSquareProductParameters(variant);
  return parameters ? [
    {name: "Сечение", value: parameters.section},
    {name: "Длина по каталогу", value: parameters.length},
    {name: "Теоретическая масса", value: parameters.mass},
  ] : variant.specifications;
}
