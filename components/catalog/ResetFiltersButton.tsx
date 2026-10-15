type ResetFiltersButtonProps = {
  onClick: () => void;
};

export function ResetFiltersButton({onClick}: ResetFiltersButtonProps) {
  return <button
    type="button"
    onClick={onClick}
    className="min-h-11 cursor-pointer rounded-lg border border-red-700 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50 hover:text-red-900 active:bg-red-100 active:text-red-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-600 focus-visible:ring-offset-2"
  >
    Сбросить фильтры
  </button>;
}
