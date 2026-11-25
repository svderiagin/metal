"use client";

import Image, {type StaticImageData} from "next/image";
import {useEffect, useRef, useState} from "react";
import {Button} from "@/components/ui/Button";
import {Icon} from "@/components/ui/Icon";
import demidovLogo from "../../public/images/home/partners/demidov.webp";
import diposLogo from "../../public/images/home/partners/dipos.webp";
import evrazLogo from "../../public/images/home/partners/evraz.webp";
import ktzLogo from "../../public/images/home/partners/ktz.webp";
import mechelServiceLogo from "../../public/images/home/partners/mechel-service.webp";
import metallProfilLogo from "../../public/images/home/partners/metall-profil.webp";
import mmkLogo from "../../public/images/home/partners/mmk.webp";
import nlmkLogo from "../../public/images/home/partners/nlmk.webp";
import novostalLogo from "../../public/images/home/partners/novostal.webp";
import omkLogo from "../../public/images/home/partners/omk.webp";
import promsortLogo from "../../public/images/home/partners/promsort.webp";
import severstalLogo from "../../public/images/home/partners/severstal.webp";
import tempoLogo from "../../public/images/home/partners/tempo.webp";
import tmkLogo from "../../public/images/home/partners/tmk.webp";

const partners: ReadonlyArray<{name: string; logo: StaticImageData; description: string; lightLogo?: boolean}> = [
  {name: "Северсталь", logo: severstalLogo, description: "Листовой прокат"},
  {name: "НЛМК", logo: nlmkLogo, description: "Листовой прокат"},
  {name: "ЕВРАЗ", logo: evrazLogo, description: "Балки и арматура"},
  {name: "Королёвский трубный завод", logo: ktzLogo, description: "Стальные трубы"},
  {name: "ММК", logo: mmkLogo, description: "Листовой прокат"},
  {name: "ОМК", logo: omkLogo, description: "Круглые и профильные трубы", lightLogo: true},
  {name: "ТМК", logo: tmkLogo, description: "Электросварные и профильные трубы"},
  {name: "Мечел-Сервис", logo: mechelServiceLogo, description: "Арматура, балки и швеллеры", lightLogo: true},
  {name: "Новосталь-М", logo: novostalLogo, description: "Арматура", lightLogo: true},
  {name: "Промсорт", logo: promsortLogo, description: "Арматура и фасонный прокат"},
  {name: "ГК «Демидов»", logo: demidovLogo, description: "Профильные и электросварные трубы", lightLogo: true},
  {name: "НТЗ «ТЭМ-ПО»", logo: tempoLogo, description: "Круглые и профильные трубы"},
  {name: "ДиПОС", logo: diposLogo, description: "Сварная сетка"},
  {name: "Металл Профиль", logo: metallProfilLogo, description: "Профнастил и металлический штакетник"},
];

const arrowClass = "size-11 shrink-0 p-0!";
const arrowDuration = 260;
type Direction = -1 | 1;
type ArrowMotion = {
  direction: Direction;
  from: number;
  position: number;
  target: number;
  startedAt: number;
};

function getCycleWidth(list: HTMLUListElement) {
  const first = list.children[0].getBoundingClientRect();
  const nextCycle = list.children[partners.length].getBoundingClientRect();
  return nextCycle.left - first.left;
}

