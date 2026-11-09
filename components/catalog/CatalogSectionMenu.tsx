"use client";

import {useEffect, useRef, type ReactNode} from "react";

export function CatalogTypeNavigation({children}: {children: ReactNode}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const revealActiveLink = () => {
      const activeLink = container.querySelector<HTMLElement>('[aria-current="page"]');
      if (!activeLink) return;

      const containerBounds = container.getBoundingClientRect();
      const activeBounds = activeLink.getBoundingClientRect();
      if (activeBounds.left >= containerBounds.left && activeBounds.right <= containerBounds.right) return;

      const centerOffset = Math.max(0, (container.clientWidth - activeBounds.width) / 2);
      container.scrollLeft += activeBounds.left - containerBounds.left - centerOffset;
    };

    revealActiveLink();
    const observer = new ResizeObserver(revealActiveLink);
    observer.observe(container);
    return () => observer.disconnect();
  }, [children]);

  return <div ref={containerRef} className="flex min-w-0 flex-1 gap-2 overflow-x-auto" aria-label="Подкатегории">
    {children}
  </div>;
}

export function CatalogSectionMenu({children}: {children: ReactNode}) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const summaryRef = useRef<HTMLElement>(null);

  useEffect(() => {
    function closeOnOutsideClick(event: PointerEvent) {
      const details = detailsRef.current;
      if (details?.open && event.target instanceof Node && !details.contains(event.target)) {
        details.open = false;
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      const details = detailsRef.current;
      if (event.key !== "Escape" || !details?.open) return;
      event.preventDefault();
      details.open = false;
      summaryRef.current?.focus({preventScroll: true});
    }

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  return <details ref={detailsRef} className="group shrink-0"
    onClick={event => {
      if (event.target instanceof Element && event.target.closest("a[href]")) {
        event.currentTarget.open = false;
      }
    }}>
    <summary ref={summaryRef}
      className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 dark:border-slate-600 dark:bg-slate-900 dark:focus-visible:outline-brand-300">
      Все разделы <span aria-hidden="true" className="transition-transform group-open:rotate-180">⌄</span>
    </summary>
    {children}
  </details>;
}
