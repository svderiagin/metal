import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';
import {renderBeamLabel} from '../imports/beam-image-template/labels.mjs';
import {readProjectData} from './project-data.mjs';

process.chdir(fileURLToPath(new URL('..', import.meta.url)));
const width = 2400, height = 1800;
const root = 'public/images/catalog/truba-kruglaya/';
const qa = '.tmp/electrowelded-original-qa';
const recordDirectory = 'imports/electrowelded-image-template';
const args = process.argv.slice(2);
const write = args.length === 1 && args[0] === '--write';
const preview = args.length === 2 && args[0] === '--preview';
assert.ok(write || preview, 'Use --write or --preview PRODUCT_ID');
await fs.mkdir(qa, {recursive: true});
await fs.mkdir(recordDirectory, {recursive: true});
const cache = new Map();
const {productVariants} = readProjectData('data/products/index.ts', cache);
const {isDemonstrationProduct} = readProjectData('lib/catalogOffer.ts', cache);
const {productIllustrationSignature} = readProjectData('lib/productPreviewImage.ts', cache);
const massReference = JSON.parse(await fs.readFile(`${recordDirectory}/mass-reference.json`, 'utf8'));
const number = new Intl.NumberFormat('ru-RU');
const familyTemplates = {
  plain: {
    family: 'elektrosvarnaya', reference: 'vgp',
    extension: {left: 1033, right: 1642, leftTop: 889, rightTop: 1180, y: 1475},
    outer: [[975, 718], [1043, 758]], inner: [[1146, 817], [1078, 778]],
  },
  galvanized: {
    family: 'elektrosvarnaya_ocinkovannaya', reference: 'vgp_ocinkovannaya',
    extension: {left: 1037, right: 1633, leftTop: 877, rightTop: 1180, y: 1472},
    outer: [[978, 718], [1047, 758]], inner: [[1158, 823], [1090, 785]],
  },
};
const products = productVariants.filter(product => ['cat-trk-sub-2', 'cat-trk-sub-4'].includes(product.subcategoryId)
  && (write || product.id === args[1]));
assert.ok(products.length, 'No matching electrowelded pipe');
const variants = products.map(product => {
  const galvanized = product.subcategoryId === 'cat-trk-sub-4';
  const template = galvanized ? familyTemplates.galvanized : familyTemplates.plain;
  const unverified = isDemonstrationProduct(product);
  if (unverified) return {...template, id: product.id, filename: `${product.id}.jpg`, unverified,
    title: [product.name], wallLabel: 's', diameterLabel: 'Ø D',
    captions: [['caption', 'Размеры и масса уточняются', 133, 1567]]};
  const diameterMm = product.diameterMm ?? catalogNumber(product, 'Диаметр, мм');
  const wallThicknessMm = product.wallThicknessMm ?? catalogNumber(product, 'Толщина, мм');
  assert.ok(diameterMm > 2 * wallThicknessMm && wallThicknessMm > 0, `${product.id}: incomplete section`);
  assert.match(product.standard, /10704/u, `${product.id}: expected assortment standard`);
  const section = `${diameterMm}x${wallThicknessMm}`;
  const weightPerMeterKg = massReference.massKgPerMeterBySection[section];
  assert.ok(weightPerMeterKg > 0, `${product.id}: no verified table mass for ${section}`);
  assert.equal(Math.round(0.0246615 * (diameterMm - wallThicknessMm) * wallThicknessMm * 100) / 100, weightPerMeterKg);
  if (product.weightPerMeterKg !== undefined) assert.equal(product.weightPerMeterKg, weightPerMeterKg);
  const lengthMeters = product.lengthMeters ?? catalogNumber(product, 'Длина, мм') / 1000;
  const range = product.name.match(/н\/д\s*\((\d+(?:[.,]\d+)?)\s*[-–]\s*(\d+(?:[.,]\d+)?)\s*м\)/iu);
  const lengthLabel = lengthMeters > 0 ? `${number.format(lengthMeters)} м`
    : range ? `${range[1].replace('.', ',')}–${range[2].replace('.', ',')} м` : undefined;
  assert.ok(lengthLabel, `${product.id}: no confirmed length`);
  const sectionLabel = `${number.format(diameterMm)} × ${number.format(wallThicknessMm)}`;
  return {...template, id: product.id, filename: `${product.id}.jpg`, unverified,
    title: galvanized ? ['Труба электросварная', `оцинкованная ${sectionLabel}`] : [`Труба электросварная ${sectionLabel}`],
    diameterMm, wallThicknessMm, lengthLabel, weightPerMeterKg,
    wallLabel: `${number.format(wallThicknessMm)} мм`, diameterLabel: `Ø ${number.format(diameterMm)} мм`,
    captions: [
      ['caption', 'Длина по каталогу', 133, 1567], ['length', lengthLabel, 611, 1567],
      ['caption', 'Теоретическая масса', 133, 1633], ['mass', `${weightPerMeterKg.toFixed(2).replace('.', ',')} кг/м`, 611, 1633],
      ...(galvanized ? [['caption', 'Без массы цинкового покрытия', 133, 1702]] : []),
    ]};
});