export function PartnersSection() {
  const track = useRef<HTMLUListElement>(null);
  const scrollByCard = useRef<((direction: Direction) => void) | null>(null);
  const [loadLogos, setLoadLogos] = useState(false);

  useEffect(() => {
    const list = track.current;
    if (!list) return;

    const hasScrollEnd = list.onscrollend !== undefined;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let cycleWidth = getCycleWidth(list);
    let viewportWidth = list.clientWidth;
    let lastLeft = list.scrollLeft;
    let scrollTimer = 0;
    let touchActive = false;
    let motion: ArrowMotion | null = null;
    let frame = 0;

    const setLeft = (left: number) => {
      lastLeft = left;
      list.scrollTo({left, behavior: "instant"});
    };

    const placeCard = (position: number) => {
      // Wrap the rendered offset while keeping the arrow's destination in card units.
      const count = partners.length;
      const index = ((position % count) + count) % count;
      const offset = index * cycleWidth / count;
      setLeft(cycleWidth + (offset < cycleWidth - 1 ? offset : 0));
    };

    const stopMotion = () => {
      window.cancelAnimationFrame(frame);
      frame = 0;
      motion = null;
    };

    const animate = (time: number) => {
      frame = 0;
      if (!motion) return;
      const progress = reducedMotion.matches ? 1 : Math.min(1, Math.max(0, (time - motion.startedAt) / arrowDuration));
      const eased = 1 - (1 - progress) ** 3;
      motion.position = motion.from + (motion.target - motion.from) * eased;
      placeCard(motion.position);
      if (progress === 1) motion = null;
      else frame = window.requestAnimationFrame(animate);
    };

    scrollByCard.current = direction => {
      const step = cycleWidth / partners.length;
      const active = motion;
      const position = active?.position ?? list.scrollLeft / step;
      const tolerance = active ? 0 : 1 / step;
      const visibleCard = direction === 1 ? Math.floor(position + tolerance) : Math.ceil(position - tolerance);
      // Opposite taps cancel before a single step starts, or reverse from the visible position.
      const pending = active && (active.direction === direction
        || (active.position === active.from && Math.abs(active.target - position) <= 1));
      const target = (pending ? active.target : visibleCard) + direction;
      if (reducedMotion.matches || Math.abs(target - position) < 0.001) {
        stopMotion();
        placeCard(target);
        return;
      }
      if (!motion) placeCard(position);
      motion = {direction, from: position, position, target, startedAt: performance.now()};
      if (!frame) frame = window.requestAnimationFrame(animate);
    };

    placeCard(lastLeft * partners.length / cycleWidth);

    const returnToMiddle = (left: number) => {
      // Each copy has the same content at the same relative offset.
      if (left < cycleWidth - 1) setLeft(left + cycleWidth);
      else if (left >= 2 * cycleWidth - 1) setLeft(Math.max(cycleWidth, left - cycleWidth));
    };

    const finishScroll = () => {
      if (!motion && !touchActive) returnToMiddle(list.scrollLeft);
    };

    const waitForScrollEnd = () => {
      window.clearTimeout(scrollTimer);
      if (!touchActive) scrollTimer = window.setTimeout(finishScroll, 120);
    };

    const handleScroll = () => {
      if (motion || list.clientWidth !== viewportWidth) return;
      lastLeft = list.scrollLeft;
      // Long wheel gestures can reach the physical end before a scrollend event.
      if (!touchActive && (lastLeft < cycleWidth / 2 || lastLeft >= cycleWidth * 2.5)) {
        returnToMiddle(lastLeft);
      }
      if (!hasScrollEnd) waitForScrollEnd();
    };

    const handleTouch = (event: TouchEvent) => {
      touchActive = event.touches.length > 0;
      if (!hasScrollEnd) waitForScrollEnd();
    };

    const handleWheel = (event: WheelEvent) => {
      if (event.deltaX !== 0) stopMotion();
    };

    const resize = new ResizeObserver(() => {
      const nextCycleWidth = getCycleWidth(list);
      viewportWidth = list.clientWidth;
      if (nextCycleWidth === cycleWidth) return;
      const position = motion?.position ?? lastLeft * partners.length / cycleWidth;
      cycleWidth = nextCycleWidth;
      placeCard(position);
    });

    const visibility = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setLoadLogos(true);
      visibility.disconnect();
    }, {rootMargin: "650px 0px"});

    resize.observe(list);
    visibility.observe(list);
    list.addEventListener("scroll", handleScroll, {passive: true});
    list.addEventListener("scrollend", finishScroll);
    list.addEventListener("pointerdown", stopMotion, {passive: true});
    list.addEventListener("wheel", handleWheel, {passive: true});
    list.addEventListener("touchstart", handleTouch, {passive: true});
    list.addEventListener("touchend", handleTouch, {passive: true});
    list.addEventListener("touchcancel", handleTouch, {passive: true});
    return () => {
      scrollByCard.current = null;
      stopMotion();
      window.clearTimeout(scrollTimer);
      resize.disconnect();
      visibility.disconnect();
      list.removeEventListener("scroll", handleScroll);
      list.removeEventListener("scrollend", finishScroll);
      list.removeEventListener("pointerdown", stopMotion);
      list.removeEventListener("wheel", handleWheel);
      list.removeEventListener("touchstart", handleTouch);
      list.removeEventListener("touchend", handleTouch);
      list.removeEventListener("touchcancel", handleTouch);
    };
  }, []);

  return (
    <section id="partners" aria-labelledby="home-partners-heading" className="min-w-0 scroll-mt-6">
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-2 sm:gap-x-4">
        <h2 id="home-partners-heading" className="text-section-title">Наши партнёры</h2>
        <div className="flex shrink-0 items-center gap-2">
          <Button type="button" variant="secondary" aria-label="Предыдущий партнёр" aria-controls="home-partners-list"
            className={arrowClass} onClick={() => scrollByCard.current?.(-1)}>
            <Icon name="chevron-left"/>
          </Button>
          <Button type="button" variant="secondary" aria-label="Следующий партнёр" aria-controls="home-partners-list"
            className={arrowClass} onClick={() => scrollByCard.current?.(1)}>
            <Icon name="chevron-right"/>
          </Button>
        </div>
      </div>
      <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white px-3 sm:px-4 lg:px-5 dark:border-slate-700 dark:bg-slate-900">
        <ul id="home-partners-list" ref={track} role="list" tabIndex={-1}
          className="grid auto-cols-[min(68%,12rem)] grid-flow-col gap-2.5 overflow-x-auto overscroll-x-contain py-2 [mask-image:linear-gradient(to_right,transparent,#000_14px,#000_calc(100%_-_14px),transparent)] [scrollbar-width:none] sm:auto-cols-[14rem] sm:gap-3 lg:auto-cols-[15rem] [&::-webkit-scrollbar]:hidden">
          {[0, 1, 2].flatMap(copy => partners.map(({name, logo, description, lightLogo}) => (
            <li key={`${copy}-${name}`} aria-hidden={copy !== 1 || undefined}
              className="flex min-w-0 flex-col items-center px-3 py-2.5 text-center sm:px-4 sm:py-3 lg:py-2">
              <div className={`h-12 w-full max-w-44 rounded-md px-2.5 py-1.5 sm:h-14 ${lightLogo ? "bg-slate-950" : "bg-white"}`}>
                <Image src={logo} alt="" unoptimized loading={loadLogos ? "eager" : "lazy"} fetchPriority="low"
                  className="h-full w-full object-contain"/>
              </div>
              <h3 className="mt-4 text-sm font-semibold sm:mt-5 lg:min-h-10 lg:leading-5">{name}</h3>
              <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">{description}</p>
            </li>
          )))}
        </ul>
      </div>
    </section>
  );
}
