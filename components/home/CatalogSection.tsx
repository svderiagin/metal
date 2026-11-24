import {getAllCategories} from "@/lib/catalog";
import Link from "next/link";
import {ButtonLink} from "@/components/ui/Button";
import {Icon} from "@/components/ui/Icon";
import {catalogImageUrl} from "@/lib/catalog-image";
import {getPreparedPhoto} from "@/lib/server/preparedPhotos";
import {PreparedPhoto} from "@/components/ui/PreparedPhoto";
import {catalogCoverGalleries} from "@/data/catalog-cover-galleries";
import cardStyles from "@/components/catalog/CatalogCard.module.css";
import styles from "./CatalogSection.module.css";

const categoryParameters: Readonly<Partial<Record<string, string>>> = {
  armatura: "Класс · диаметр · длина",
  "truby-profilnye": "Сечение · стенка · длина",
  "truba-kruglaya": "Диаметр · стенка · длина",
  balka: "Серия · профиль · длина",
  shveller: "Профиль · полки · стенка",
  ugolok: "Полки · толщина · длина",
  kvadrat: "Сечение · марка стали · длина",
  "listovoy-prokat": "Толщина · формат · исполнение",
  polosa: "Ширина · толщина · длина",
  profnastil: "Профиль · толщина · покрытие",
  "setka-metallicheskaya": "Ячейка · проволока · формат",
  shtaketnik: "Профиль · длина · покрытие",
};

export function CatalogSection() {
  const categories = getAllCategories();

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
        {categories.map(category => {
          const parameters = categoryParameters[category.slug];
          const src = catalogCoverGalleries[category.id]?.cover ?? category.imageUrl;
          const hasImage = src && !src.endsWith(".svg");
          return <li key={category.id} className="min-w-0">
            <Link href={`/catalog/${category.slug}`} className={`${cardStyles.card} ${styles.tile} ${hasImage ? styles.withImage : ""} h-full rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900`}>
              <div className={styles.copy}>
                <h3 className="text-card-title">{category.name}</h3>
                {parameters && <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">{parameters}</p>}
              </div>
              {hasImage && <div className={`${styles.picture} rounded-sm bg-white`}><PreparedPhoto photo={getPreparedPhoto(src)} src={catalogImageUrl(src)} alt="" fill sizes="auto, 128px" className="object-cover object-center"/></div>}
            </Link>
          </li>;
        })}
      </ul>
    </section>
  );
}