// Arrow tips and extension lines follow each owner's marked VGP reference.
// Only the transparent overlay is rasterized; the photograph is never resized,
// regenerated, sharpened or recolored. The requested final JPG uses quality 100
// and 4:4:4 sampling; preservation is checked before that lossy encoding step.
function arrow(start, tip) {
  const dx = tip[0] - start[0], dy = tip[1] - start[1], distance = Math.hypot(dx, dy);
  const ux = dx / distance, uy = dy / distance;
  const base = [tip[0] - ux * 23, tip[1] - uy * 23];
  const left = [base[0] - uy * 6.5, base[1] + ux * 6.5];
  const right = [base[0] + uy * 6.5, base[1] - ux * 6.5];
  return `<path d="M${start} L${base}" stroke-width="3.8" fill="none"/>
    <path d="M${tip} L${left} L${right} Z" stroke="none"/>`;
}

async function label(layers, style, text, left, top, align = 'left') {
  const rendered = await renderBeamLabel(style, text);
  if (align === 'right') left -= rendered.info.width;
  if (align === 'center') left = Math.round(left - rendered.info.width / 2);
  assert.ok(left >= 0 && top >= 0 && left + rendered.info.width <= width && top + rendered.info.height <= height, text);
  layers.push({input: rendered.data, left, top});
  return {left, top, width: rendered.info.width, height: rendered.info.height};
}

function catalogNumber(product, name) {
  return Number(product.specifications.find(field => field.name === name)?.value.replace(/\s/g, '').replace(',', '.'));
}

