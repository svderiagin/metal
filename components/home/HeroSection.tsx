import {ButtonLink} from "@/components/ui/Button";
import {Icon} from "@/components/ui/Icon";
import {existsSync, readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import path from "node:path";
import {HERO_SLIDES} from "@/data/hero-slides";
import {getPreparedPhoto} from "@/lib/server/preparedPhotos";
import {HeroCarousel} from "./HeroCarousel";
import styles from "./HeroCarousel.module.css";

export function HeroSection() {
  // Отсутствующие будущие файлы не попадают в HTML и не вызывают запросы с 404.
  const slides = HERO_SLIDES.flatMap(slide => {
    const file = path.join(process.cwd(), "public", slide.src);
    if (!existsSync(file)) return [];
    // Замена файла с тем же именем должна обновлять и кэш next/image.
    const version = createHash("sha256").update(readFileSync(file)).digest("hex").slice(0, 12);
    return [{...slide, src: `${slide.src}?v=${version}`, photo: getPreparedPhoto(slide.src)}];
  });
  return (
    <HeroCarousel slides={slides}>
        <div>
          <h1 id="home-hero-title" className={styles.title}>
            Металлопрокат с доставкой
          </h1>
          <p className={`${styles.intro} mt-2 max-w-lg sm:mt-3`}>
            Арматура, трубы, балки, листовой и сортовой прокат.
          </p>
          <div className="mt-3 grid gap-2 sm:mt-4 sm:flex sm:flex-wrap sm:gap-3">
            <ButtonLink href="/catalog" className={styles.primaryAction}>Перейти в каталог <Icon name="arrow-right"/></ButtonLink>
            <ButtonLink href="#request" nativeNavigation variant="secondary" className={styles.secondaryAction}>Запросить расчёт</ButtonLink>
          </div>
        </div>
    </HeroCarousel>
  );
}
