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
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-red-500">
            Комплектация со склада
          </p>
          <h1 id="home-hero-title" className="mt-4 max-w-3xl text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">
            Металлоконструкции и металлопрокат со склада
          </h1>
          <p className="mt-5 max-w-2xl leading-7 text-slate-100">
            Поставляем металл компаниям и частным клиентам. Принимаем оплату картой и по счёту,
            выполняем резку и организуем доставку.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/catalog">Перейти в каталог</ButtonLink>
            <ButtonLink href="/#request" variant="secondary" className="text-slate-900! dark:text-slate-100!">Запросить расчёт</ButtonLink>
          </div>
        </div>
    </HeroCarousel>
  );
}
