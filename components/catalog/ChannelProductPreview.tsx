import type {ProductVariant} from "@/types/product";
import {getChannelProductDescription} from "@/lib/channelDescription";
import {catalogStandards} from "@/lib/catalogStandards";
import {ProductImageViewer} from "./ProductImageViewer";

export function ChannelProductPreview({variant, compact = false}: {variant: ProductVariant; compact?: boolean}) {
  if (!variant.imageUrls[0]) return null;
  return <ProductImageViewer src={variant.imageUrls[0]} name={variant.name} presentation={compact ? "table" : "card"} framed expanded caption={<>
    <p>{getChannelProductDescription(variant).split("\n\n")[0]}</p>
    <p className="mt-3">Справочный сортамент — <a href={catalogStandards["8240"].href} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-slate-900 dark:hover:text-white">ГОСТ 8240-97</a>. Серию и соответствие конкретной партии уточняйте при заказе.</p>
  </>}/>;
}
