import {catalogImageUrl} from "@/lib/catalog-image";
import Link from "next/link";
import Image from "next/image";
import {formatUnitPrice} from "@/lib/currency";
import {getProductTypeSummary} from "@/lib/productTypeSummary";
import type {ProductType, ProductVariant} from "@/types/product";

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
    <article className="h-full">
      <Link
        href={`/catalog/${categorySlug}/${subcategorySlug}/${productType.slug}`}
        className="group flex h-full min-h-80 cursor-pointer flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600"
      >
        {productType.imageUrl ? <div className="relative aspect-[2/1] w-full shrink-0 bg-white">
          <Image src={catalogImageUrl(productType.imageUrl)} alt={productType.name} fill
            sizes="auto, (min-width: 1280px) 422px, (min-width: 640px) calc((100vw - 56px) / 2), calc(100vw - 34px)"
            className="object-cover object-center"/>
        </div> : <div className="flex aspect-[2/1] w-full shrink-0 items-center justify-center border-b border-slate-200 bg-[linear-gradient(135deg,#f8fafc_25%,#e2e8f0_25%,#e2e8f0_50%,#f8fafc_50%,#f8fafc_75%,#e2e8f0_75%)] bg-[length:20px_20px] p-5">
          <span className="rounded-lg bg-slate-900/90 px-4 py-2 text-center text-sm font-bold text-white">
            {productType.name}
          </span>
        </div>}

        <div className="flex flex-1 flex-col px-5 pb-5 pt-4 sm:px-6 sm:pb-6 sm:pt-5">
          <div className="flex-1">
            <h2 className="text-lg font-bold text-slate-950">{productType.name}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {productType.shortDescription}
            </p>
            {standard !== "Уточняется" && <p className="mt-3 text-sm leading-6 text-slate-600">{standard}</p>}
          </div>

          <div className="mt-5 border-t border-slate-100 pt-5">
            <div className="flex items-baseline gap-1 whitespace-nowrap">
              {minimumPrice !== null && (
                <>
                  <span className="text-xs text-slate-500">от</span>
                  <strong className="text-2xl font-bold">{priceAmount}</strong>
                  <span className="text-sm font-medium text-slate-500">{priceUnitLabel}</span>
                </>
              )}
              {minimumPrice === null && <strong className="text-xl leading-8">{hasPrices ? "Цены в каталоге" : "Цена по запросу"}</strong>}
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}
