import {PreparedPhoto} from "@/components/ui/PreparedPhoto";
import type {CatalogGuideDiagram} from "@/data/catalog-description-copy";
import {catalogImageUrl} from "@/lib/catalog-image";
import {getPreparedPhoto} from "@/lib/server/preparedPhotos";
import {CatalogGuideDrawing, CatalogGuideSheetWidthDrawing} from "./CatalogGuideDrawing";
import {VgpDimensionsFigure, VgpLengthFigure, VgpSeriesFigure, VgpThreadFigure} from "./VgpDetailsVisuals";
import styles from "./CatalogGuideFigure.module.css";

const frame = `${styles.figure} min-w-0 rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-950`;
const labelClass = "text-xs text-slate-700 dark:text-slate-300";
const valueClass = "text-xs font-semibold tabular-nums text-slate-950 dark:text-slate-100";
const splitDrawings = new Set(["angle", "bar-form", "beam-series", "channel-series", "mesh-format",
  "mesh-types", "rebar-profiles", "woven-welded"]);

export function CatalogGuideFigure({diagram}: {diagram: CatalogGuideDiagram}) {
  const pipeFrame = `${frame} ${styles.pipeFigure}`;
  if (diagram.shape === "vgp-dimensions") return <VgpDimensionsFigure className={pipeFrame} dimensions={diagram.dimensions}/>;
  if (diagram.shape === "vgp-series") return <VgpSeriesFigure className={pipeFrame}/>;
  if (diagram.shape === "vgp-length") return <VgpLengthFigure className={pipeFrame}/>;
  if (diagram.shape === "vgp-thread") return <VgpThreadFigure className={pipeFrame}/>;

  if (diagram.shape === "photo") {
    return <figure className={`${frame} ${styles.photoFigure}`}>
      <div className={styles.photo}>
        <PreparedPhoto photo={getPreparedPhoto(diagram.src)} src={catalogImageUrl(diagram.src)} alt={diagram.alt}
          fill sizes="(max-width: 640px) calc(100vw - 64px), 420px" loading="lazy" className="object-cover"
          style={diagram.position ? {objectPosition: diagram.position} : undefined}/>
      </div>
      <figcaption className={`${labelClass} px-3 py-2.5`}>{diagram.caption}</figcaption>
    </figure>;
  }

  if (diagram.shape === "sheet-width") {
    return <figure className={`${frame} ${styles.diagramFigure}`}>
      <CatalogGuideSheetWidthDrawing/>
      <figcaption className={`${labelClass} text-center`}>Рабочая ширина уже учитывает боковой нахлёст.</figcaption>
    </figure>;
  }

  return <figure className={`${frame} ${styles.diagramFigure}`}>
    <CatalogGuideDrawing shape={diagram.shape}/>
    <dl className={splitDrawings.has(diagram.shape)
      ? `${styles.caption} ${styles.splitCaption} ${diagram.dimensions.length === 3 ? styles.threeCaptions : ""}`
      : styles.caption}>
      {diagram.dimensions.map(([label, value]) => <div key={label}>
        <dt className={labelClass}>{label}</dt>
        <dd className={valueClass}>{value}</dd>
      </div>)}
    </dl>
  </figure>;
}
