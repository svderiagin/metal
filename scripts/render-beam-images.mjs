// Run with node --import tsx. Optional SKU arguments limit the preview or write.
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import {catalogMeasurementUrl} from "./catalog-measurement-path.mjs";
import sharp from "sharp";
import {getAllProductVariants} from "../lib/catalog.ts";
import {beamProfile, beamReferenceMassKg, beamSeries} from "../lib/beam.ts";
import {isDemonstrationProduct} from "../lib/catalogOffer.ts";
import {productIllustrationSignature} from "../lib/productPreviewImage.ts";
import {renderBeamLabel} from "../imports/beam-image-template/labels.mjs";

const directory = "imports/beam-image-template";
const templates = JSON.parse(await fs.readFile(path.join(directory, "templates.json"), "utf8"));
const sections = JSON.parse(await fs.readFile(path.join(directory, "sections.json"), "utf8"));
const outputDirectory = ".tmp/beam-series/preview";
const write = process.argv.includes("--write");
const ids = new Set(process.argv.slice(2).filter(arg => arg !== "--write"));
const products = getAllProductVariants().filter(p => p.categoryId === "cat-bal" && (!ids.size || ids.has(p.id)));
assert.ok(products.length && (!ids.size || products.length === ids.size), "Unknown beam SKU");
await fs.mkdir(outputDirectory, {recursive: true});

const canvas = {width: 2400, height: 1800, channels: 3};
const number = new Intl.NumberFormat("ru-RU");
const dimension = n => `${number.format(n)} мм`;
const mass = n => `${number.format(n)} кг/м`;

async function pixels(source) {
  const {data, info} = await sharp(source).toColourspace("srgb").removeAlpha().raw().toBuffer({resolveWithObject: true});
  for (const key of Object.keys(canvas)) assert.equal(info[key], canvas[key], source);
  return data;
}

async function loadTemplate(layout) {
  const {folder, profile} = layout;
  const root = `/images/catalog/balka/balka-${folder}/originals`;
  const photoUrl = `${root}/balka_${folder}_2400_1800_marked.jpg`;
  const [markedPixels, cleanPixels] = await Promise.all([
    pixels(`public${photoUrl}`), pixels(`public${root}/balka_${folder}_2400_1800_original.jpg`),
  ]);
  const section = sections[profile];
  return {layout, photoUrl, markedPixels, cleanPixels, labels: {
    title: profile, height: dimension(section.height), width: dimension(section.width),
    web: dimension(section.web), flange: dimension(section.flange),
    lengthCaption: "Длина по каталогу", lengthValue: "12 м",
    massCaption: "Теоретическая масса", massValue: mass(section.mass),
  }};
}

function productLabels(product, series) {
  const demo = isDemonstrationProduct(product);
  const profile = beamProfile(product);
  // ГОСТ 27772 identifies the steel; it cannot settle the dimensions of the section.
  const confirmed = !demo && (series === "М" ? /\b19425\b/ : /\b35087\b/).test(product.standard);
  const section = confirmed ? sections[profile] : undefined;
  const referenceMass = beamReferenceMassKg(product);
  const displayedMass = section?.mass ?? referenceMass;
  if (confirmed) {
    assert.ok(section, `Missing section for ${product.id} (${profile})`);
    assert.equal(section.mass, product.weightPerMeterKg, `Catalog mass disagrees for ${product.id}`);
  }
  if (!demo) assert.ok(product.lengthMeters > 0, `Missing length for ${product.id}`);
  return {
    title: demo ? "широкополочная" : profile,
    height: section ? dimension(section.height) : "h", width: section ? dimension(section.width) : "b",
    web: section ? dimension(section.web) : "s", flange: section ? dimension(section.flange) : "t",
    lengthCaption: demo ? "Профиль и размеры" : "Длина по каталогу",
    lengthValue: demo ? "уточняются" : `${number.format(product.lengthMeters)} м`,
    massCaption: demo ? "" : section ? "Теоретическая масса" : referenceMass ? "Справочная масса" : "Размеры и масса",
    massValue: demo ? "" : displayedMass === undefined ? "уточняются" : mass(displayedMass),
  };
}

// Each patch encloses the original inscription and its replacement on the same photograph.
// Restore short sections of interrupted dimension lines inside only the two central patches.
function labelPlacements({height: [hx, hy], width: [bx, by], web: [wr, wt], flange: [fl, ft]}, demo) {
  const webLeft = Math.max(wr - 275, hx + 6);
  return {
    title: {kind: "title", x: 400, y: demo ? 146 : 130, box: [389, 109, demo ? 1050 : 385, 132]},
    height: {kind: "dimension", x: hx, y: hy - 21, align: "center", line: "vertical", axis: hx,
      box: [hx - 125, hy - 42, 250, 84]},
    width: {kind: "dimension", x: bx, y: by - 21, align: "center", line: "horizontal", axis: by,
      box: [bx - 132, by - 39, 264, 82]},
    web: {kind: "dimension", x: wr, y: wt, align: "right", box: [webLeft, wt - 6, wr + 5 - webLeft, 72]},
    flange: {kind: "dimension", x: fl, y: ft, halo: true, box: [fl - 33, ft - 34, 338, 132]},
    lengthCaption: {kind: "caption", x: 132, y: 1568, box: [115, 1552, 470, 69]},
    lengthValue: {kind: "length", x: 608, y: 1569, box: [596, 1552, 432, 69]},
    massCaption: {kind: "caption", x: 132, y: 1632, box: [115, 1621, 470, 80]},
    massValue: {kind: "mass", x: 608, y: 1633, box: [596, 1621, 432, 80]},
  };
}

