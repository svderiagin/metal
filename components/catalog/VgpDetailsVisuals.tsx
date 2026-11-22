import type {ReactNode} from "react";
import styles from "./VgpDetailsVisuals.module.css";

const guideDrawing = "grid h-12 place-items-center";
const figureLabel = "text-xs text-slate-600 dark:text-slate-300";
const figureValue = "text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100";

function VgpPipeSection({compact = false, thicker = false, showDiameter = false}: {
  compact?: boolean;
  thicker?: boolean;
  showDiameter?: boolean;
}) {
  return <div aria-hidden="true" className={`${styles.section} ${compact ? styles.compact : ""} ${thicker ? styles.thicker : ""}`}>
    {showDiameter && <span className={styles.diameter}><span>Ø</span></span>}
  </div>;
}

export function VgpPositionFigures({length}: {length?: ReactNode}) {
  return <div className={`grid max-w-xs items-start gap-3 text-center ${length ? "grid-cols-2" : "grid-cols-1"}`}>
    <figure className="min-w-0">
      <div className="grid h-16 place-items-center"><VgpPipeSection showDiameter/></div>
      <figcaption className={`mt-2 ${figureLabel}`}>
        <strong className={`mb-1 block ${figureValue}`}>Сечение</strong>
        <span className="block">Наружный Ø</span>
        <span className="block">Кольцо — стенка</span>
      </figcaption>
    </figure>
    {length && <figure className="min-w-0">
      <div aria-hidden="true" className={`${styles.longitudinal} mx-auto flex h-16 w-5/6 max-w-32 flex-col justify-center gap-2`}>
        <span className={styles.lengthMark}/>
        <span className={styles.pipe}/>
      </div>
      <figcaption className={`mt-2 ${figureLabel}`}>
        <strong className={`mb-1 block ${figureValue}`}>Одна труба</strong>
        <span className={figureValue}>{length}</span>
      </figcaption>
    </figure>}
  </div>;
}

export function VgpDimensionsFigure({className, dimensions}: {
  className: string;
  dimensions: readonly (readonly [label: string, value: string])[];
}) {
  return <figure aria-label="Размеры на примере из каталога" className={`${className} text-center`}>
    <div className={guideDrawing}><VgpPipeSection compact showDiameter/></div>
    <dl className="mt-2 grid grid-cols-[minmax(0,3fr)_minmax(0,4fr)_minmax(0,3fr)] items-end gap-x-2">
      {dimensions.map(([label, value]) => <div key={label} className="min-w-0">
        <dt className={figureLabel}>{label}</dt>
        <dd className={figureValue}>{value}</dd>
      </div>)}
    </dl>
  </figure>;
}

export function VgpSeriesFigure({className}: {className: string}) {
  return <figure className={`${className} text-center`}>
    <div className="grid grid-cols-2 gap-2">
      <div className="min-w-0">
        <div className={guideDrawing}><VgpPipeSection compact/></div>
        <p className={`mt-2 ${figureLabel}`}>Лёгкая</p>
        <p className={figureValue}>2,8 мм</p>
      </div>
      <div className="min-w-0 wrap-anywhere">
        <div className={guideDrawing}><VgpPipeSection compact thicker/></div>
        <p className={`mt-2 ${figureLabel}`}>Обыкновенная</p>
        <p className={figureValue}>3,2 мм</p>
      </div>
    </div>
    <figcaption className={`mt-2 ${figureLabel}`}>Ду 32 · наружный Ø 42,3 мм</figcaption>
  </figure>;
}

export function VgpLengthFigure({className}: {className: string}) {
  return <figure className={`${className} text-center`}>
    <div aria-hidden="true" className="grid grid-cols-2 gap-2">
      {[0, 1].map(index => <div key={index}>
        <div className={guideDrawing}><span className={`${styles.pipe} w-full`}/></div>
        <p className={`mt-2 ${figureValue}`}>6 м</p>
      </div>)}
    </div>
    <figcaption className={`mt-2 ${figureLabel}`}>2 трубы по 6 м · 12 м в поле «Заказ, м»</figcaption>
  </figure>;
}

export function VgpThreadFigure({className}: {className: string}) {
  return <figure className={`${className} text-center`}>
    <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-3">
      <div className="min-w-0">
        <div className={guideDrawing} aria-hidden="true"><div className={`${styles.connection} w-full`}><span className={styles.pipe}/><span className={styles.thread}/></div></div>
        <p className={`mt-2 ${figureValue}`}>Резьба на трубе</p>
      </div>
      <div className="min-w-0">
        <div className={guideDrawing} aria-hidden="true"><div className={`${styles.connection} w-full`}><span className={styles.coupling}/></div></div>
        <p className={`mt-2 ${figureValue}`}>Муфта</p>
      </div>
    </div>
    <figcaption className={`mt-2 ${figureLabel}`}>Уточните, входит ли муфта в поставку.</figcaption>
  </figure>;
}
