import {catalogImageUrl} from "@/lib/catalog-image";
import Link from "next/link";
import Image from "next/image";
import {formatUnitPrice} from "@/lib/currency";
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
  const materials = uniqueValues(variants, "material");
  const standards = uniqueValues(variants, "standard");
  const pricedVariants = variants.filter(v => !v.quoteOnly && v.price !== null && v.price > 0);
  const sameBasis = new Set(pricedVariants.map(v => v.priceUnit)).size === 1;
  const prices = sameBasis ? pricedVariants.flatMap((variant) => variant.price === null ? [] : [variant.price]) : [];
  const minimumPrice = prices.length ? Math.min(...prices) : null;

  return (
    <article className="h-full">
      <Link
        href={`/catalog/${categorySlug}/${subcategorySlug}/${productType.slug}`}
        className="group flex h-full min-h-80 cursor-pointer flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
      >
        {productType.imageUrl ? <div className="relative aspect-[2/1] w-full shrink-0 bg-white">
          <Image src={catalogImageUrl(productType.imageUrl)} alt={productType.name} fill
            sizes="(min-width: 1280px) 390px, (min-width: 640px) calc((100vw - 72px) / 2), calc(100vw - 34px)"
            className="object-cover object-center"/>
        </div> : <div className="flex aspect-[2/1] w-full shrink-0 items-center justify-center border-b border-slate-200 bg-[linear-gradient(135deg,#f8fafc_25%,#e2e8f0_25%,#e2e8f0_50%,#f8fafc_50%,#f8fafc_75%,#e2e8f0_75%)] bg-[length:20px_20px] p-5">
          <span className="rounded-lg bg-slate-900/90 px-4 py-2 text-center text-sm font-bold text-white">
            {productType.name}
          </span>
        </div>}

        <div className="flex flex-1 flex-col px-5 pb-5 pt-4 sm:px-6 sm:pb-6 sm:pt-5">
          <h2 className="text-lg font-bold text-slate-950">{productType.name}</h2>
          <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">
            {productType.shortDescription}
          </p>

          <dl className="mt-4 space-y-2 text-sm">
            <SummaryRow label="Материал" value={materials.join(", ") || "Уточняется"}/>
            <SummaryRow label="Стандарт" value={standards.join(", ") || "Уточняется"}/>
          </dl>

          <div className="mt-5 border-t border-slate-100 pt-5">
            <div>
              {minimumPrice !== null && (
                <>
                  <span className="block text-xs text-slate-500">от</span>
                  <strong className="text-xl">{formatUnitPrice(minimumPrice, pricedVariants[0]?.priceUnit ?? "")}</strong>
                </>
              )}
              {minimumPrice === null && <strong>Цена по запросу</strong>}
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}

function SummaryRow({label, value}: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[5rem_1fr] gap-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-800">{value}</dd>
    </div>
  );
}

function uniqueValues(
  variants: ProductVariant[],
  key: ProductVariant["attributes"][number]["key"],
) {
  return [...new Set(
    variants.flatMap((variant) =>
      variant.attributes
        .filter((attribute) => attribute.key === key)
        .map((attribute) => attribute.value),
    ),
  )];
}
