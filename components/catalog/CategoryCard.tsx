import {catalogImageUrl} from "@/lib/catalog-image";
import Link from "next/link";
import Image from "next/image";
import type {Category} from "@/types/category";

export function CategoryCard({category}: { category: Category }) {
  const hasImage = Boolean(category.imageUrl && !category.imageUrl.endsWith(".svg"));
  return (
    <article className="h-full">
      <Link
        href={`/catalog/${category.slug}`}
        className="group flex h-full min-h-52 flex-col rounded-xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
      >
        {hasImage && category.imageUrl ? <div className="relative aspect-[2/1] w-full shrink-0 overflow-hidden rounded-t-xl bg-white">
          <Image src={catalogImageUrl(category.imageUrl)} alt={category.name} fill
            sizes="(min-width: 1280px) 390px, (min-width: 640px) calc((100vw - 72px) / 2), calc(100vw - 34px)"
            className="object-contain"/>
        </div> : <div
          className="ml-5 mt-5 flex size-12 items-center justify-center rounded-lg bg-slate-900 text-xl font-black text-white sm:ml-6 sm:mt-6"
          aria-hidden
        >
          {category.name.slice(0, 2).toUpperCase()}
        </div>}
        <div className={`flex flex-1 flex-col px-5 pb-5 sm:px-6 sm:pb-6 ${hasImage ? "pt-4 sm:pt-5" : "pt-5 sm:pt-6"}`}>
          <h3 className="text-lg font-bold text-slate-950">
            {category.name}
          </h3>
          <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">
            {category.shortDescription}
          </p>
        </div>
      </Link>
    </article>
  );
}
