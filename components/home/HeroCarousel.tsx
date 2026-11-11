"use client";

import {type CSSProperties, type ReactNode, useEffect, useMemo, useRef, useState} from "react";
import {PageContainer} from "@/components/layout/PageContainer";
import {Icon} from "@/components/ui/Icon";
import {PreparedPhoto} from "@/components/ui/PreparedPhoto";
import {AUTO_ROTATE_MS, type HeroSlide} from "@/data/hero-slides";
import type {PreparedPhoto as Photo} from "@/lib/server/preparedPhotos";
import styles from "./HeroCarousel.module.css";

type ImageStatus = "ready" | "failed";

export function HeroCarousel({slides, children}: {slides: (HeroSlide & {photo?: Photo})[]; children: ReactNode}) {
  const hero = useRef<HTMLElement>(null);
  const mounted = useRef(true);
  const gesture = useRef<{x: number; y: number} | null>(null);
  const decoding = useRef(new WeakMap<HTMLImageElement, string>());
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
  // Показываем первый кадр из серверной разметки, не ожидая гидратации.
  const active = usable.find(slide => slide.id === current) ?? usable[0]
    ?? slides.find(slide => status[slide.id] !== "failed");
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
    const activeIndex = slides.findIndex(slide => slide.id === active?.id);
    // Готовим один следующий кадр, не загружая всю невидимую карусель.
    if (requested >= slides.length || !last || !visible || !tabVisible
      || (activeIndex < requested - 1 && status[last.id] !== "failed")) return;
    const timer = window.setTimeout(() => setRequested(n => Math.min(n + 1, slides.length)), status[last.id] ? 250 : 5000);
    return () => window.clearTimeout(timer);
  }, [requested, slides, status, active, visible, tabVisible]);

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

  function markImage(id: string, state: ImageStatus) {
    if (mounted.current) setStatus(previous => previous[id] === state ? previous : {...previous, [id]: state});
  }

  function decodeImage(image: HTMLImageElement, id: string) {
    const source = image.currentSrc;
    if (decoding.current.get(image) === source) return;
    decoding.current.set(image, source);
    void image.decode().then(() => {
      if (image.currentSrc === source) markImage(id, "ready");
    }).catch(() => {
      if (image.currentSrc === source) markImage(id, "failed");
    });
  }

  const circle = styles.control;

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
    <PageContainer>
      <div className={styles.stage}>
        <div className={styles.imageFrame} aria-hidden="true">
          {slides.slice(0, requested).filter(slide => status[slide.id] !== "failed").map((slide, i) => <PreparedPhoto key={slide.id}
            photo={slide.photo} src={slide.src} alt="" fill sizes="(min-width: 1360px) 1312px, (min-width: 1024px) calc(100vw - 48px), (min-width: 640px) calc(100vw - 40px), calc(100vw - 32px)" loading="eager" fetchPriority={i === 0 ? "high" : "low"}
            className={styles.photograph} data-active={active?.id === slide.id}
            style={{"--position-desktop": slide.desktopPosition, "--position-mobile": slide.mobilePosition} as CSSProperties}
            ref={image => {
              // A cached image can complete before React attaches the load listener.
              if (image?.complete && image.currentSrc) decodeImage(image, slide.id);
            }}
            onLoad={event => decodeImage(event.currentTarget, slide.id)}
            onError={() => markImage(slide.id, "failed")}/>)}
        </div>
        <div className={styles.shade} aria-hidden="true"/>
        <div className={styles.layout}>
          <div className={styles.content}>{children}</div>
          <div className={styles.controls}>
            {canRotate && <div className="flex items-center gap-2" role="group" aria-label="Управление фотографиями">
              <button type="button" className={circle} aria-label={enabled ? "Приостановить слайд-шоу" : "Запустить слайд-шоу"}
                onClick={() => setEnabled(value => !value)}>
                <Icon name={enabled ? "pause" : "play"}/>
              </button>
              <button type="button" className={circle} aria-label="Предыдущая фотография" onClick={() => move(-1)}><Icon name="arrow-left"/></button>
              <button type="button" className={circle} aria-label="Следующая фотография" onClick={() => move(1)}><Icon name="arrow-right"/></button>
            </div>}
          </div>
        </div>
      </div>
    </PageContainer>
  </section>;
}
