import type {ReactNode} from "react";
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
  return (
    <div className={`${styles.panel} min-w-0 self-start rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-5 ${className}`}>
      <h2 className="sr-only">Фильтры</h2>
      <div className="grid items-end gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(220px,.55fr)]">
        <label className="block min-w-0 text-sm font-semibold">
          Поиск товаров
          <Input type="search" value={query} onChange={event => onQueryChange(event.target.value)}
            className="mt-1" placeholder="Название, размер или марка стали"/>
        </label>
        <div className="min-w-0 [&>label]:block">{sorting}</div>
      </div>
      <details className="mt-3 border-t border-slate-100 pt-2 dark:border-slate-800">
        <summary className="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-semibold">Параметры подбора
          {activeFilters > 0 && <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs tabular-nums dark:bg-slate-700">Выбрано: {activeFilters}</span>}
        </summary>
        <div className={`${styles.fields} mt-2 grid gap-4 sm:grid-cols-2 xl:grid-cols-4`}>{children}</div>
        {extraControls && <div className="mt-4 flex flex-wrap items-center gap-4">{extraControls}</div>}
      </details>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-2 dark:border-slate-800">
        {resultCount && <p role="status" aria-atomic="true" aria-busy={resultCount.pending ?? false}
          className="text-sm text-slate-600 dark:text-slate-400">
          {resultCount.visible === resultCount.total ? "Позиций в таблице: " : "Найдено: "}
          <span className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">{resultCount.visible}</span>
          {resultCount.visible !== resultCount.total && <> из <span className="tabular-nums">{resultCount.total}</span></>}
        </p>}
        <div className="ml-auto"><ResetFiltersButton onClick={onReset}/></div>
      </div>
    </div>
  );
}
