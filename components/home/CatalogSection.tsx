import {getAllCategories} from "@/lib/catalog";
import Link from "next/link";
import Image from "next/image";
import {ButtonLink} from "@/components/ui/Button";
import {Icon} from "@/components/ui/Icon";
import {catalogImageUrl} from "@/lib/catalog-image";
import {catalogCoverGalleries} from "@/data/catalog-cover-galleries";
import cardStyles from "@/components/catalog/CatalogCard.module.css";
import styles from "./CatalogSection.module.css";

const primaryGroups = [
  {slug: "armatura", parameters: "Класс · диаметр · длина"},
  {slug: "truby-profilnye", parameters: "Сечение · стенка · длина"},
  {slug: "truba-kruglaya", parameters: "Диаметр · стенка · длина"},
  {slug: "listovoy-prokat", parameters: "Толщина · формат · исполнение"},
  {slug: "balka", parameters: "Серия · профиль · длина"},
  {slug: "shveller", parameters: "Профиль · полки · стенка"},
  {slug: "ugolok", parameters: "Полки · толщина · длина"},
  {slug: "kvadrat", parameters: "Сечение · марка стали · длина"},
  {slug: "polosa", parameters: "Ширина · толщина · длина"},
  {slug: "profnastil", parameters: "Профиль · толщина · покрытие"},
  {slug: "setka-metallicheskaya", parameters: "Ячейка · проволока · формат"},
  {slug: "shtaketnik", parameters: "Профиль · длина · покрытие"},
] as const;

export function CatalogSection() {
  const categories = getAllCategories();
  const featured = primaryGroups.flatMap(group => {
    const category = categories.find(category => category.slug === group.slug);
    return category ? [{category, parameters: group.parameters}] : [];
  });

  return (
    <section id="home-catalog" aria-labelledby="home-catalog-heading" className="scroll-mt-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-eyebrow uppercase text-slate-500 dark:text-slate-400">Продукция</p>
          <h2 id="home-catalog-heading" className="text-section-title">Каталог металлопроката</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Выберите группу, затем сравните размеры, характеристики и цены.</p>
        </div>
        <ButtonLink href="/catalog" variant="secondary" className="gap-2">Все разделы <span className="tabular-nums text-slate-500 dark:text-slate-400">{categories.length}</span><Icon name="arrow-right"/></ButtonLink>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {featured.map(({category, parameters}) => {
          const src = catalogCoverGalleries[category.id]?.cover ?? category.imageUrl;
          const hasImage = src && !src.endsWith(".svg");
          return <li key={category.id} className="min-w-0">
            <Link href={`/catalog/${category.slug}`} className={`${cardStyles.card} ${styles.tile} ${hasImage ? styles.withImage : ""} h-full rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900`}>
              <div className={styles.copy}>
                <h3 className="text-card-title">{category.name}</h3>
                <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">{parameters}</p>
              </div>
              {hasImage && <div className={`${styles.picture} rounded-sm bg-white`}><Image src={catalogImageUrl(src)} alt="" fill sizes="(min-width: 1280px) 128px, (min-width: 1024px) 11vw, (min-width: 640px) 16vw, 32vw" className="object-cover object-center"/></div>}
            </Link>
          </li>;
        })}
      </ul>
    </section>
  );
}
