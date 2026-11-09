"use client";

import {useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type RefObject} from "react";
import Image from "next/image";
import {Icon} from "@/components/ui/Icon";
import {catalogImageUrl} from "@/lib/catalog-image";
import {clampImagePan, imageViewGeometry, type ImageSize} from "@/lib/imageViewer";
import {CoverGalleryNavigation} from "./CoverGalleryNavigation";
import focusStyles from "./CatalogFocus.module.css";

type Actions = {onPrevious: () => void; onNext: () => void; onClose: () => void};

export function CatalogCoverViewer({images, index, name, trigger, ...actions}: Actions & {
  images: readonly string[];
  index: number;
  name: string;
  trigger: RefObject<HTMLButtonElement | null>;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current!;
    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    dialog.showModal();
    const button = trigger.current;
    return () => {
      document.documentElement.style.overflow = previousOverflow;
      dialog.close();
      if (button?.isConnected) button.focus({preventScroll: true});
    };
  }, [trigger]);

  function trapFocus(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== "Tab") return;
    const buttons = [...event.currentTarget.querySelectorAll<HTMLButtonElement>("button:not(:disabled)")]
      .filter(button => button.getClientRects().length);
    const first = buttons[0];
    const last = buttons[buttons.length - 1];
    if (first && last && (event.shiftKey ? document.activeElement === first : document.activeElement === last)) {
      event.preventDefault();
      (event.shiftKey ? last : first).focus();
    }
  }

  return <dialog ref={dialogRef} aria-label={`Просмотр титульных фотографий: ${name}`}
    onCancel={event => {event.preventDefault(); actions.onClose();}}
    onClose={event => {if (!event.currentTarget.open) actions.onClose();}}
    onClick={event => {if (event.target === event.currentTarget) actions.onClose();}}
    onKeyDown={trapFocus}
    className="fixed inset-0 m-auto w-fit max-h-none max-w-none overflow-hidden rounded-[28px] border-0 bg-white p-4 text-slate-900 shadow-2xl ring-1 ring-slate-200 backdrop:bg-black/75 dark:bg-slate-950 dark:text-white dark:ring-slate-600">
    <CoverPhoto key={images[index]} src={images[index]} name={name} index={index} count={images.length} {...actions}/>
  </dialog>;
}

