import {ButtonLink} from "@/components/ui/Button";
import {existsSync, readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import path from "node:path";
import {HERO_SLIDES} from "@/data/hero-slides";
import {HeroCarousel} from "./HeroCarousel";

export function HeroSection() {
  // Отсутствующие будущие файлы не попадают в HTML и не вызывают запросы с 404.
  const slides = HERO_SLIDES.flatMap(slide => {
    const file = path.join(process.cwd(), "public", slide.src);
    if (!existsSync(file)) return [];
    // Замена файла с тем же именем должна обновлять и кэш next/image.
    const version = createHash("sha256").update(readFileSync(file)).digest("hex").slice(0, 12);
    return [{...slide, src: `${slide.src}?v=${version}`}];
  });
  return (
    <HeroCarousel slides={slides}>
        <div>
          <p className="text-eyebrow uppercase text-slate-500 dark:text-slate-400">
            Поставка по спецификации
          </p>
          <h1 id="home-hero-title" className="mt-2 text-[1.5rem] font-semibold leading-[1.15] tracking-[-0.025em] min-[360px]:text-[1.75rem] min-[380px]:text-[2rem] sm:text-[1.75rem] md:text-[2rem] lg:text-[2.5rem]">
            Металлопрокат<br/>и металлоконструкции
          </h1>
          <p className="mt-4 max-w-xl text-slate-600 dark:text-slate-300">
            Арматура, трубы, листовой и сортовой прокат для застройщиков,
            строительных бригад и компаний.
          </p>
          <div className="mt-5 grid gap-3 min-[380px]:grid-cols-2 sm:flex sm:flex-wrap">
            <ButtonLink href="/catalog">Каталог <span aria-hidden="true" className="ml-2">→</span></ButtonLink>
            <ButtonLink href="/#request" variant="secondary">Расчёт заказа</ButtonLink>
          </div>
          <p className="mt-4 border-t border-slate-200 pt-3 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">Со склада и под заказ. Стоимость и сроки согласуем по спецификации.</p>
        </div>
    </HeroCarousel>
  );
}
