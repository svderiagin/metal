"use client";

import Image, {type StaticImageData} from "next/image";
import {useState} from "react";
import {CoverGalleryNavigation} from "@/components/catalog/CoverGalleryNavigation";
import {coverGalleryIndex} from "@/lib/catalogCoverGallery";

type ContactPhoto = {src: StaticImageData; alt: string; objectPosition?: string};

export function ContactPhotoGallery({photos, label, sizes, frameClassName, className = ""}: {
  photos: readonly [ContactPhoto, ...ContactPhoto[]];
  label: string;
  sizes: string;
  frameClassName: string;
  className?: string;
}) {
  const [index, setIndex] = useState(0);
  const photo = photos[index];

  function navigate(direction: number) {
    setIndex(current => coverGalleryIndex(current, direction, photos.length));
  }

  return (
    <figure aria-label={label} className={`min-w-0 ${className}`}>
      <div className={`relative w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800 ${frameClassName}`}>
        <Image key={photo.src.src} src={photo.src} alt={photo.alt} fill sizes={sizes}
          className="object-cover" style={{objectPosition: photo.objectPosition}}/>
        <CoverGalleryNavigation onPrevious={() => navigate(-1)} onNext={() => navigate(1)}/>
        <p aria-live="polite" aria-atomic="true" className="pointer-events-none absolute bottom-2 right-2 whitespace-nowrap rounded-full bg-slate-950/80 px-2.5 py-1 text-xs font-medium tabular-nums text-white sm:bottom-3 sm:right-3">
          <span className="sr-only">Фотография </span>{index + 1}<span aria-hidden="true"> / </span><span className="sr-only"> из </span>{photos.length}
        </p>
      </div>
    </figure>
  );
}
