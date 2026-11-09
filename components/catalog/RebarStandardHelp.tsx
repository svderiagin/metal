"use client";

import {useId, useRef} from "react";
import {Icon} from "@/components/ui/Icon";

const explanations = [
  {
    code: "ГОСТ 34028-2016",
    description: "Стандарт на арматуру для железобетона. Он описывает классы арматуры, её размеры, свойства и маркировку.",
  },
  {
    code: "ГОСТ 5781-82",
    description: "Стандарт на горячекатаную арматурную сталь для железобетона. Он охватывает гладкие и рифлёные прутки.",
  },
];

export function RebarStandardHelp({standard}: {standard: string}) {
  const titleId = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const codes = standard.split(" или ");
  const relevant = explanations.filter(({code}) => codes.includes(code));
  if (relevant.length === 0) return null;

  return <>
    <button ref={trigger} type="button" aria-label={`Что означает этот ГОСТ? ${standard}`} aria-haspopup="dialog"
      onClick={() => dialog.current?.showModal()}
      className="relative z-10 grid size-11 shrink-0 cursor-pointer place-items-center rounded-lg text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-brand-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:focus-visible:outline-brand-300">
      <Icon name="help"/>
    </button>
    <dialog ref={dialog} aria-labelledby={titleId}
      onClose={() => trigger.current?.focus({preventScroll: true})}
      onClick={event => {if (event.target === event.currentTarget) event.currentTarget.close();}}
      className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-xl border border-slate-200 bg-white p-0 text-slate-950 shadow-xl backdrop:bg-slate-950/50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <h2 id={titleId} className="min-w-0 pt-1.5 text-card-title">Что означает этот ГОСТ?</h2>
          <form method="dialog">
            <button type="submit" autoFocus aria-label="Закрыть пояснение"
              className="grid size-11 cursor-pointer place-items-center rounded-lg text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-brand-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:focus-visible:outline-brand-300">
              <Icon name="close"/>
            </button>
          </form>
        </div>
        <dl className="mt-3 space-y-3 text-sm">
          {relevant.map(({code, description}) => <div key={code}>
            <dt className="font-semibold">{code}</dt>
            <dd className="mt-1 text-slate-700 dark:text-slate-300">{description}</dd>
          </div>)}
        </dl>
        <p className="mt-4 border-t border-slate-200 pt-3 text-sm text-slate-700 dark:border-slate-700 dark:text-slate-300">
          Если в проекте указан ГОСТ, сверьте его вместе с классом арматуры и диаметром.
        </p>
      </div>
    </dialog>
  </>;
}
