import type {ReactNode} from "react";
import type {CatalogGuideShape} from "@/data/catalog-description-copy";
import styles from "./CatalogGuideFigure.module.css";

function Measure({x1, y1, x2, y2}: {x1: number; y1: number; x2: number; y2: number}) {
  const horizontal = y1 === y2;
  return <g className={styles.measure}>
    <path d={horizontal
      ? `M${x1} ${y1 - 4}v8 M${x2} ${y2 - 4}v8 M${x1} ${y1}H${x2}`
      : `M${x1 - 4} ${y1}h8 M${x2 - 4} ${y2}h8 M${x1} ${y1}V${y2}`}/>
  </g>;
}

function Beam({center, halfWidth, top = 10, bottom = 66}: {
  center: number; halfWidth: number; top?: number; bottom?: number;
}) {
  const left = center - halfWidth;
  const right = center + halfWidth;
  const web = top + 6;
  return <path className={styles.steel}
    d={`M${left} ${top}H${right}v6H${center + 3}V${bottom - 6}H${right}v6H${left}v-6H${center - 3}V${web}H${left}Z`}/>;
}

function Grid({x, y, columns, rows, step = 13}: {
  x: number; y: number; columns: number; rows: number; step?: number;
}) {
  return <path d={[
    ...Array.from({length: columns + 1}, (_, i) => `M${x + i * step} ${y}v${rows * step}`),
    ...Array.from({length: rows + 1}, (_, i) => `M${x} ${y + i * step}h${columns * step}`),
  ].join(" ")}/>;
}

function ChainMesh({x}: {x: number}) {
  return <g transform={`translate(${x} 8)`}>
    <path d="m0 16 16 16 16-16 16 16 16-16 16 16 M0 32l16-16L32 0l16 16L64 0l16 16 M0 32l16 16 16-16 16 16 16-16 16 16 M0 48l16 16 16-16 16 16 16-16 16 16 M16 16l16 16m16-16 16 16 M16 32 0 48m32 0L16 64m32-32L32 48m32 0L48 64m32-32L64 48m16 0L64 64"/>
  </g>;
}

const roll = <><path className={styles.steel} d="M132 14h48v49h-48a11 24.5 0 0 0 0-49Z"/>
  <ellipse className={styles.steel} cx="132" cy="38.5" rx="11" ry="24.5"/>
  <ellipse cx="132" cy="38.5" rx="5" ry="16"/><path d="M145 26h35m-35 12h35m-35 12h35m-23-36v49m12-49v49"/></>;

