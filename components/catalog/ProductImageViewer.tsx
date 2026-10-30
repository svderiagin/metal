"use client";

import {useEffect, useRef, useState, type ReactNode, type MouseEvent, type PointerEvent, type KeyboardEvent} from "react";
import Image from "next/image";
import {catalogImageUrl} from "@/lib/catalog-image";
import {DesktopImagePreload} from "./DesktopImagePreload";

const imageSizes = "(min-width: 768px) 672px, (min-width: 640px) calc(100vw - 40px), calc(100vw - 32px)";

export function ProductImageViewer({src, name, presentation = "page", caption, framed = false, expanded = false}: {
  src: string;
  name: string;
  presentation?: "page" | "table" | "card";
  caption?: ReactNode;
  framed?: boolean;
  expanded?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [pan, setPan] = useState({x: 0, y: 0});
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const imageViewportRef = useRef<HTMLDivElement>(null);
  const imageGesture = useRef({x: 0, y: 0, panX: 0, panY: 0, moved: false});
  const imageUrl = catalogImageUrl(src);
  const isPreview = presentation !== "page";
  const isExpandedPreview = isPreview && expanded;
  const triggerSizes = presentation === "table" ? "176px" : presentation === "card" ? "(max-width: 640px) 80vw, 320px" : imageSizes;

  function close() {
    setOpen(false);
    setZoomed(false);
    setPan({x: 0, y: 0});
  }

  function toggleImageZoom(event: MouseEvent<HTMLButtonElement>) {
    if (event.detail > 0 && imageGesture.current.moved) return;
    const bounds = imageViewportRef.current?.getBoundingClientRect();
    if (!zoomed) {
      setPan(event.detail > 0 && bounds
        ? {x: bounds.width / 2 - Math.max(0, Math.min(bounds.width, event.clientX - bounds.left)),
          y: bounds.height / 2 - Math.max(0, Math.min(bounds.height, event.clientY - bounds.top))}
        : {x: 0, y: 0});
    }
    setZoomed(value => !value);
  }

  function beginImageGesture(event: PointerEvent<HTMLButtonElement>) {
    if (event.button !== 0 || event.isPrimary === false) return;
    imageGesture.current = {x: event.clientX, y: event.clientY,
      panX: pan.x, panY: pan.y, moved: false};
    if (zoomed) event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveImageGesture(event: PointerEvent<HTMLButtonElement>) {
    if (event.buttons !== 1) return;
    const gesture = imageGesture.current;
    const dx = event.clientX - gesture.x;
    const dy = event.clientY - gesture.y;
    if (Math.hypot(dx, dy) > 8) gesture.moved = true;
    const viewport = imageViewportRef.current;
    if (zoomed && gesture.moved && viewport) {
      setPan({x: Math.max(-viewport.clientWidth / 2, Math.min(viewport.clientWidth / 2, gesture.panX + dx)),
        y: Math.max(-viewport.clientHeight / 2, Math.min(viewport.clientHeight / 2, gesture.panY + dy))});
    }
  }

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

  function moveImageWithKeyboard(event: KeyboardEvent<HTMLButtonElement>) {
    if (!zoomed) return;
    const direction = {ArrowLeft: [40, 0], ArrowRight: [-40, 0], ArrowUp: [0, 40], ArrowDown: [0, -40]}[event.key];
    const viewport = imageViewportRef.current;
    if (!direction || !viewport) return;
    event.preventDefault();
    setPan(value => ({x: Math.max(-viewport.clientWidth / 2, Math.min(viewport.clientWidth / 2, value.x + direction[0])),
      y: Math.max(-viewport.clientHeight / 2, Math.min(viewport.clientHeight / 2, value.y + direction[1]))}));
  }

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
        <span className={`relative block overflow-hidden rounded-xl bg-white ${isPreview ? framed ? "aspect-[4/3] border border-slate-300 shadow-[0_1px_3px_rgba(15,23,42,0.12),inset_0_0_0_1px_rgba(255,255,255,0.85)] dark:border-slate-600" : "aspect-[4/3] ring-1 ring-inset ring-slate-200" : "aspect-[2/1]"}`}>
          <Image src={imageUrl} alt={name} fill
            sizes={triggerSizes}
            className={`object-contain object-center ${isPreview && !framed ? "p-1.5" : ""}`}/>
          {isPreview ? <span aria-hidden="true" className="absolute bottom-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-md bg-slate-950/75 text-white transition group-hover:bg-slate-950">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-4 w-4"><path d="M9 3H3v6m12-6h6v6M3 15v6h6m12-6v6h-6"/></svg>
          </span> : <span aria-hidden="true" className="absolute bottom-3 right-3 rounded-lg bg-slate-950/80 px-3 py-1.5 text-xs font-semibold text-white transition group-hover:bg-slate-950">Увеличить</span>}
        </span>
      </button>

      <dialog
        ref={dialogRef}
        aria-label={`Просмотр изображения: ${name}`}
        onCancel={event => {event.preventDefault(); close();}}
        onClose={close}
        onClick={event => {if (isPreview && event.target === event.currentTarget) close();}}
        style={isExpandedPreview ? {width: "min(1000px, calc(100vw - 32px), calc((90dvh - 32px) * 4 / 3 + 32px))"} : undefined}
        className={isExpandedPreview
          ? "fixed inset-0 m-auto max-h-none max-w-none overflow-hidden rounded-[28px] border-0 bg-white p-4 text-slate-900 shadow-2xl ring-1 ring-slate-200 backdrop:bg-black/75 dark:bg-slate-950 dark:text-white dark:ring-slate-600"
          : isPreview ? "fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-0 text-slate-900 shadow-2xl dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 backdrop:bg-black/75" : "fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none border-0 bg-slate-950 p-4 text-white sm:p-6 backdrop:bg-black/80"}
      >
        {isExpandedPreview ? open && <>
          <div ref={imageViewportRef} className="relative aspect-[4/3] w-full overflow-hidden rounded-xl">
            <button type="button" autoFocus onClick={toggleImageZoom} aria-label="Увеличение изображения" aria-pressed={zoomed}
              title={zoomed ? "Нажмите, чтобы уменьшить. Перетащите, чтобы рассмотреть детали" : "Нажмите, чтобы увеличить в 2 раза"}
              onPointerDown={beginImageGesture} onPointerMove={moveImageGesture} onKeyDown={moveImageWithKeyboard}
              onPointerCancel={() => {imageGesture.current.moved = true;}}
              className={`absolute inset-0 block h-full w-full select-none border-0 bg-transparent p-0 focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-white ${zoomed ? "touch-none cursor-zoom-out active:cursor-grabbing" : "touch-pan-y cursor-zoom-in"}`}>
              <span className="pointer-events-none absolute inset-0 block" style={{transform: zoomed ? `translate(${pan.x}px, ${pan.y}px) scale(2)` : "none"}}>
                <Image src={imageUrl} alt={name} fill draggable={false} loading="eager" sizes={zoomed ? "200vw" : "(min-width: 1032px) 968px, calc(100vw - 64px)"} className="object-contain object-center"/>
              </span>
            </button>
          </div>
          <button type="button" onClick={close} aria-label="Закрыть просмотр" title="Закрыть (Esc)"
            className="absolute right-6 top-6 z-10 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-slate-900/45 text-white/90 shadow-sm backdrop-blur-sm transition-colors hover:bg-slate-900/75 hover:text-white focus-visible:bg-slate-900/75 focus-visible:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:bg-slate-950/90">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-5 w-5"><path strokeLinecap="round" d="m6 6 12 12M6 18 18 6"/></svg>
          </button>
        </> : isPreview ? open && <>
          <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-4 py-2 dark:border-slate-700 sm:px-6">
            <h2 className="text-lg font-bold">{name}</h2>
            <button type="button" onClick={close} aria-label="Закрыть просмотр" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600 dark:hover:bg-slate-800 dark:focus-visible:outline-red-300">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><path d="m6 6 12 12M6 18 18 6"/></svg>
            </button>
          </div>
          <div className={framed
            ? "relative mx-3 my-3 aspect-[4/3] max-h-[60dvh] overflow-hidden rounded-xl border border-slate-300 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.10),inset_0_0_0_1px_rgba(255,255,255,0.9)] dark:border-slate-600 sm:mx-4 sm:my-4"
            : "relative aspect-[4/3] max-h-[60dvh] w-full bg-white"}>
            <Image src={imageUrl} alt={name} fill loading="eager" sizes="(max-width: 768px) calc(100vw - 32px), 768px" className={`object-contain ${framed ? "" : "p-3 sm:p-4"}`}/>
          </div>
          {caption && <div className="border-t border-slate-200 p-4 text-left text-sm font-normal leading-relaxed text-slate-600 dark:border-slate-700 dark:text-slate-300 sm:p-6">{caption}</div>}
        </> : <button type="button" onClick={close}
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
