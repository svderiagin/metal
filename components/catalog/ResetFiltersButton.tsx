type ResetFiltersButtonProps = {
  onClick: () => void;
};

export function ResetFiltersButton({onClick}: ResetFiltersButtonProps) {
  return <button
    type="button"
    onClick={onClick}
    className="min-h-11 cursor-pointer rounded-lg border border-red-700 dark:border-red-400 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-semibold text-red-700 dark:text-red-400 transition-colors hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-900 dark:hover:text-red-300 active:bg-red-100 dark:active:bg-red-950/60 active:text-red-950 dark:active:text-red-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-600 dark:focus-visible:ring-red-300 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
  >
    Сбросить фильтры
  </button>;
}
