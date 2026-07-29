import {ButtonLink} from "./Button";

export function EmptyState({title, description}: { title: string; description: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center shadow-sm sm:px-8 sm:py-12">
      <h2 className="text-xl font-bold sm:text-2xl">{title}</h2>
      <p className="mx-auto mt-3 max-w-lg leading-7 text-slate-600">{description}</p>
      <ButtonLink href="/catalog" className="mt-6">
        Перейти в каталог
      </ButtonLink>
    </div>
  );
}
