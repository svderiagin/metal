export function CoverGalleryNavigation({onPrevious, onNext}: {onPrevious: () => void; onNext: () => void}) {
  return <>
    {[
      {label: "Предыдущее фото", action: onPrevious, position: "left-2 sm:left-3", path: "m14 6-6 6 6 6"},
      {label: "Следующее фото", action: onNext, position: "right-2 sm:right-3", path: "m10 6 6 6-6 6"},
    ].map(({label, action, position, path}) => <button key={label} type="button" onClick={action} aria-label={label}
      className={`absolute top-1/2 z-10 flex size-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-900 shadow-md transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 dark:border-slate-600 dark:bg-slate-900/95 dark:text-white dark:hover:bg-slate-800 dark:focus-visible:outline-brand-300 ${position}`}>
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5">
        <path d={path} strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>)}
  </>;
}