const drawings: Record<CatalogGuideShape, ReactNode> = {
  "rebar-profiles": <>
    <path className={styles.steel} d="M24 26h65v24H24a7 12 0 1 1 0-24Z M133 26h65v24h-65a7 12 0 1 1 0-24Z"/>
    <path d="m137 26 9 24m7-24 9 24m7-24 9 24m7-24 9 24"/>
    <ellipse className={styles.steel} cx="89" cy="38" rx="7" ry="12"/>
    <ellipse className={styles.steel} cx="198" cy="38" rx="7" ry="12"/>
  </>,
  "solid-round": <>
    <circle className={styles.steel} cx="110" cy="34" r="23"/>
    <Measure x1={87} x2={133} y1={65} y2={65}/>
    <text x="110" y="39">Ø</text>
  </>,
  "ribbed-round": <>
    <path className={styles.steel} d="M31 24h92v26H31a7 13 0 1 1 0-26Z"/>
    <path d="m40 24 10 26m7-26 10 26m7-26 10 26m7-26 10 26m7-26 10 26"/>
    <ellipse className={styles.steel} cx="123" cy="37" rx="9" ry="13"/>
    <circle className={styles.steel} cx="170" cy="36" r="15"/>
    <Measure x1={155} x2={185} y1={59} y2={59}/>
    <text x="170" y="40">Ø</text>
  </>,
  "bar-form": <>
    <rect className={styles.steel} x="16" y="25" width="75" height="8" rx="3"/>
    <rect className={styles.steel} x="16" y="43" width="75" height="8" rx="3"/>
    <ellipse className={styles.steel} cx="163" cy="38" rx="34" ry="24"/>
    <ellipse className={styles.opening} cx="163" cy="38" rx="22" ry="14"/>
    <path d="M130 36c8-23 58-23 66 0m-65 9c8 22 57 22 64 0"/>
  </>,
  "bend": <>
    <path className={styles.heavy} d="M53 18h17a9 9 0 0 1 9 9v27a10 10 0 0 0 10 10h42a10 10 0 0 0 10-10V27a9 9 0 0 1 9-9h17"/>
    <path d="M106 42 83 59m-1-6 1 6 6 1"/>
    <text x="114" y="46">R</text>
  </>,
  "square": <>
    <rect className={styles.steel} x="83" y="8" width="54" height="54" rx="6"/>
    <rect className={styles.opening} x="91" y="16" width="38" height="38" rx="4"/>
    <Measure x1={83} x2={137} y1={70} y2={70}/><Measure x1={72} x2={72} y1={8} y2={62}/>
    <path d="M141 38h14"/><text x="164" y="42">s</text>
  </>,
  "rectangle": <>
    <rect className={styles.steel} x="62" y="13" width="96" height="45" rx="6"/>
    <rect className={styles.opening} x="69" y="20" width="82" height="31" rx="3"/>
    <Measure x1={62} x2={158} y1={69} y2={69}/><Measure x1={51} x2={51} y1={13} y2={58}/>
    <path d="M163 36h13"/><text x="186" y="40">s</text>
  </>,
  "tube-fit": <>
    <rect className={styles.steel} x="60" y="8" width="100" height="60" rx="8"/>
    <rect className={styles.opening} x="68" y="16" width="84" height="44" rx="5"/>
    <rect className={styles.steel} x="83" y="24" width="54" height="28" rx="4"/>
    <rect className={styles.opening} x="89" y="30" width="42" height="16" rx="2"/>
    <path d="m150 36-5 3 5 3M179 38h-19"/>
    <Measure x1={68} x2={83} y1={39} y2={39}/>
  </>,
  "round": <>
    <circle className={styles.steel} cx="110" cy="38" r="28"/>
    <circle className={styles.opening} cx="110" cy="38" r="21"/>
    <Measure x1={76} x2={144} y1={38} y2={38}/>
    <path d="m131 20 17-12h12"/><text x="169" y="12">s</text>
  </>,
  "cut": <>
    <rect className={styles.steel} x="20" y="28" width="180" height="20" rx="2"/>
    <path className={styles.opening} d="M81 28h7v20h-7z m66 0h7v20h-7z"/>
    <path className={styles.dashed} d="M84.5 19v38m66-38v38"/>
    <Measure x1={20} x2={200} y1={11} y2={11}/>
  </>,
  "length": <>
    <rect className={styles.steel} x="25" y="35" width="170" height="16" rx="2"/>
    <Measure x1={25} x2={195} y1={21} y2={21}/>
    <path className={styles.dashed} d="M25 26v10m170-10v10"/>
  </>,
  "linear-mass": <>
    <rect className={styles.steel} x="16" y="34" width="70" height="13" rx="2"/>
    <Measure x1={16} x2={86} y1={24} y2={24}/>
    <text x="51" y="64">м</text>
    <path d="M102 39h27m-5-5 5 5-5 5"/>
    <path className={styles.steel} d="M151 53l6-23h30l6 23Z"/>
    <circle cx="172" cy="24" r="6"/>
    <text x="172" y="46">кг</text>
  </>,
  "beam": <>
    <Beam center={109} halfWidth={33} top={16} bottom={65}/>
    <Measure x1={76} x2={142} y1={7} y2={7}/><Measure x1={64} x2={64} y1={16} y2={65}/>
    <path d="M114 38h39m-10-19h16"/>
    <text x="53" y="44">h</text><text x="108" y="29">b</text>
    <text x="166" y="23">t</text><text x="160" y="42">s</text>
  </>,
  "beam-wide": <>
    <Beam center={110} halfWidth={41} top={14} bottom={61}/>
    <Measure x1={69} x2={151} y1={69} y2={69}/>
    <text x="110" y="40" className={styles.inlineLabel}>b</text>
  </>,
  "beam-series": <>
    <Beam center={36} halfWidth={16}/><Beam center={110} halfWidth={25}/><Beam center={184} halfWidth={29} top={14} bottom={62}/>
  </>,
  "trolley": <>
    <path className={styles.steel} d="M63 8h94v5l-43 5v35l43 5v5H63v-5l43-5V18l-43-5Z"/>
    <circle className={styles.opening} cx="82" cy="46" r="10"/><circle className={styles.opening} cx="138" cy="46" r="10"/>
    <path d="M82 46H54v26h112V46h-28"/>
    <circle className={styles.steel} cx="82" cy="46" r="3"/><circle className={styles.steel} cx="138" cy="46" r="3"/>
  </>,
  "channel": <>
    <path className={styles.steel} d="M72 13h72v8H81v35h63v8H72Z"/>
    <Measure x1={61} x2={61} y1={13} y2={64}/><Measure x1={72} x2={144} y1={73} y2={73}/>
    <text x="49" y="43">h</text><text x="158" y="74">b</text>
  </>,
  "channel-series": <>
    <path className={styles.steel} d="M27 12h58v8H35v36h50v8H27Z"/>
    <path className={styles.steel} d="M135 12h58v6l-45 6a5 5 0 0 0-5 5v18a5 5 0 0 0 5 5l45 6v6h-58Z"/>
    <path className={styles.dashed} d="M148 24h45m-45 28h45"/>
  </>,
  "angle": <>
    <path className={styles.steel} d="M29 17h8v37h37v8H29Z M122 12h8v42h62v8h-70Z"/>
    <Measure x1={29} x2={74} y1={71} y2={71}/><Measure x1={122} x2={192} y1={71} y2={71}/>
  </>,
  "solid-square": <>
    <rect className={styles.steel} x="86" y="10" width="48" height="48" rx="3"/>
    <Measure x1={86} x2={134} y1={67} y2={67}/><Measure x1={75} x2={75} y1={10} y2={58}/>
  </>,
  "strip": <>
    <rect className={styles.steel} x="35" y="25" width="150" height="18" rx="2"/>
    <Measure x1={35} x2={185} y1={55} y2={55}/><Measure x1={195} x2={195} y1={25} y2={43}/>
  </>,
  "plate": <>
    <path className={styles.steel} d="m27 47 35-29h131l-35 29Zm0 0v8h131l35-29v-8m-35 29v8"/>
    <Measure x1={27} x2={158} y1={66} y2={66}/>
  </>,
  "sheet-layout": <>
    <rect className={styles.steel} x="30" y="9" width="160" height="57" rx="3"/>
    <rect className={styles.opening} x="37" y="16" width="67" height="18" rx="2"/>
    <rect className={styles.opening} x="37" y="40" width="67" height="19" rx="2"/>
    <rect className={styles.opening} x="110" y="16" width="44" height="43" rx="2"/>
    <path className={styles.dashed} d="M162 16h21v43h-21z"/>
  </>,
  "profile-sheet": <>
    <path className={styles.heavy} d="M21 53h23l14-29h24l14 29h26l14-29h24l14 29h25"/>
    <Measure x1={125} x2={125} y1={24} y2={53}/>
    <text x="112" y="42">h</text>
    <path d="M153 14v8m-3-3 3 3 3-3"/>
    <text x="166" y="14">t</text>
  </>,
  "support": <>
    <path className={styles.heavy} d="M25 43h170"/>
    <path className={styles.steel} d="m38 61 11-17 11 17Zm122 0 11-17 11 17Z"/>
    <path d="M72 14v16m-4-5 4 5 4-5m34-11v16m-4-5 4 5 4-5m34-11v16m-4-5 4 5 4-5"/>
    <Measure x1={49} x2={171} y1={68} y2={68}/>
  </>,
  "coating": <>
    <rect className={styles.steel} x="32" y="24" width="156" height="29" rx="2"/>
    <path className={styles.highlight} d="M34 21h152v5H34zm0 30h152v5H34z"/>
    <path d="m127 21 10-10h32m-42 44 10 11h32"/>
  </>,
  "finish": <>
    <path className={styles.steel} d="m26 47 42-24h125l-42 24Z"/>
    <path className={styles.highlight} d="M26 47v6h125l42-24v-6l-42 24Z"/>
    <path d="m96 26-7-12H64m49 38 9 11h27"/>
  </>,
  "mesh": <>
    <rect className={styles.steel} x="94" y="20" width="32" height="32"/>
    <g className={styles.heavy}><Grid x={62} y={20} columns={3} rows={1} step={32}/></g>
    <Measure x1={94} x2={126} y1={10} y2={10}/>
    <Measure x1={96} x2={124} y1={36} y2={36}/>
    <text x="53" y="14">Шаг</text><text x="107" y="73">Просвет</text>
    <path d="M110 61V45"/>
  </>,
  "woven-mesh": <>
    <g transform="translate(70)"><ChainMesh x={0}/></g>
    <path d="m104 28 13 13m-13-7v-6h6m1 13h6v-6"/>
  </>,
  "mesh-types": <>
    <ChainMesh x={12}/>
    <Grid x={135} y={12} columns={4} rows={4} step={13}/>
    <circle className={styles.highlight} cx="161" cy="38" r="3"/>
  </>,
  "woven-welded": <>
    <path d="M20 16q-4 5 0 11t0 11t0 11t0 11m16-44q-4 5 0 11t0 11t0 11t0 11m16-44q-4 5 0 11t0 11t0 11t0 11m16-44q-4 5 0 11t0 11t0 11t0 11m16-44q-4 5 0 11t0 11t0 11t0 11M17 20q6-4 13 0t13 0t13 0t13 0t13 0M17 37q6-4 13 0t13 0t13 0t13 0t13 0M17 54q6-4 13 0t13 0t13 0t13 0t13 0"/>
    <Grid x={135} y={12} columns={4} rows={4} step={13}/>
    <circle className={styles.highlight} cx="161" cy="38" r="3"/>
  </>,
  "mesh-format": <>
    <g transform="translate(-111)">{roll}</g>
    <Grid x={119} y={13} columns={6} rows={4} step={13}/>
  </>,
  "mesh-roll": <><Grid x={40} y={14} columns={6} rows={3} step={16.3}/>{roll}</>,
  "mesh-card": <>
    <Grid x={52} y={13} columns={8} rows={4} step={13}/>
    <Measure x1={52} x2={156} y1={73} y2={73}/><Measure x1={43} x2={43} y1={13} y2={65}/>
  </>,
  "picket-spacing": <>
    <path className={styles.steel} d="M47 65V19a17 8 0 0 1 34 0v46Zm46 0V19a17 8 0 0 1 34 0v46Zm46 0V19a17 8 0 0 1 34 0v46Z"/>
    <path d="M64 22v39m46-39v39m46-39v39"/>
    <Measure x1={64} x2={110} y1={73} y2={73}/>
  </>,
};

export function CatalogGuideDrawing({shape}: {shape: CatalogGuideShape}) {
  return <svg className={styles.drawing} viewBox="0 0 220 76" aria-hidden="true">{drawings[shape]}</svg>;
}

export function CatalogGuideSheetWidthDrawing() {
  return <svg className={styles.drawing} viewBox="0 0 220 76" aria-hidden="true">
    <rect className={styles.steel} x="14" y="24" width="107" height="23" rx="3"/>
    <rect className={styles.opening} x="97" y="34" width="107" height="21" rx="3"/>
    <path className={styles.highlight} d="M97 34h24v13H97z"/>
    <path d="M29 25v21m17-21v21m17-21v21m17-21v21m58-11v18m17-18v18m17-18v18m17-18v18M109 40l18-17h13"/>
    <Measure x1={14} x2={121} y1={16} y2={16}/>
    <Measure x1={14} x2={97} y1={57} y2={57}/>
    <text x="68" y="9">Полная</text>
    <text x="57" y="73">Рабочая</text>
    <text x="173" y="26">Нахлёст</text>
  </svg>;
}
