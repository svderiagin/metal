"use client";

import {useEffect, useRef, useState, type ReactNode, type MouseEvent, type PointerEvent, type KeyboardEvent} from "react";
import {createPortal} from "react-dom";
import Image from "next/image";
import {Icon} from "@/components/ui/Icon";
import {catalogImageUrl} from "@/lib/catalog-image";
import {clampImagePan, imageViewGeometry, imageZoomPan, type ImageSize} from "@/lib/imageViewer";
import {DesktopImagePreload} from "./DesktopImagePreload";
import focusStyles from "./CatalogFocus.module.css";

const imageSizes = "(min-width: 768px) 672px, (min-width: 640px) calc(100vw - 40px), calc(100vw - 32px)";

type Presentation = "page" | "table" | "card" | "catalog" | "compact";

export function ProductImageViewer({src, previewSrc = src, name, presentation = "page", caption, framed = false, expanded = false}: {
  src: string;
  previewSrc?: string;
  name: string;
  presentation?: Presentation;
  caption?: ReactNode;
  framed?: boolean;
  expanded?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [pan, setPan] = useState({x: 0, y: 0});
  const [sourceSize, setSourceSize] = useState<ImageSize>({width: 0, height: 0});
  const [viewportSize, setViewportSize] = useState<ImageSize>({width: 0, height: 0});
  const [failed, setFailed] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const imageViewportRef = useRef<HTMLDivElement>(null);
  const imageGesture = useRef({x: 0, y: 0, panX: 0, panY: 0, moved: false, pointerId: null as number | null});
  const imageUrl = catalogImageUrl(src);
  const isPreview = presentation !== "page";
  const isReferencePreview = presentation === "table" || presentation === "card";
  const geometry = imageViewGeometry(sourceSize, viewportSize, zoomed);
  const visiblePan = zoomed ? clampImagePan(pan, geometry.limit) : {x: 0, y: 0};
  const triggerSizes = presentation === "table" ? "176px"
    : presentation === "compact" ? "96px"
      : presentation === "catalog" ? "auto, (max-width: 640px) 90vw, 360px"
        : presentation === "card" ? "160px" : imageSizes;
  const triggerLayout = presentation === "table" ? "w-44 max-w-full"
    : presentation === "compact" ? "mb-2 h-16 w-24 max-w-full"
      : presentation === "catalog" ? "mb-5 w-full"
        : presentation === "card" ? "w-full" : "mt-6 w-full max-w-2xl";

  function show() {
    setZoomed(false);
    setPan({x: 0, y: 0});
    setSourceSize({width: 0, height: 0});
    setFailed(false);
    setOpen(true);
  }

  function close() {
    setOpen(false);
    setZoomed(false);
    setPan({x: 0, y: 0});
  }

  function toggleImageZoom(event: MouseEvent<HTMLButtonElement>, atPointer = false) {
    if (atPointer && event.detail > 0 && imageGesture.current.moved) return;
    if (!zoomed && !geometry.canZoom) return;
    const bounds = imageViewportRef.current?.getBoundingClientRect();
    const original = imageViewGeometry(sourceSize, viewportSize, true);
    setPan(!zoomed && atPointer && event.detail > 0 && bounds
      ? imageZoomPan({x: event.clientX - bounds.left - bounds.width / 2,
        y: event.clientY - bounds.top - bounds.height / 2}, geometry.fitScale, original.limit)
      : {x: 0, y: 0});
    setZoomed(value => !value);
  }

  function beginImageGesture(event: PointerEvent<HTMLButtonElement>) {
    if (event.button !== 0 || event.isPrimary === false) return;
    imageGesture.current = {x: event.clientX, y: event.clientY,
      panX: visiblePan.x, panY: visiblePan.y, moved: false, pointerId: event.pointerId};
    if (zoomed) event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveImageGesture(event: PointerEvent<HTMLButtonElement>) {
    const gesture = imageGesture.current;
    if (event.pointerId !== gesture.pointerId || event.buttons !== 1) return;
    const dx = event.clientX - gesture.x;
    const dy = event.clientY - gesture.y;
    if (Math.hypot(dx, dy) > 8) gesture.moved = true;
    if (zoomed && gesture.moved) {
      setPan(clampImagePan({x: gesture.panX + dx, y: gesture.panY + dy}, geometry.limit));
    }
  }

  function endImageGesture(event: PointerEvent<HTMLButtonElement>) {
    if (event.pointerId !== imageGesture.current.pointerId) return;
    imageGesture.current.pointerId = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    const viewport = imageViewportRef.current;
    if (!dialog || !viewport) return;
    const trigger = triggerRef.current;
    const previousOverflow = document.documentElement.style.overflow;
    dialog.showModal();
    document.documentElement.style.overflow = "hidden";
    const observer = new ResizeObserver(() => {
      setViewportSize({width: viewport.clientWidth, height: viewport.clientHeight});
    });
    observer.observe(viewport);
    return () => {
      observer.disconnect();
      dialog.close();
      document.documentElement.style.overflow = previousOverflow;
      if (trigger?.isConnected) {
        const visibleTrigger = trigger.getClientRects().length ? trigger
          : Array.from(document.querySelectorAll<HTMLButtonElement>('button[aria-haspopup="dialog"]'))
            .find(button => button.ariaLabel === trigger.ariaLabel && button.getClientRects().length);
        visibleTrigger?.focus({preventScroll: true});
      }
    };
  }, [open]);

  function handleDialogKeyDown(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key === "Tab") {
      const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>("button:not(:disabled), a[href]"))
        .filter(control => control.getClientRects().length > 0);
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (first && last && ((!event.shiftKey && document.activeElement === last) || (event.shiftKey && document.activeElement === first))) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      }
      return;
    }
    if (!zoomed) return;
    const direction = {ArrowLeft: [40, 0], ArrowRight: [-40, 0], ArrowUp: [0, 40], ArrowDown: [0, -40]}[event.key];
    if (!direction) return;
    event.preventDefault();
    setPan(clampImagePan({x: visiblePan.x + direction[0], y: visiblePan.y + direction[1]}, geometry.limit));
  }

  return (
    <>
      {!isPreview && <DesktopImagePreload src={imageUrl} sizes={imageSizes}/>}
      <button ref={triggerRef} type="button" onClick={show} aria-haspopup="dialog"
        aria-label={`Увеличить изображение: ${name}`}
        style={presentation === "table" ? {width: 176} : undefined}
        className={`group mx-auto block cursor-pointer rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-slate-600 dark:focus-visible:outline-brand-300 ${triggerLayout}`}>
        <span className={`relative block overflow-hidden rounded-xl bg-white ${presentation === "compact" ? "h-full w-full" : isReferencePreview ? "aspect-[4/3]" : "aspect-[2/1]"} ${isReferencePreview ? framed ? "shadow-[0_1px_3px_rgba(15,23,42,0.12)]" : "ring-1 ring-inset ring-slate-200" : ""}`}>
          <Image src={catalogImageUrl(previewSrc)} alt={name} fill sizes={triggerSizes}
            className={`object-contain object-center ${isReferencePreview && !framed ? "p-1.5" : ""}`}/>
          {/* Overlay the frame so it does not shrink the image's 4:3 content box. */}
          {isReferencePreview && framed && <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-xl border border-slate-300 dark:border-slate-600"/>}
          {isPreview ? <span aria-hidden="true" className="absolute bottom-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-md bg-slate-950/75 text-white transition group-hover:bg-slate-950">
            <Icon name="expand"/>
          </span> : <span aria-hidden="true" className="absolute bottom-3 right-3 rounded-lg bg-slate-950/80 px-3 py-1.5 text-xs font-semibold text-white transition group-hover:bg-slate-950">Увеличить</span>}
        </span>
      </button>

      {open && createPortal(<dialog ref={dialogRef} aria-label={`Просмотр изображения: ${name}`}
        onCancel={event => {event.preventDefault(); close();}} onClose={close}
        onKeyDown={handleDialogKeyDown}
        onClick={event => {if (isPreview && event.target === event.currentTarget) close();}}
        style={isPreview ? {width: "min(1000px, calc(100vw - 32px), calc((90dvh - 32px) * 4 / 3 + 32px))"} : undefined}
        className={isPreview
          ? "fixed inset-0 m-auto max-h-none max-w-none overflow-hidden rounded-[28px] border-0 bg-white p-4 text-slate-900 shadow-2xl ring-1 ring-slate-200 backdrop:bg-black/75 dark:bg-slate-950 dark:text-white dark:ring-slate-600"
          : "fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none overflow-hidden border-0 bg-slate-100 p-0 text-slate-900 dark:bg-slate-950 dark:text-white backdrop:bg-black/80"}>
        {open && <div className={isPreview ? "relative flex aspect-[4/3] w-full min-h-0 flex-col" : "flex h-full min-h-0 flex-col pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)]"}>
          {!isPreview && <div className="flex shrink-0 items-center gap-2 border-b border-slate-200 px-3 py-2 dark:border-slate-700 sm:px-5">
            <h2 className="min-w-0 flex-1 truncate text-left text-sm font-semibold sm:text-base" title={name}>{name}</h2>
            <button type="button" onClick={event => toggleImageZoom(event)} disabled={(!geometry.canZoom && !zoomed) || failed}
              aria-label={zoomed ? "Вписать изображение в экран" : "Показать оригинал в масштабе 1:1"} aria-pressed={zoomed}
              className="min-h-11 shrink-0 cursor-pointer rounded-lg border border-slate-300 px-3 text-sm font-semibold hover:bg-slate-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600 disabled:cursor-default disabled:opacity-50 dark:border-slate-600 dark:hover:bg-slate-800 dark:focus-visible:outline-brand-300">
              {zoomed ? "Вписать" : "100%"}
            </button>
            <button type="button" onClick={close} aria-label="Закрыть просмотр"
              className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-lg hover:bg-slate-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600 dark:hover:bg-slate-800 dark:focus-visible:outline-brand-300">
              <Icon name="close"/>
            </button>
          </div>}
          <div ref={imageViewportRef} className={`relative min-h-0 flex-1 overflow-hidden ${isPreview ? "rounded-xl" : ""}`}>
            <button type="button" autoFocus onClick={event => toggleImageZoom(event, true)} aria-label="Увеличение изображения" aria-pressed={zoomed}
              title={zoomed ? "Нажмите, чтобы вписать изображение. Перетаскивайте для просмотра деталей" : "Нажмите для просмотра в масштабе 1:1"}
              disabled={(!geometry.canZoom && !zoomed) || failed}
              onPointerDown={beginImageGesture} onPointerMove={moveImageGesture} onPointerUp={endImageGesture}
              onPointerCancel={() => {imageGesture.current.moved = true; imageGesture.current.pointerId = null;}}
              className={`${focusStyles.inset} absolute inset-0 block h-full w-full touch-none select-none border-0 bg-transparent p-0 ${zoomed ? "cursor-zoom-out active:cursor-grabbing" : geometry.canZoom ? "cursor-zoom-in" : "cursor-default"}`}>
              <span className="pointer-events-none absolute left-1/2 top-1/2 block" style={{width: geometry.width || "100%", height: geometry.height || "100%",
                transform: `translate(calc(-50% + ${visiblePan.x}px), calc(-50% + ${visiblePan.y}px))`}}>
                <Image src={imageUrl} alt={name} fill unoptimized draggable={false} loading="eager" sizes="100vw"
                  onLoad={event => setSourceSize({width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight})}
                  onError={() => setFailed(true)} className="object-contain object-center"/>
              </span>
            </button>
            {isPreview && <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-xl shadow-[inset_0_0_8px_2px_#fff] dark:shadow-[inset_0_0_8px_2px_var(--color-slate-950)]"/>}
            {failed ? <p role="alert" className="pointer-events-none absolute inset-0 flex items-center justify-center p-6 text-center text-sm">Не удалось загрузить изображение.</p>
              : !sourceSize.width ? <p role="status" className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm">Загрузка изображения…</p>
                : zoomed && <p role="status" className="pointer-events-none absolute inset-x-3 bottom-3 mx-auto w-fit max-w-[calc(100%-1.5rem)] rounded-lg bg-slate-950/80 px-3 py-2 text-center text-xs leading-4 text-white sm:text-sm">
                  <span className="[@media(pointer:coarse)]:hidden">Перетаскивайте изображение мышью или используйте клавиши со стрелками</span>
                  <span className="hidden [@media(pointer:coarse)]:inline">Перетаскивайте изображение пальцем</span>
                </p>}
          </div>
          {isPreview && <button type="button" onClick={close} aria-label="Закрыть просмотр" title="Закрыть (Esc)"
            className="absolute right-2 top-2 z-10 flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg border border-white/15 bg-slate-900/45 text-white/90 shadow-sm backdrop-blur-sm transition-colors hover:bg-slate-900/75 hover:text-white focus-visible:bg-slate-900/75 focus-visible:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:bg-slate-950/90">
            <Icon name="close"/>
          </button>}
          {caption && !expanded && <div className="max-h-[15dvh] shrink-0 overflow-y-auto border-t border-slate-200 px-4 py-2 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">{caption}</div>}
        </div>}
      </dialog>, document.body)}
    </>
  );
}