function clearPatch(output, clean, [left, top, width, height]) {
  assert.ok(left >= 0 && top >= 0 && left + width <= canvas.width && top + height <= canvas.height);
  for (let y = top; y < top + height; y++) {
    const start = (y * canvas.width + left) * 3;
    clean.copy(output, start, start, start + width * 3);
  }
}

function decoration(placement, left, top, width, height) {
  const [bx, by, bw, bh] = placement.box;
  const x = left - bx, y = top - by;
  let shape;
  if (placement.halo) {
    shape = `<defs><filter id="soft" filterUnits="userSpaceOnUse" x="0" y="0" width="${bw}" height="${bh}"><feGaussianBlur stdDeviation="7.5"/></filter></defs>
      <rect x="${x - 7}" y="${y - 7}" width="${width + 14}" height="${height + 14}" rx="4" fill="white" filter="url(#soft)"/>`;
  } else if (placement.line) {
    const axis = placement.axis - (placement.line === "horizontal" ? by : bx);
    const d = placement.line === "horizontal"
      ? `M0 ${axis}H${x - 10} M${x + width + 10} ${axis}H${bw}`
      : `M${axis} 0V${y - 10} M${axis} ${y + height + 10}V${bh}`;
    shape = `<path d="${d}" stroke="#59636f" stroke-width="4" fill="none"/>`;
  } else return undefined;
  return {input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${bw}" height="${bh}">${shape}</svg>`), left: bx, top: by};
}

async function render(product, template, series) {
  assert.match(product.id, /^[a-z\d-]+$/u);
  const illustration = {
    imageUrl: catalogMeasurementUrl(product),
    photoUrl: template.photoUrl, signature: productIllustrationSignature(product),
    ...(isDemonstrationProduct(product) ? {showForDemo: true} : {}),
  };
  const labels = productLabels(product, series);
  const placements = labelPlacements(template.layout, isDemonstrationProduct(product));
  const patches = [];
  const base = Buffer.from(template.markedPixels);
  const layers = [];
  for (const [key, value] of Object.entries(labels)) {
    if (value === template.labels[key]) continue;
    const placement = placements[key];
    const [bx, by, bw, bh] = placement.box;
    clearPatch(base, template.cleanPixels, placement.box);
    patches.push(placement.box);
    if (!value) continue;
    const {data, info} = await renderBeamLabel(placement.kind, value);
    let left = placement.x;
    if (placement.align === "center") left -= Math.round(info.width / 2);
    if (placement.align === "right") left -= info.width;
    // Align the lowercase x-height of the status with the footer caption's baseline.
    const top = value === "уточняются" ? placement.y + 8 : placement.y;
    assert.ok(left >= bx && top >= by && left + info.width <= bx + bw && top + info.height <= by + bh,
      `${product.id}: label outside ${key} patch: ${value}`);
    const graphics = decoration(placement, left, top, info.width, info.height);
    if (graphics) layers.push(graphics);
    layers.push({input: data, left, top});
  }
  const result = await sharp(base, {raw: canvas}).composite(layers).webp({lossless: true, effort: 4}).toBuffer();
  const decoded = await pixels(result);
  // Compare row spans outside every patch, including every pixel for the four supplied examples.
  for (let y = 0; y < canvas.height; y++) {
    const spans = patches.filter(([, t, , h]) => t <= y && y < t + h).sort((a, b) => a[0] - b[0]);
    let x = 0;
    const rowStart = y * canvas.width * 3;
    for (const [left, , width] of [...spans, [canvas.width, 0, 0, 0]]) {
      const start = rowStart + x * 3, end = rowStart + left * 3;
      assert.ok(decoded.subarray(start, end).equals(template.markedPixels.subarray(start, end)), `Unintended change in ${product.id}, row ${y}`);
      x = Math.max(x, left + width);
    }
  }
  const output = write ? `public${illustration.imageUrl}` : path.join(outputDirectory, `${product.id}.webp`);
  await fs.mkdir(path.dirname(output), {recursive: true});
  const temporary = output + `.${process.pid}.tmp`;
  await fs.writeFile(temporary, result);
  await fs.rename(temporary, output);
  return {id: product.id, profile: beamProfile(product), reference: template.photoUrl, labels, illustration, output};
}

const records = [];
for (const [series, layout] of Object.entries(templates)) {
  const family = products.filter(product => beamSeries(product) === series);
  if (!family.length) continue;
  const template = await loadTemplate(layout);
  for (const product of family) {
    const record = await render(product, template, series);
    records.push(record);
    console.log(`${record.profile} → ${record.output}`);
  }
}
assert.equal(records.length, products.length);
if (write) {
  const manifest = "data/product-illustrations.json";
  const entries = JSON.parse(await fs.readFile(manifest, "utf8"));
  for (const record of records) entries[record.id] = record.illustration;
  const temporary = manifest + `.${process.pid}.tmp`;
  await fs.writeFile(temporary, JSON.stringify(entries, null, 2) + "\n");
  await fs.rename(temporary, manifest);
}
await fs.writeFile(path.join(outputDirectory, "last-run.json"), JSON.stringify(records, null, 2) + "\n");
