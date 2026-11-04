import Image from "next/image";
import {catalogImageUrl} from "@/lib/catalog-image";

const imageSizes = "(min-width: 1360px) 1004px, (min-width: 1024px) calc(100vw - 356px), (min-width: 640px) calc(100vw - 40px), calc(100vw - 32px)";

export function CategoryCover({name, imageUrl, summary, descriptionId}: {
  name: string;
  imageUrl: string;
  summary: string;
  descriptionId: string;
}) {
  return (
    <header>
      <div className="relative aspect-[2/1] w-full overflow-hidden rounded-xl bg-white sm:aspect-[5/2]">
        <Image src={catalogImageUrl(imageUrl)} alt={name} fill sizes={imageSizes}
          loading="eager" fetchPriority="high" className="object-cover object-center"/>
      </div>
      <div className="mt-5 grid min-h-[13.5rem] grid-rows-[1fr_auto] gap-3 sm:mt-6 sm:min-h-[10rem]">
        <div>
          <h1 className="text-page-title">{name}</h1>
          <p className="mt-2 line-clamp-3 max-w-[72ch] text-base text-slate-700 dark:text-slate-300 sm:line-clamp-2">
            {summary}
          </p>
        </div>
        <a href={`#${descriptionId}`}
          className="inline-flex min-h-11 w-fit items-center rounded-sm text-sm font-semibold text-red-700 underline decoration-red-700/40 underline-offset-4 hover:decoration-current focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red-700 dark:text-red-400 dark:decoration-red-400/40 dark:focus-visible:outline-red-400">
          Подробнее о категории
          <span aria-hidden="true" className="ml-2">↓</span>
        </a>
      </div>
    </header>
  );
}
