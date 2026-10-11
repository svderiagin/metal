import Image from "next/image";

export function CatalogImage({src, name, compact = false}: {src?: string; name: string; compact?: boolean}) {
  if (!src) return null;
  return (
    <div className={`relative shrink-0 overflow-hidden rounded-lg bg-white ${compact ? "mb-2 h-16 w-24" : "mb-5 h-40 w-full"}`}>
      <Image src={src} alt={name} fill sizes={compact ? "96px" : "(max-width: 640px) 90vw, 360px"} className="object-contain"/>
    </div>
  );
}