const results = [];
for (const variant of variants) {
  const product = productVariants.find(item => item.id === variant.id);
  assert.ok(product, variant.id);
  const source = root + `${variant.family}/truba_${variant.family}_2400_1800_original.jpg`;
  const referenceSource = root + `${variant.reference}/truba_${variant.reference}_2400_1800_original.jpg`;
  const originalFile = await fs.readFile(source);
  assert.ok(originalFile.equals(await fs.readFile(referenceSource)), 'Use the exact supplied original');
  const {data: original, info} = await sharp(originalFile).removeAlpha().raw().toBuffer({resolveWithObject: true});
  assert.equal(info.width, width);
  assert.equal(info.height, height);
  assert.equal(info.channels, 3);

  const layers = [];
  const boxes = {};
  for (const [index, text] of variant.title.entries()) boxes[`title${index}`] = await label(layers, 'title', text, 133, 126 + index * 107);
  boxes.wall = await label(layers, 'dimension', variant.wallLabel, 948, 689, 'right');
  const {extension: e} = variant;
  boxes.diameter = await label(layers, 'dimension', variant.diameterLabel, (e.left + e.right) / 2, 1453, 'center');
  for (const [index, caption] of variant.captions.entries()) boxes[`caption${index}`] = await label(layers, ...caption);

  const gapLeft = boxes.diameter.left - 10, gapRight = boxes.diameter.left + boxes.diameter.width + 10;
  const inner = arrow(...variant.inner);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <defs><filter id="glow" x="-50%" y="-100%" width="200%" height="300%"><feGaussianBlur stdDeviation="6"/></filter></defs>
    <g stroke="#59636f" fill="#59636f">
      <path d="M${e.left},${e.leftTop} V${e.y + 16} M${e.right},${e.rightTop} V${e.y + 16}" stroke-width="3.8" fill="none"/>
      ${arrow([gapLeft, e.y], [e.left, e.y])}
      ${arrow([gapRight, e.y], [e.right, e.y])}
      ${arrow(...variant.outer)}
    </g>
    <g stroke="white" fill="white" filter="url(#glow)">
      <path d="M${variant.inner[0]} L${variant.inner[1]}" stroke-width="18" stroke-linecap="round"/>
      ${inner}
    </g>
    <g stroke="#59636f" fill="#59636f">${inner}</g>
  </svg>`;
  layers.unshift({input: Buffer.from(svg), left: 0, top: 0});
  const overlay = await sharp({create: {width, height, channels: 4, background: {r: 0, g: 0, b: 0, alpha: 0}}}).composite(layers).png().toBuffer();
  const after = await sharp(original, {raw: {width, height, channels: 3}}).composite([{input: overlay}]).removeAlpha().raw().toBuffer();
  const mask = await sharp(overlay).ensureAlpha().raw().toBuffer();
  let changedOutsideAnnotations = 0, annotatedPixels = 0;
  for (let pixel = 0; pixel < width * height; pixel++) {
    if (mask[pixel * 4 + 3]) { annotatedPixels++; continue; }
    const offset = pixel * 3;
    if (original[offset] !== after[offset] || original[offset + 1] !== after[offset + 1] || original[offset + 2] !== after[offset + 2]) changedOutsideAnnotations++;
  }
  assert.equal(changedOutsideAnnotations, 0, 'Original photograph must be pixel-identical outside annotations');
  const output = await sharp(after, {raw: {width, height, channels: 3}}).jpeg({quality: 100, chromaSubsampling: '4:4:4'}).toBuffer();
  const outputPath = write ? root + `${variant.family}/${variant.filename}` : `${qa}/${variant.filename}`;
  await fs.writeFile(outputPath, output);
  await fs.writeFile(`${qa}/${variant.id}-annotations.png`, overlay);
  for (const [name, box] of Object.entries({title: {left: 115, top: 110, width: 1300, height: variant.title.length * 107}, wall: {left: 750, top: 670, width: 450, height: 190}, footer: {left: 115, top: 1550, width: 1000, height: 210}})) {
    await sharp(output).extract(box).png().toFile(`${qa}/${variant.id}-${name}.png`);
  }
  results.push({id: variant.id, source, output: outputPath, width, height, jpegQuality: 100, chromaSubsampling: '4:4:4', sourceSha256: createHash('sha256').update(originalFile).digest('hex'), title: variant.title, diameterMm: variant.diameterMm, wallThicknessMm: variant.wallThicknessMm, lengthLabel: variant.lengthLabel, weightPerMeterKg: variant.weightPerMeterKg, ...(variant.unverified ? {unverified: true, note: 'Размер по названию не подтверждает наружный диаметр; толщина и масса не заданы.'} : {massBasis: massReference.massBasis}), annotationBounds: boxes, annotatedPixels, changedOutsideAnnotationsBeforeJpegEncoding: changedOutsideAnnotations});
  console.log(`${variant.id}: ${outputPath}; changed pixels outside annotations before JPG encoding: ${changedOutsideAnnotations}`);
}
await fs.writeFile(`${write ? recordDirectory : qa}/rendered.json`, JSON.stringify({sourceUrl: massReference.sourceUrl, results}, null, 2) + '\n');
if (write) {
  const manifestPath = 'data/product-illustrations.json';
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
  for (const result of results) {
    const product = productVariants.find(item => item.id === result.id);
    manifest[result.id] = {imageUrl: result.output.replace(/^public/u, ''), photoUrl: result.source.replace(/^public/u, ''), signature: productIllustrationSignature(product), ...(result.unverified ? {showForDemo: true} : {})};
  }
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
}
