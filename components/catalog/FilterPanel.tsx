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
  resultSummary?: ReactNode;
  extraControls?: ReactNode;
  className?: string;
};

export function FilterPanel({query, onQueryChange, onReset, children, sorting, resultSummary, extraControls, className = ""}: Props) {
  return (
    <div className={`${styles.panel} min-w-0 self-start rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm sm:p-6 lg:self-stretch ${className}`}>
      <h2 className="text-xl font-bold">Фильтры</h2>
      <label className="mt-4 block text-sm font-semibold">
        Поиск товаров
        <Input type="search" value={query} onChange={event => onQueryChange(event.target.value)}
          className="mt-1" placeholder="Название, размер или марка стали"/>
      </label>
      <div className={`${styles.fields} mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3`}>
        {children}
      </div>
      <div className="mt-4 flex flex-wrap items-end gap-x-4 gap-y-2">
        <div className="grid w-full items-end gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div className="min-w-0 [&>label]:block">
            {sorting}
          </div>
          {resultSummary ? (
            <div className="flex flex-wrap items-center justify-between gap-3 sm:col-span-2 xl:col-span-3">
              {resultSummary}
              <div className="ml-auto"><ResetFiltersButton onClick={onReset}/></div>
            </div>
          ) : (
            <div className="justify-self-end sm:col-start-2 xl:col-start-3"><ResetFiltersButton onClick={onReset}/></div>
          )}
        </div>
        {extraControls}
      </div>
    </div>
  );
}
