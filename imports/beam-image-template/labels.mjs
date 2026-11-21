import {readFile} from "node:fs/promises";
import fontkit from "@pdf-lib/fontkit";
import sharp from "sharp";

const font = fontkit.create(await readFile(new URL("../shveller-image-template/fonts/Inter-variable.ttf", import.meta.url)));

// Calibrated against the owner's 2400 × 1800 JPGs at their native resolution.
// Explicit optical size keeps the same glyph shapes on different OS font backends.
const footer = {size: 41.5, weight: 750, opticalSize: 14};
const styles = {
  title: {size: 83, weight: 730, opticalSize: 18},
  dimension: {size: 55.5, weight: 470, opticalSize: 18},
  caption: {size: 41.5, weight: 420, opticalSize: 16},
  length: footer,
  mass: footer,
};
const faces = new Map(Object.values(styles).map(style => [
  style, font.getVariation({wght: style.weight, opsz: style.opticalSize}),
]));

/** Return a tightly cropped, transparent PNG in Sharp's {data, info} format. */
export async function renderBeamLabel(kind, text) {
  const style = styles[kind];
  if (!style || !text.trim()) throw new Error(`Invalid beam label: ${kind} / ${text}`);
  const face = faces.get(style);
  const run = face.layout(text);
  const scale = style.size / face.unitsPerEm;
  const left = Math.floor(run.bbox.minX * scale);
  const top = Math.ceil(run.bbox.maxY * scale);
  const width = Math.ceil(run.bbox.maxX * scale) - left;
  const height = top - Math.floor(run.bbox.minY * scale);
  let pen = 0;
  const outlines = run.glyphs.map((glyph, index) => {
    const position = run.positions[index];
    const x = pen + position.xOffset;
    pen += position.xAdvance;
    return `<path transform="translate(${x} ${position.yOffset})" d="${glyph.path.toSVG()}"/>`;
  });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <g fill="#41464d" transform="translate(${-left} ${top}) scale(${scale} ${-scale})">${outlines.join("")}</g></svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer({resolveWithObject: true});
}
