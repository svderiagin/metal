"use client";

import {type ReactNode, useId, useState} from "react";
import {Input} from "@/components/ui/Input";
import {Icon} from "@/components/ui/Icon";
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
  const selectedCount = activeFilters > 0 && <span className="whitespace-nowrap rounded-full bg-slate-200 px-2 py-0.5 text-xs tabular-nums dark:bg-slate-700">Выбрано: {activeFilters}</span>;

  return (
    <div className={`${styles.panel} w-full min-w-0 self-start rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-5 ${className}`}>
      <h2 className="sr-only">Фильтры</h2>
      <div className={styles.toolbar}>
        <label className="block min-w-0 text-sm font-semibold">
          Поиск товаров
          <Input type="search" value={query} onChange={event => onQueryChange(event.target.value)}
            className="mt-1" placeholder="Название, размер или марка стали"/>
        </label>
        <div className="min-w-0 [&>label]:block">{sorting}</div>
      </div>
      <div className="mt-3 lg:mt-4">
        <button type="button" aria-expanded={expanded} aria-controls={parametersId} onClick={() => setExpanded(current => !current)}
          className={`${styles.toggle} flex min-h-11 w-full cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm font-semibold hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:hover:bg-slate-800 lg:hidden`}>
          Параметры подбора
          {selectedCount}
          <Icon name="chevron-down" className="ml-auto"/>
        </button>
        <div id={parametersId} className={`mt-3 ${expanded ? "block" : "hidden"} lg:mt-0 lg:block`}>
          <div className={styles.fields}>{children}</div>
          {extraControls && <div className="mt-3 flex flex-wrap items-center gap-3 empty:hidden has-[>p:only-child:empty]:hidden">{extraControls}</div>}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-slate-200 pt-3 dark:border-slate-700">
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
          {resultCount && <p role="status" aria-atomic="true" aria-busy={resultCount.pending ?? false}
            className="text-sm text-slate-600 dark:text-slate-400">
            {resultCount.visible === resultCount.total ? "Позиций в таблице: " : "Найдено: "}
            <span className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">{resultCount.visible}</span>
            {resultCount.visible !== resultCount.total && <> из <span className="tabular-nums">{resultCount.total}</span></>}
          </p>}
          {selectedCount && <div className="hidden lg:block">{selectedCount}</div>}
        </div>
        <div className={styles.reset}><ResetFiltersButton onClick={onReset}/></div>
      </div>
    </div>
  );
}
