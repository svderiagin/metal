"use client";

import Image from "next/image";
import {type CSSProperties, type ReactNode, useEffect, useMemo, useRef, useState} from "react";
import {PageContainer} from "@/components/layout/PageContainer";
import {AUTO_ROTATE_MS, type HeroSlide} from "@/data/hero-slides";
import styles from "./HeroCarousel.module.css";

type ImageStatus = "ready" | "failed";

export function HeroCarousel({slides, children}: {slides: HeroSlide[]; children: ReactNode}) {
  const hero = useRef<HTMLElement>(null);
  const mounted = useRef(true);
  const gesture = useRef<{x: number; y: number} | null>(null);
  // Первый элемент должен монтироваться и после обновления из пустого списка.
  const [requested, setRequested] = useState(1);
  const [status, setStatus] = useState<Record<string, ImageStatus>>({});
  const [current, setCurrent] = useState(slides[0]?.id ?? "");
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(false);
  const [tabVisible, setTabVisible] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const usable = useMemo(() => slides.filter(slide => status[slide.id] === "ready"), [slides, status]);
  const active = usable.find(slide => slide.id === current) ?? usable[0];
  const canRotate = usable.length > 1;

  useEffect(() => {
    mounted.current = true;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const initialize = window.setTimeout(() => setEnabled(!motion.matches), 0);
    const onMotion = () => {if (motion.matches) setEnabled(false);};
    const onVisibility = () => setTabVisible(!document.hidden);
    motion.addEventListener("change", onMotion);
    document.addEventListener("visibilitychange", onVisibility);
    onVisibility();
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting && entry.intersectionRatio > 0), {threshold: 0});
    if (hero.current) observer.observe(hero.current);
    return () => {
      mounted.current = false;
      window.clearTimeout(initialize);
      observer.disconnect();
      motion.removeEventListener("change", onMotion);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  // Следующий запрос откладывается, но зависший запрос не блокирует остальные.
  // Первый кадр присутствует в серверной HTML-разметке и загружается без lazy-loading.
  useEffect(() => {
    const last = slides[requested - 1];
    if (requested >= slides.length || !last) return;
    const timer = window.setTimeout(() => setRequested(n => Math.min(n + 1, slides.length)), status[last.id] ? 250 : 5000);
    return () => window.clearTimeout(timer);
  }, [requested, slides, status]);

  useEffect(() => {
    if (!enabled || !canRotate || !active || !visible || !tabVisible || hovered || focused) return;
    const timer = window.setTimeout(() => {
      const position = usable.findIndex(slide => slide.id === active.id);
      setCurrent(usable[(position + 1) % usable.length].id);
    }, AUTO_ROTATE_MS);
    return () => window.clearTimeout(timer);
  }, [enabled, canRotate, active, usable, visible, tabVisible, hovered, focused]);

  function move(direction: number) {
    if (!canRotate) return;
    setCurrent(previous => {
      const position = Math.max(0, usable.findIndex(slide => slide.id === previous));
      return usable[(position + direction + usable.length) % usable.length].id;
    });
  }

  const circle = `${styles.control} flex size-12 shrink-0 items-center justify-center rounded-full bg-white text-slate-950 shadow-sm transition-colors hover:bg-slate-200`;

  return <section ref={hero} className={styles.hero} aria-labelledby="home-hero-title" aria-roledescription={canRotate ? "карусель" : undefined}
    onFocusCapture={event => {
      if (!(event.relatedTarget instanceof Node) || !event.currentTarget.contains(event.relatedTarget)) setFocused(true);
    }}
    onBlurCapture={event => {
      if (!(event.relatedTarget instanceof Node) || !event.currentTarget.contains(event.relatedTarget)) setFocused(false);
    }}
    onPointerEnter={event => {if (event.pointerType === "mouse" && window.matchMedia("(hover: hover)").matches) setHovered(true);}}
    onPointerLeave={() => setHovered(false)}
    onTouchStart={event => {
      if (event.touches.length !== 1 || (event.target as Element).closest("a, button")) {gesture.current = null;return;}
      gesture.current = {x: event.touches[0].clientX, y: event.touches[0].clientY};
    }}
    onTouchCancel={() => {gesture.current = null;}}
    onTouchEnd={event => {
      const start = gesture.current;gesture.current = null;
      if (!start || !event.changedTouches[0]) return;
      const dx = event.changedTouches[0].clientX - start.x;
      const dy = event.changedTouches[0].clientY - start.y;
      if (Math.abs(dx) >= 50 && Math.abs(dx) > Math.abs(dy) * 1.5) move(dx < 0 ? 1 : -1);
    }}>
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {slides.slice(0, requested).filter(slide => status[slide.id] !== "failed").map((slide, i) => <Image key={slide.id}
        src={slide.src} alt="" fill sizes="100vw" loading="eager" fetchPriority={i === 0 ? "high" : "low"}
        className={styles.photograph} data-active={active?.id === slide.id}
        style={{"--position-desktop": slide.desktopPosition, "--position-mobile": slide.mobilePosition} as CSSProperties}
        onLoad={event => {
          const image = event.currentTarget;
          void image.decode().then(() => {if (mounted.current) setStatus(previous => ({...previous, [slide.id]: "ready"}));})
            .catch(() => {if (mounted.current) setStatus(previous => ({...previous, [slide.id]: "failed"}));});
        }}
        onError={() => {if (mounted.current) setStatus(previous => ({...previous, [slide.id]: "failed"}));}}/>)}
      <div className={styles.shade}/>
    </div>
    <PageContainer className="relative flex min-h-[530px] flex-col justify-center py-12 pb-28 sm:min-h-[550px] sm:py-16 sm:pb-28 lg:min-h-[600px] lg:py-20 lg:pb-28">
      {canRotate && <div className="absolute bottom-6 right-4 flex items-center gap-3 sm:bottom-8 sm:right-6 lg:right-8" role="group" aria-label="Управление фотографиями">
        <button type="button" className={circle} aria-label="Предыдущая фотография" onClick={() => move(-1)}><Arrow direction="left"/></button>
        <button type="button" className={circle} aria-label="Следующая фотография" onClick={() => move(1)}><Arrow direction="right"/></button>
      </div>}
      <div className="relative max-w-3xl">{children}</div>
    </PageContainer>
  </section>;
}

function Arrow({direction}: {direction: "left" | "right"}) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5" aria-hidden="true"><path d={direction === "left" ? "M14 6l-6 6 6 6M8 12h12" : "M10 6l6 6-6 6M4 12h12"}/></svg>;
}
