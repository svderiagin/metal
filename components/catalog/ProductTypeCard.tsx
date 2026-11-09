import {catalogImageUrl} from "@/lib/catalog-image";
import Link from "next/link";
import Image from "next/image";
import {formatUnitPrice} from "@/lib/currency";
import {getProductTypeSummary} from "@/lib/productTypeSummary";
import type {ProductType, ProductVariant} from "@/types/product";
import {RebarStandardHelp} from "./RebarStandardHelp";
import {catalogDescriptionCopy} from "@/data/catalog-description-copy";
import styles from "./CatalogCard.module.css";

export function ProductTypeCard({
  productType,
  variants,
  categorySlug,
  subcategorySlug,
}: {
  productType: ProductType;
  variants: ProductVariant[];
  categorySlug: string;
  subcategorySlug: string;
}) {
  const {standard, hasPrices, minimumPrice, priceUnit} = getProductTypeSummary(productType, variants);
  const [priceAmount, priceUnitLabel] = minimumPrice === null
    ? []
    : formatUnitPrice(minimumPrice, priceUnit).replace(/,00(?=\s*₽)/u, "").split(/\s+(?=₽)/u);

  return (
    <article className={`${styles.card} relative flex h-full min-w-0 flex-col rounded-xl border border-slate-200 bg-white p-4 transition-colors dark:border-slate-700 dark:bg-slate-900 sm:p-5`}>
      <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_96px] items-start gap-x-4 sm:grid-cols-[minmax(0,1fr)_112px]">
          <h2 className={`text-card-title text-slate-950 dark:text-slate-100 ${productType.imageUrl ? "" : "col-span-2"}`}>
            <Link href={`/catalog/${categorySlug}/${subcategorySlug}/${productType.slug}`}
              className={`${styles.stretchedLink} cursor-pointer after:absolute after:inset-0 after:z-[1] after:rounded-xl`}>
              {productType.name}
            </Link>
          </h2>
          {productType.imageUrl && <div className="relative row-span-2 aspect-[4/3] overflow-hidden rounded-lg bg-white">
            <Image src={catalogImageUrl(productType.imageUrl)} alt={productType.name} fill sizes="(min-width: 640px) 112px, 96px" className="object-cover object-center"/>
          </div>}
          <p className={`col-start-1 mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300 ${productType.imageUrl ? "" : "col-span-2"}`}>
            {catalogDescriptionCopy[productType.subcategoryId]?.intro ?? productType.shortDescription}
          </p>
          {standard !== "Уточняется" && <div className="col-span-2 mt-3 flex items-center gap-1 text-xs leading-6 text-slate-600 dark:text-slate-300">
            <span className="min-w-0">{standard}</span>
            {categorySlug === "armatura" && <RebarStandardHelp standard={standard}/>}
          </div>}
      </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-3 dark:border-slate-700">
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
          <span aria-hidden="true" className="text-sm font-semibold text-brand-700 dark:text-brand-300">Размеры и цены <span className="ml-1">→</span></span>
          <p className="w-full text-xs text-slate-500 dark:text-slate-400">Позиций: {variants.length}</p>
        </div>
    </article>
  );
}
