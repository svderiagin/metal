import {ButtonLink} from "@/components/ui/Button";
import {existsSync, readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import path from "node:path";
import {HERO_SLIDES} from "@/data/hero-slides";
import {HeroCarousel} from "./HeroCarousel";
import styles from "./HeroCarousel.module.css";

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
          <p className={`${styles.eyebrow} text-eyebrow uppercase`}>
            Поставка по спецификации
          </p>
          <h1 id="home-hero-title" className={`${styles.title} mt-2`}>
            Металлопрокат<br/>и металлоконструкции
          </h1>
          <p className={`${styles.intro} mt-4 max-w-xl`}>
            Арматура, трубы, листовой и сортовой прокат для застройщиков,
            строительных бригад и компаний.
          </p>
          <div className="mt-5 grid gap-3 min-[380px]:grid-cols-2 sm:flex sm:flex-wrap">
            <ButtonLink href="/catalog" className={styles.primaryAction}>Каталог <span aria-hidden="true" className="ml-2">→</span></ButtonLink>
            <ButtonLink href="/#request" variant="secondary" className={styles.secondaryAction}>Расчёт заказа</ButtonLink>
          </div>
          <p className={`${styles.terms} mt-4 border-t pt-3 text-sm`}>Со склада и под заказ. Стоимость и сроки согласуем по спецификации.</p>
        </div>
    </HeroCarousel>
  );
}