function CoverPhoto({src, name, index, count, onPrevious, onNext, onClose}: Actions & {
  src: string; name: string; index: number; count: number;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [source, setSource] = useState<ImageSize>({width: 0, height: 0});
  const [viewport, setViewport] = useState<ImageSize>({width: 0, height: 0});
  const [failed, setFailed] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [pan, setPan] = useState({x: 0, y: 0});
  const gesture = useRef({id: null as number | null, x: 0, y: 0, panX: 0, panY: 0, moved: false});
  const geometry = imageViewGeometry(source, viewport, zoomed);
  const visiblePan = zoomed ? clampImagePan(pan, geometry.limit) : {x: 0, y: 0};
  const ratio = source.width && source.height ? source.width / source.height : 2;
  const width = source.width ? Math.min(1168, source.width) : 1168;

  useEffect(() => {
    const element = viewportRef.current!;
    const observer = new ResizeObserver(() => setViewport({width: element.clientWidth, height: element.clientHeight}));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  function start(event: PointerEvent<HTMLButtonElement>) {
    if (event.button !== 0 || event.isPrimary === false) return;
    gesture.current = {id: event.pointerId, x: event.clientX, y: event.clientY, panX: visiblePan.x, panY: visiblePan.y, moved: false};
    if (zoomed) event.currentTarget.setPointerCapture(event.pointerId);
  }

  function move(event: PointerEvent<HTMLButtonElement>) {
    const current = gesture.current;
    if (current.id !== event.pointerId || event.buttons !== 1) return;
    const x = event.clientX - current.x;
    const y = event.clientY - current.y;
    if (Math.hypot(x, y) > 8) current.moved = true;
    if (zoomed && current.moved) setPan(clampImagePan({x: current.panX + x, y: current.panY + y}, geometry.limit));
  }

  function end(event: PointerEvent<HTMLButtonElement>) {
    if (gesture.current.id !== event.pointerId) return;
    gesture.current.id = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function keyboard(event: KeyboardEvent<HTMLDivElement>) {
    const directions = {ArrowLeft: [40, 0], ArrowRight: [-40, 0], ArrowUp: [0, 40], ArrowDown: [0, -40]}[event.key];
    if (zoomed && directions) {
      event.preventDefault();
      setPan(clampImagePan({x: visiblePan.x + directions[0], y: visiblePan.y + directions[1]}, geometry.limit));
    } else if (count > 1 && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
      event.preventDefault();
      (event.key === "ArrowLeft" ? onPrevious : onNext)();
    }
  }

  return <div ref={viewportRef} onKeyDown={keyboard} className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-950"
    style={{width: `min(${width}px, calc(100vw - 64px), calc((88dvh - 32px) * ${ratio}))`, aspectRatio: ratio}}>
    <button type="button" autoFocus aria-label={`Вернуть изображение на страницу: ${name}`}
      onClick={event => {if (!gesture.current.moved || event.detail === 0) onClose();}}
      onPointerDown={start} onPointerMove={move} onPointerUp={end}
      onPointerCancel={() => {gesture.current.id = null; gesture.current.moved = true;}}
      className={`${focusStyles.inset} absolute inset-0 block size-full cursor-zoom-out touch-none select-none rounded-2xl bg-transparent p-0 ${zoomed ? "active:cursor-grabbing" : ""}`}>
      <span className="pointer-events-none absolute left-1/2 top-1/2 block" style={{width: geometry.width || "100%", height: geometry.height || "100%",
        transform: `translate(calc(-50% + ${visiblePan.x}px), calc(-50% + ${visiblePan.y}px))`}}>
        <Image src={catalogImageUrl(src)} alt={index === 0 ? name : `${name} — фото ${index + 1}`} fill unoptimized draggable={false}
          loading="eager" sizes="100vw" className="object-contain object-center"
          onLoad={event => setSource({width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight})}
          onError={() => setFailed(true)}/>
      </span>
    </button>
    {count > 1 && <>
      <CoverGalleryNavigation onPrevious={onPrevious} onNext={onNext}/>
      <p role="status" aria-live="polite" aria-atomic="true" className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-slate-950/75 px-3 py-1 text-xs font-medium tabular-nums text-white">
        <span className="sr-only">Фотография </span>{index + 1}<span aria-hidden="true"> / </span><span className="sr-only"> из </span>{count}
      </p>
    </>}
    <div className="absolute right-2 top-2 flex gap-2">
      <button type="button" onClick={() => {setZoomed(value => !value); setPan({x: 0, y: 0});}}
        disabled={(!geometry.canZoom && !zoomed) || failed} aria-pressed={zoomed}
        aria-label={zoomed ? "Вписать титульное фото в окно" : "Показать титульное фото в масштабе 1:1"}
        className="min-h-11 cursor-pointer rounded-lg border border-white/20 bg-slate-900/70 px-3 text-sm font-semibold text-white shadow-sm backdrop-blur-sm hover:bg-slate-900/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:hidden">
        {zoomed ? "Вписать" : "100%"}
      </button>
      <button type="button" onClick={onClose} aria-label="Закрыть просмотр титульного фото"
        className="flex size-11 cursor-pointer items-center justify-center rounded-lg border border-white/20 bg-slate-900/70 text-white shadow-sm backdrop-blur-sm hover:bg-slate-900/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
        <Icon name="close"/>
      </button>
    </div>
    {zoomed && <p className={`pointer-events-none absolute left-1/2 max-w-[75%] -translate-x-1/2 rounded-lg bg-slate-950/75 px-3 py-2 text-center text-xs text-white ${count > 1 ? "bottom-14" : "bottom-3"}`}>
      Перетащите фото для просмотра деталей
    </p>}
    {failed ? <p role="alert" className="pointer-events-none absolute inset-0 flex items-center justify-center p-6 text-center text-sm">
      Не удалось загрузить фото. {count > 1 ? "Выберите другое изображение или закройте просмотр." : "Закройте просмотр и попробуйте ещё раз."}
    </p>
      : !source.width && <p role="status" className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm">Загрузка фотографии…</p>}
  </div>;
}
