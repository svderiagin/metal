import {catalogImageUrl} from "@/lib/catalog-image";
import Link from "next/link";
import {PreparedPhoto} from "@/components/ui/PreparedPhoto";
import {Icon} from "@/components/ui/Icon";
import {formatUnitPrice} from "@/lib/currency";
import {getProductTypeSummary} from "@/lib/productTypeSummary";
import type {ProductType, ProductVariant} from "@/types/product";
import type {PreparedPhoto as Photo} from "@/lib/server/preparedPhotos";
import {RebarStandardHelp} from "./RebarStandardHelp";
import {catalogDescriptionCopy} from "@/data/catalog-description-copy";
import styles from "./CatalogCard.module.css";
import homeStyles from "./ProductTypeCard.module.css";

export function ProductTypeCard({
  productType,
  variants,
  categorySlug,
  subcategorySlug,
  appearance = "default",
  photo,
}: {
  productType: ProductType;
  variants: ProductVariant[];
  categorySlug: string;
  subcategorySlug: string;
  appearance?: "default" | "home";
  photo?: Photo;
}) {
  const isHome = appearance === "home";
  const Heading = isHome ? "h3" : "h2";
  const {standard, hasPrices, minimumPrice, priceUnit} = getProductTypeSummary(productType, variants);
  const [priceAmount, priceUnitLabel] = minimumPrice === null
    ? []
    : formatUnitPrice(minimumPrice, priceUnit).replace(/,00(?=\s*₽)/u, "").split(/\s+(?=₽)/u);

  return (
    <article className={`${styles.card} ${isHome ? homeStyles.card : "p-4 sm:p-5"} relative flex h-full min-w-0 flex-col rounded-xl border border-slate-200 bg-white transition-colors dark:border-slate-700 dark:bg-slate-900`}>
      <div className={`grid min-w-0 flex-1 items-start ${isHome ? homeStyles.content : "grid-cols-[minmax(0,1fr)_96px] gap-x-4 sm:grid-cols-[minmax(0,1fr)_112px]"}`}>
          <Heading className={`${isHome ? homeStyles.title : ""} text-card-title text-slate-950 dark:text-slate-100 ${productType.imageUrl ? "" : "col-span-2"}`}>
            <Link href={`/catalog/${categorySlug}/${subcategorySlug}/${productType.slug}`}
              className={`${styles.stretchedLink} cursor-pointer after:absolute after:inset-0 after:z-[1] after:rounded-xl`}>
              {productType.name}
            </Link>
          </Heading>
          {productType.imageUrl && <div className={`relative row-span-1 aspect-[4/3] overflow-hidden bg-white sm:row-span-2 ${isHome ? "rounded-sm" : "rounded-lg"}`}>
            <PreparedPhoto photo={photo} src={catalogImageUrl(productType.imageUrl)} alt="" fill
              sizes={isHome ? "auto, 128px" : "(min-width: 640px) 112px, 96px"}
              className="object-cover object-center"/>
          </div>}
          <p className={`${isHome ? homeStyles.description : ""} col-start-1 mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300 ${productType.imageUrl ? "col-span-2 sm:col-span-1" : "col-span-2"}`}>
            {catalogDescriptionCopy[productType.subcategoryId]?.intro ?? productType.shortDescription}
          </p>
          {standard !== "Уточняется" && <div className={`${isHome ? homeStyles.standard : ""} col-span-2 mt-3 flex items-center gap-1 text-xs leading-6 text-slate-600 dark:text-slate-300`}>
            <span className="min-w-0">{standard}</span>
            {categorySlug === "armatura" && <RebarStandardHelp standard={standard}/>}
          </div>}
      </div>
        <div className={`${isHome ? homeStyles.footer : "mt-4"} flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-3 dark:border-slate-700`}>
          <div className="flex items-baseline gap-1 whitespace-nowrap tabular-nums">
            {minimumPrice !== null && (
              <>
                <span className="text-xs text-slate-500 dark:text-slate-400">от</span>
                <strong className="text-xl font-semibold">{priceAmount}</strong>
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{priceUnitLabel}</span>
              </>
            )}
            {minimumPrice === null && <strong className="text-base">{hasPrices ? "Цены в каталоге" : "Цена по запросу"}</strong>}
          </div>
          <span aria-hidden="true" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 dark:text-brand-300">Размеры и цены <Icon name="arrow-right"/></span>
          <p className="w-full text-xs text-slate-500 dark:text-slate-400">Позиций: {variants.length}</p>
        </div>
    </article>
  );
}
