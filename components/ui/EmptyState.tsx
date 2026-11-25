import {ButtonLink} from "./Button";
import type {Ref} from "react";

export function EmptyState({title, description, headingRef, compact = false}: {
  title: string;
  description: string;
  headingRef?: Ref<HTMLHeadingElement>;
  compact?: boolean;
}) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-5 py-10 text-center shadow-sm sm:px-8 sm:py-12">
      <h2 ref={headingRef} tabIndex={headingRef ? -1 : undefined}
        className={compact ? "text-card-title" : "text-xl font-bold sm:text-2xl"}>{title}</h2>
      <p className={`mx-auto mt-3 max-w-lg text-slate-600 dark:text-slate-300 ${compact ? "text-sm" : "leading-7"}`}>{description}</p>
      <ButtonLink href="/catalog" className="mt-6">
        Перейти в каталог
      </ButtonLink>
    </div>
  );
}
