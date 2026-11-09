"use client";

import {type ReactNode, useId, useState} from "react";
import {Input} from "@/components/ui/Input";
import {ResetFiltersButton} from "./ResetFiltersButton";
import styles from "./FilterPanel.module.css";

type Props = {
  query: string;
  onQueryChange: (value: string) => void;
  onReset: () => void;
  children: ReactNode;
  sorting: ReactNode;
  resultCount?: {visible: number; total: number; pending?: boolean};
  extraControls?: ReactNode;
  className?: string;
  activeFilters?: number;
};

export function FilterPanel({query, onQueryChange, onReset, children, sorting, resultCount, extraControls, className = "", activeFilters = 0}: Props) {
  const [expanded, setExpanded] = useState(false);
  const parametersId = useId();
  const selectedCount = activeFilters > 0 && <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs tabular-nums dark:bg-slate-700">Выбрано: {activeFilters}</span>;

  return (
    <div className={`${styles.panel} w-full min-w-0 self-start rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-5 lg:p-4 ${className}`}>
      <h2 className="sr-only">Фильтры</h2>
      <div className="grid items-end gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(220px,.55fr)]">
        <label className="block min-w-0 text-sm font-semibold">
          Поиск товаров
          <Input type="search" value={query} onChange={event => onQueryChange(event.target.value)}
            className="mt-1" placeholder="Название, размер или марка стали"/>
        </label>
        <div className="min-w-0 [&>label]:block">{sorting}</div>
      </div>
      <div className="mt-2">
        <button type="button" aria-expanded={expanded} aria-controls={parametersId} onClick={() => setExpanded(current => !current)}
          className={`${styles.toggle} flex min-h-11 w-full cursor-pointer items-center gap-2 rounded-lg text-left text-sm font-semibold lg:hidden`}>
          Параметры подбора
          {selectedCount}
          <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" className="ml-auto size-5 shrink-0">
            <path d="m5 7.5 5 5 5-5"/>
          </svg>
        </button>
        <div id={parametersId} className={`${expanded ? "block" : "hidden"} lg:block`}>
          <div className={`${styles.fields} grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6`}>{children}</div>
          {extraControls && <div className="mt-3 flex flex-wrap items-center gap-3 empty:hidden has-[>p:only-child:empty]:hidden">{extraControls}</div>}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-2 dark:border-slate-800">
        {resultCount && <p role="status" aria-atomic="true" aria-busy={resultCount.pending ?? false}
          className="text-sm text-slate-600 dark:text-slate-400">
          {resultCount.visible === resultCount.total ? "Позиций в таблице: " : "Найдено: "}
          <span className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">{resultCount.visible}</span>
          {resultCount.visible !== resultCount.total && <> из <span className="tabular-nums">{resultCount.total}</span></>}
        </p>}
        {activeFilters > 0 && <div className="hidden lg:block">{selectedCount}</div>}
        <div className="ml-auto"><ResetFiltersButton onClick={onReset}/></div>
      </div>
    </div>
  );
}
