"use client";

import {useEffect, useRef, useState} from "react";
import Image from "next/image";
import {catalogImageUrl} from "@/lib/catalog-image";
import {DesktopImagePreload} from "./DesktopImagePreload";

const imageSizes = "(min-width: 768px) 672px, (min-width: 640px) calc(100vw - 40px), calc(100vw - 32px)";

export function ProductImageViewer({src, name}: {src: string; name: string}) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const imageUrl = catalogImageUrl(src);

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
      <DesktopImagePreload src={imageUrl} sizes={imageSizes}/>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label={`Увеличить изображение: ${name}`}
        className="group mx-auto mt-6 block w-full max-w-2xl cursor-zoom-in rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-slate-600 dark:focus-visible:outline-red-300"
      >
        <span className="relative block aspect-[2/1] overflow-hidden rounded-xl bg-white">
          <Image src={imageUrl} alt={name} fill
            sizes={imageSizes}
            className="object-contain object-center"/>
          <span aria-hidden="true" className="absolute bottom-3 right-3 rounded-lg bg-slate-950/80 px-3 py-1.5 text-xs font-semibold text-white transition group-hover:bg-slate-950">
            Увеличить
          </span>
        </span>
      </button>

      <dialog
        ref={dialogRef}
        aria-label={`Просмотр изображения: ${name}`}
        onCancel={event => {event.preventDefault(); setOpen(false);}}
        onClose={() => setOpen(false)}
        className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none border-0 bg-slate-950 p-4 text-white sm:p-6 backdrop:bg-black/80"
      >
          <button type="button" onClick={() => setOpen(false)}
            aria-label="Закрыть увеличенное изображение и вернуться к товарам"
            className="relative block h-full w-full cursor-zoom-out rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
            {open && <Image src={imageUrl} alt={name} fill unoptimized loading="eager" sizes="100vw"
              className="object-contain object-center"/>}
          </button>
      </dialog>
    </>
  );
}
