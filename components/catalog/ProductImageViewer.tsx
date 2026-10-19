"use client";

import {useEffect, useRef, useState, type ReactNode} from "react";
import Image from "next/image";
import {catalogImageUrl} from "@/lib/catalog-image";
import {DesktopImagePreload} from "./DesktopImagePreload";

const imageSizes = "(min-width: 768px) 672px, (min-width: 640px) calc(100vw - 40px), calc(100vw - 32px)";

export function ProductImageViewer({src, name, presentation = "page", caption}: {
  src: string;
  name: string;
  presentation?: "page" | "table" | "card";
  caption?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const imageUrl = catalogImageUrl(src);
  const isPreview = presentation !== "page";
  const triggerSizes = presentation === "table" ? "176px" : presentation === "card" ? "(max-width: 640px) 80vw, 320px" : imageSizes;

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const trigger = triggerRef.current;
    const previousOverflow = document.documentElement.style.overflow;
    dialog.showModal();
    document.documentElement.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.documentElement.style.overflow = previousOverflow;
      if (trigger?.isConnected) trigger.focus({preventScroll: true});
    };
  }, [open]);

  return (
    <>
      {!isPreview && <DesktopImagePreload src={imageUrl} sizes={imageSizes}/>}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label={`Увеличить изображение: ${name}`}
        style={presentation === "table" ? {width: 176} : undefined}
        className={`group mx-auto block cursor-zoom-in rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-slate-600 dark:focus-visible:outline-red-300 ${presentation === "table" ? "w-44 max-w-full" : presentation === "card" ? "mb-4 w-full" : "mt-6 w-full max-w-2xl"}`}
      >
        <span className={`relative block overflow-hidden rounded-xl bg-white ${isPreview ? "aspect-[4/3] ring-1 ring-inset ring-slate-200" : "aspect-[2/1]"}`}>
          <Image src={imageUrl} alt={name} fill
            sizes={triggerSizes}
            className={`object-contain object-center ${isPreview ? "p-1.5" : ""}`}/>
          {isPreview ? <span aria-hidden="true" className="absolute bottom-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-md bg-slate-950/75 text-white transition group-hover:bg-slate-950">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-4 w-4"><path d="M9 3H3v6m12-6h6v6M3 15v6h6m12-6v6h-6"/></svg>
          </span> : <span aria-hidden="true" className="absolute bottom-3 right-3 rounded-lg bg-slate-950/80 px-3 py-1.5 text-xs font-semibold text-white transition group-hover:bg-slate-950">Увеличить</span>}
        </span>
      </button>

      <dialog
        ref={dialogRef}
        aria-label={`Просмотр изображения: ${name}`}
        onCancel={event => {event.preventDefault(); setOpen(false);}}
        onClose={() => setOpen(false)}
        onClick={event => {if (isPreview && event.target === event.currentTarget) setOpen(false);}}
        className={isPreview ? "fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-0 text-slate-900 shadow-2xl dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 backdrop:bg-black/75" : "fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none border-0 bg-slate-950 p-4 text-white sm:p-6 backdrop:bg-black/80"}
      >
        {isPreview ? open && <>
          <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-4 py-2 dark:border-slate-700 sm:px-6">
            <h2 className="text-lg font-bold">{name}</h2>
            <button type="button" onClick={() => setOpen(false)} aria-label="Закрыть просмотр" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600 dark:hover:bg-slate-800 dark:focus-visible:outline-red-300">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><path d="m6 6 12 12M6 18 18 6"/></svg>
            </button>
          </div>
          <div className="relative aspect-[4/3] max-h-[60dvh] w-full bg-white">
            <Image src={imageUrl} alt={name} fill loading="eager" sizes="(max-width: 768px) calc(100vw - 32px), 768px" className="object-contain p-3 sm:p-4"/>
          </div>
          {caption && <div className="border-t border-slate-200 p-4 text-left text-sm font-normal leading-relaxed text-slate-600 dark:border-slate-700 dark:text-slate-300 sm:p-6">{caption}</div>}
        </> : <button type="button" onClick={() => setOpen(false)}
            aria-label="Закрыть увеличенное изображение и вернуться к товарам"
            className="relative block h-full w-full cursor-zoom-out rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
            {open && <Image src={imageUrl} alt={name} fill unoptimized loading="eager" sizes="100vw"
              className="object-contain object-center"/>}
          </button>
        }
      </dialog>
    </>
  );
}
