"use client";

import Image, {type StaticImageData} from "next/image";
import {useRef, useState} from "react";
import {CoverGalleryNavigation} from "@/components/catalog/CoverGalleryNavigation";
import {coverGalleryIndex} from "@/lib/catalogCoverGallery";

type GalleryPhoto = {src: StaticImageData; alt: string; objectPosition?: string};

export function PhotoGallery({photos, label, sizes, frameClassName, prioritizeFirst = false}: {
  photos: readonly [GalleryPhoto, ...GalleryPhoto[]];
  label: string;
  sizes: string;
  frameClassName: string;
  prioritizeFirst?: boolean;
}) {
  const gesture = useRef<{x: number; y: number} | null>(null);
  const [index, setIndex] = useState(0);
  const photo = photos[index];
  const priority = prioritizeFirst && index === 0;

  function navigate(direction: number) {
    setIndex(current => coverGalleryIndex(current, direction, photos.length));
  }

  return (
    <figure aria-label={label} className="min-w-0">
      <div className={`relative w-full touch-pan-y touch-pinch-zoom overflow-hidden bg-slate-100 dark:bg-slate-800 ${frameClassName}`}
        onTouchStart={event => {
          const touch = event.touches[0];
          gesture.current = event.touches.length === 1 && !(event.target as Element).closest("button")
            ? {x: touch.clientX, y: touch.clientY} : null;
        }}
        onTouchCancel={() => {gesture.current = null;}}
        onTouchEnd={event => {
          const start = gesture.current;
          gesture.current = null;
          const touch = event.changedTouches[0];
          if (!start || !touch) return;
          const dx = touch.clientX - start.x;
          const dy = touch.clientY - start.y;
          if (Math.abs(dx) >= 50 && Math.abs(dx) > Math.abs(dy) * 1.5) navigate(dx < 0 ? 1 : -1);
        }}>
        <Image key={photo.src.src} src={photo.src} alt={photo.alt} fill sizes={sizes}
          loading={priority ? "eager" : undefined} fetchPriority={priority ? "high" : undefined}
          className="object-cover" style={{objectPosition: photo.objectPosition}}/>
        <CoverGalleryNavigation onPrevious={() => navigate(-1)} onNext={() => navigate(1)}/>
        <p aria-live="polite" aria-atomic="true" className="pointer-events-none absolute bottom-2 right-2 whitespace-nowrap rounded-full bg-slate-950/80 px-2.5 py-1 text-xs font-medium tabular-nums text-white sm:bottom-3 sm:right-3">
          <span className="sr-only">Фотография </span>{index + 1}<span aria-hidden="true"> / </span><span className="sr-only"> из </span>{photos.length}
        </p>
      </div>
    </figure>
  );
}
