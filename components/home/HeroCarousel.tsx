"use client";

import {type CSSProperties, type ReactNode, useEffect, useRef, useState} from "react";
import {PageContainer} from "@/components/layout/PageContainer";
import {Icon} from "@/components/ui/Icon";
import {PreparedPhoto} from "@/components/ui/PreparedPhoto";
import {AUTO_ROTATE_MS, type HeroSlide} from "@/data/hero-slides";
import {coverGalleryIndex} from "@/lib/catalogCoverGallery";
import type {PreparedPhoto as Photo} from "@/lib/server/preparedPhotos";
import styles from "./HeroCarousel.module.css";

type ImageStatus = "ready" | "failed";
type Direction = -1 | 1;
type Navigation = {
  active: string;
  pending: string | null;
  direction: Direction;
  status: Record<string, ImageStatus>;
};

function selectNext(slides: readonly HeroSlide[], state: Navigation, direction: Direction, from = state.pending ?? state.active): Navigation {
  const start = slides.findIndex(slide => slide.id === from);
  for (let offset = 1; offset <= slides.length; offset++) {
    const {id} = slides[coverGalleryIndex(start, direction * offset, slides.length)];
    if (state.status[id] === "failed") continue;
    if (id === state.active || state.status[id] === "ready") {
      return {...state, active: id, pending: null, direction};
    }
    return {...state, pending: id, direction};
  }
  return {...state, pending: null};
}

export function HeroCarousel({slides, children}: {slides: (HeroSlide & {photo?: Photo})[]; children: ReactNode}) {
  const hero = useRef<HTMLElement>(null);
  const gesture = useRef<{x: number; y: number} | null>(null);
  const decoding = useRef(new WeakMap<HTMLImageElement, string>());
  // Первый кадр доступен в серверной разметке до гидратации.
  const [navigation, setNavigation] = useState<Navigation>(() => ({
    active: slides[0]?.id ?? "",
    pending: null,
    direction: 1,
    status: {},
  }));
  const [enabled, setEnabled] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [visible, setVisible] = useState(false);
  const [tabVisible, setTabVisible] = useState(false);
  const [hovered, setHovered] = useState(false);
  const {active, pending, status} = navigation;
  const canNavigate = slides.filter(slide => status[slide.id] !== "failed").length > 1;
  const requested = slides.filter(({id}) => status[id] !== "failed"
    && (id === active || id === pending || status[id] === "ready"));

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMotion = () => {
      setReducedMotion(motion.matches);
      if (motion.matches) setEnabled(false);
    };
    const onVisibility = () => setTabVisible(!document.hidden);
    motion.addEventListener("change", onMotion);
    document.addEventListener("visibilitychange", onVisibility);
    onMotion();
    onVisibility();
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting && entry.intersectionRatio > 0), {threshold: 0});
    if (hero.current) observer.observe(hero.current);
    return () => {
      observer.disconnect();
      motion.removeEventListener("change", onMotion);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  useEffect(() => {
    if (!enabled || reducedMotion || !canNavigate || pending || !visible || !tabVisible || hovered) return;
    const timer = window.setTimeout(() => {
      setNavigation(previous => selectNext(slides, previous, 1));
    }, AUTO_ROTATE_MS);
    return () => window.clearTimeout(timer);
  }, [enabled, reducedMotion, canNavigate, active, pending, slides, visible, tabVisible, hovered]);

  function move(direction: Direction) {
    if (!canNavigate) return;
    setEnabled(false);
    setNavigation(previous => selectNext(slides, previous, direction));
  }

  function togglePlayback() {
    if (enabled) {
      setEnabled(false);
    } else if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // Явный запуск действует даже с курсором или фокусом на кнопке запуска.
      setHovered(false);
      setEnabled(true);
    }
  }

  function markImage(id: string, state: ImageStatus) {
    setNavigation(previous => {
      if (previous.status[id] === state) return previous;
      const next = {...previous, status: {...previous.status, [id]: state}};
      if (state === "ready" && previous.pending === id) {
        return {...next, active: id, pending: null};
      }
      if (state === "failed" && (previous.pending === id || (!previous.pending && previous.active === id))) {
        return selectNext(slides, next, previous.direction, id);
      }
      return next;
    });
  }

  function decodeImage(image: HTMLImageElement, id: string) {
    const source = image.currentSrc;
    if (decoding.current.get(image) === source) return;
    decoding.current.set(image, source);
    void image.decode().then(() => {
      if (image.isConnected && image.currentSrc === source) markImage(id, "ready");
    }).catch(() => {
      if (image.isConnected && image.currentSrc === source) markImage(id, "failed");
    });
  }

  const circle = styles.control;

  return <section ref={hero} className={styles.hero} aria-labelledby="home-hero-title" aria-roledescription={canNavigate ? "карусель" : undefined}
    onFocusCapture={event => {if (event.target.matches(":focus-visible")) setEnabled(false);}}
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
          {requested.map(slide => <PreparedPhoto key={slide.id}
            photo={slide.photo} src={slide.src} alt="" fill sizes="(min-width: 1360px) 1312px, (min-width: 1024px) calc(100vw - 48px), (min-width: 640px) calc(100vw - 40px), calc(100vw - 32px)" loading="eager" fetchPriority={slide.id === slides[0]?.id ? "high" : "auto"}
            className={styles.photograph} data-active={active === slide.id}
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
            {canNavigate && <div className="flex items-center gap-2" role="group" aria-label="Управление фотографиями">
              <button type="button" className={circle} aria-label={enabled ? "Приостановить слайд-шоу" : "Запустить слайд-шоу"}
                disabled={reducedMotion} onClick={togglePlayback}>
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
