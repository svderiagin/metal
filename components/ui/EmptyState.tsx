import {ButtonLink} from "./Button";
import type {Ref} from "react";

export function EmptyState({title, description, headingRef}: {title: string; description: string; headingRef?: Ref<HTMLHeadingElement>}) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-5 py-10 text-center shadow-sm sm:px-8 sm:py-12">
      <h2 ref={headingRef} tabIndex={headingRef ? -1 : undefined} className="text-xl font-bold sm:text-2xl">{title}</h2>
      <p className="mx-auto mt-3 max-w-lg leading-7 text-slate-600 dark:text-slate-300">{description}</p>
      <ButtonLink href="/catalog" className="mt-6">
        Перейти в каталог
      </ButtonLink>
    </div>
  );
}
