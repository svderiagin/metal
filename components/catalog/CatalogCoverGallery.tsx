"use client";

import {useRef, useState} from "react";
import {createPortal} from "react-dom";
import {Icon} from "@/components/ui/Icon";
import {PreparedPhoto} from "@/components/ui/PreparedPhoto";
import type {PreparedPhoto as Photo} from "@/lib/server/preparedPhotos";
import {catalogImageUrl} from "@/lib/catalog-image";
import {coverGalleryImages, coverGalleryIndex} from "@/lib/catalogCoverGallery";
import {DesktopImagePreload} from "./DesktopImagePreload";
import {CoverGalleryNavigation} from "./CoverGalleryNavigation";
import {CatalogCoverViewer} from "./CatalogCoverViewer";

type Layout = "banner" | "wide" | "compact";
const imageSizes: Record<Layout, string> = {
  banner: "(min-width: 1360px) 1004px, (min-width: 1024px) calc(100vw - 356px), (min-width: 640px) calc(100vw - 40px), calc(100vw - 32px)",
  wide: "(min-width: 1360px) 938px, (min-width: 1024px) calc(100vw - 422px), (min-width: 640px) calc(100vw - 90px), calc(100vw - 74px)",
  compact: "(min-width: 1024px) 320px, (min-width: 640px) 200px, 88px",
};

export function CatalogCoverGallery({images, name, layout = "wide", className = "", coverPhoto}: {
  images: readonly string[];
  name: string;
  layout?: Layout;
  className?: string;
  coverPhoto?: Photo;
}) {
  const slides = coverGalleryImages("", images);
  const [selected, setSelected] = useState(0);
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const index = Math.min(selected, Math.max(0, slides.length - 1));
  const src = slides[index];
  const hasSlides = slides.length > 1;
  const eager = layout === "banner";
  const photoName = index === 0 ? name : `${name} — фото ${index + 1}`;

  function navigate(direction: number) {
    setSelected(current => coverGalleryIndex(current, direction, slides.length));
  }

  function close() {
    setOpen(false);
  }

  if (!src) return null;

  return <>
    {!eager && (coverPhoto
      ? <link rel="preload" as="image" type="image/avif" media="(min-width: 1024px)"
          imageSrcSet={coverPhoto.avif} imageSizes={imageSizes[layout]} fetchPriority="high"/>
      : <DesktopImagePreload src={catalogImageUrl(slides[0])} sizes={imageSizes[layout]}/>)}
    <div className={`relative w-full ${layout === "wide" ? "mt-6" : ""} ${className}`}>
      <button ref={trigger} type="button" aria-haspopup="dialog" aria-expanded={open}
        aria-label={`Увеличить титульное изображение: ${name}`} onClick={() => setOpen(true)}
        className="group block w-full cursor-zoom-in rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-700 dark:focus-visible:outline-brand-300">
        <span className={`relative block overflow-hidden rounded-xl bg-white ${layout === "compact" ? "aspect-[4/3] sm:aspect-video" : "aspect-[2/1]"} ${layout === "banner" ? "sm:aspect-[5/2]" : ""}`}>
          <PreparedPhoto key={src} photo={index === 0 ? coverPhoto : undefined} src={catalogImageUrl(src)} alt={photoName} fill sizes={imageSizes[layout]}
            loading={eager ? "eager" : undefined} fetchPriority={eager ? "high" : undefined}
            className={layout === "banner" || hasSlides ? "object-cover object-center" : "object-contain object-center"}/>
          <span aria-hidden="true" className={`pointer-events-none absolute flex size-9 items-center justify-center rounded-full bg-slate-950/70 text-white shadow-sm transition-colors group-hover:bg-slate-950/90 ${layout === "compact" ? "bottom-1 right-1 sm:bottom-3 sm:right-3" : "bottom-3 right-3"}`}>
            <Icon name="zoom-in"/>
          </span>
        </span>
      </button>
      {hasSlides && <>
        <CoverGalleryNavigation onPrevious={() => navigate(-1)} onNext={() => navigate(1)} className={layout === "compact" ? "max-sm:hidden" : ""}/>
        <p aria-live="polite" aria-atomic="true" className={`pointer-events-none absolute rounded-full bg-slate-950/70 py-1 text-xs font-medium tabular-nums text-white ${layout === "compact" ? "bottom-1 left-1 px-2 sm:bottom-3 sm:left-3 sm:px-3" : "bottom-3 left-3 px-3"}`}>
          <span className="sr-only">Фотография </span>{index + 1}<span aria-hidden="true"> / </span><span className="sr-only"> из </span>{slides.length}
        </p>
      </>}
    </div>
    {open && createPortal(<CatalogCoverViewer name={name} images={slides} index={index}
      onPrevious={() => navigate(-1)} onNext={() => navigate(1)} onClose={close} trigger={trigger}/>, document.body)}
  </>;
}
