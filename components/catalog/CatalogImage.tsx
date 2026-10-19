import {catalogImageUrl} from "@/lib/catalog-image";
import Image from "next/image";
import Link from "next/link";

export function CatalogImage({src, name, compact = false, href}: {src?: string; name: string; compact?: boolean; href?: string}) {
  if (!src) return null;
  const image = (
    <div className={`relative shrink-0 overflow-hidden bg-white ${compact ? "mb-2 h-16 w-24 rounded-lg" : "mb-5 aspect-[2/1] w-full rounded-xl"}`}>
      <Image src={catalogImageUrl(src)} alt={name} fill sizes={compact ? "96px" : "auto, (max-width: 640px) 90vw, 360px"} className="object-contain object-center"/>
    </div>
  );
  return href ? <Link href={href} aria-label={`Открыть товар: ${name}`}
    className={`block rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-slate-600 dark:focus-visible:outline-red-300 ${compact ? "mx-auto w-fit max-w-full" : "w-full"}`}>
    {image}
  </Link> : image;
}
