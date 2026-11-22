import type {ReactNode} from "react";
import styles from "./VgpDetailsVisuals.module.css";

function VgpPipeSection({compact = false, thicker = false}: {compact?: boolean; thicker?: boolean}) {
  return <div aria-hidden="true" className={`${styles.section} ${compact ? styles.compact : ""} ${thicker ? styles.thicker : ""}`}>
    {!compact && <span className={styles.diameter}><span>Ø</span></span>}
  </div>;
}

export function VgpPositionFigures({length}: {length?: ReactNode}) {
  const caption = "mt-2 text-xs text-slate-600 dark:text-slate-300";
  return <div className="grid grid-cols-2 items-start gap-3">
    <figure className="min-w-0">
      <div className="grid h-[4.5rem] place-items-center"><VgpPipeSection/></div>
      <figcaption className={caption}>
        <strong className="block font-semibold text-slate-800 dark:text-slate-100">Сечение</strong>
        Ø — наружный диаметр. Кольцо — стенка.
      </figcaption>
    </figure>
    {length && <figure className="min-w-0">
      <div aria-hidden="true" className={`${styles.longitudinal} flex h-[4.5rem] flex-col justify-center gap-2`}>
        <span className={styles.lengthMark}/>
        <span className={styles.pipe}/>
      </div>
      <figcaption className={caption}>
        <strong className="block font-semibold text-slate-800 dark:text-slate-100">Одна труба</strong>
        <span className="font-semibold tabular-nums">{length}</span>
      </figcaption>
    </figure>}
  </div>;
}

export function VgpSeriesFigure({className}: {className: string}) {
  return <figure className={className}>
    <figcaption className="text-xs font-semibold text-slate-700 dark:text-slate-300">Ду 32 · наружный Ø 42,3 мм</figcaption>
    <div className="mt-2 grid grid-cols-2 gap-3">
      <div className="min-w-0">
        <VgpPipeSection compact/>
        <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">Лёгкая</p>
        <p className="text-sm font-semibold tabular-nums">2,8 мм</p>
      </div>
      <div className="min-w-0">
        <VgpPipeSection compact thicker/>
        <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">Обыкновенная</p>
        <p className="text-sm font-semibold tabular-nums">3,2 мм</p>
      </div>
    </div>
  </figure>;
}

export function VgpLengthFigure({className}: {className: string}) {
  return <figure className={className}>
    <div aria-hidden="true" className="grid grid-cols-2 gap-2">
      <div className="text-center"><span className={styles.pipe}/> <span className="text-xs tabular-nums">6 м</span></div>
      <div className="text-center"><span className={styles.pipe}/> <span className="text-xs tabular-nums">6 м</span></div>
    </div>
    <figcaption className="mt-1 text-xs font-semibold">2 трубы по 6 м · 12 м в поле «Заказ, м»</figcaption>
  </figure>;
}

export function VgpThreadFigure({className}: {className: string}) {
  return <figure className={className}>
    <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] items-start gap-3 text-xs text-slate-700 dark:text-slate-300">
      <div className="min-w-0">
        <div className={styles.connection} aria-hidden="true"><span className={styles.pipe}/><span className={styles.thread}/></div>
        <p className="mt-1 font-semibold">Резьба на трубе</p>
      </div>
      <div className="min-w-0">
        <div className={styles.connection} aria-hidden="true"><span className={styles.coupling}/></div>
        <p className="mt-1 font-semibold">Муфта</p>
      </div>
    </div>
    <figcaption className="mt-2 text-xs text-slate-600 dark:text-slate-300">Сверьте размер резьбы и уточните, входит ли муфта в поставку.</figcaption>
  </figure>;
}
