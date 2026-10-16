import {catalogImageUrl} from "@/lib/catalog-image";
import Image from "next/image";

export function CatalogImage({src, name, compact = false}: {src?: string; name: string; compact?: boolean}) {
  if (!src) return null;
  return (
    <div className={`relative shrink-0 overflow-hidden bg-white ${compact ? "mb-2 h-16 w-24 rounded-lg" : "mb-5 aspect-[2/1] w-full rounded-xl"}`}>
      <Image src={catalogImageUrl(src)} alt={name} fill sizes={compact ? "96px" : "auto, (max-width: 640px) 90vw, 360px"} className="object-contain object-center"/>
    </div>
  );
}
