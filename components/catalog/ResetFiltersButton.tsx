type ResetFiltersButtonProps = {
  onClick: () => void;
};

export function ResetFiltersButton({onClick}: ResetFiltersButtonProps) {
  return <button
    type="button"
    onClick={onClick}
    className="min-h-11 cursor-pointer rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:focus-visible:outline-brand-300"
  >
    Сбросить фильтры
  </button>;
}
