import {Icon} from "@/components/ui/Icon";

export function CoverGalleryNavigation({onPrevious, onNext, className = ""}: {onPrevious: () => void; onNext: () => void; className?: string}) {
  return <>
    {[
      {label: "Предыдущее фото", action: onPrevious, position: "left-2 sm:left-3", icon: "chevron-left" as const},
      {label: "Следующее фото", action: onNext, position: "right-2 sm:right-3", icon: "chevron-right" as const},
    ].map(({label, action, position, icon}) => <button key={label} type="button" onClick={action} aria-label={label}
      className={`absolute top-1/2 z-10 flex size-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-slate-200/50 bg-white/55 text-slate-900 shadow-sm transition-colors hover:bg-white/85 focus-visible:bg-white/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 dark:border-slate-600/50 dark:bg-slate-900/55 dark:text-white dark:hover:bg-slate-800/85 dark:focus-visible:bg-slate-900/85 dark:focus-visible:outline-brand-300 ${position} ${className}`}>
      <Icon name={icon}/>
    </button>)}
  </>;
}
