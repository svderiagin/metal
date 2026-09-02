import Link from "next/link";
import {formatCurrency} from "@/lib/currency";
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
  const prices = variants.map((variant) => variant.price);
  const minimumPrice = prices.length ? Math.min(...prices) : null;

  return (
    <article className="h-full">
      <Link
        href={`/catalog/${categorySlug}/${subcategorySlug}/${productType.slug}`}
        className="group flex h-full min-h-80 cursor-pointer flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
      >
        <div className="flex h-40 items-center justify-center border-b border-slate-200 bg-[linear-gradient(135deg,#f8fafc_25%,#e2e8f0_25%,#e2e8f0_50%,#f8fafc_50%,#f8fafc_75%,#e2e8f0_75%)] bg-[length:20px_20px] p-5">
          <span className="rounded-lg bg-slate-900/90 px-4 py-2 text-center text-sm font-bold text-white">
            {productType.name}
          </span>
        </div>

        <div className="flex flex-1 flex-col p-5 sm:p-6">
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
                  <strong className="text-xl">{formatCurrency(minimumPrice)}</strong>
                </>
              )}
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
