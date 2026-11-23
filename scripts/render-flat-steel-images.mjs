import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';
import {renderBeamLabel} from '../imports/beam-image-template/labels.mjs';
import {readProjectData} from './project-data.mjs';
import {catalogMeasurementUrl} from './catalog-measurement-path.mjs';

process.chdir(fileURLToPath(new URL('..', import.meta.url)));
const args = process.argv.slice(2);
const write = args.length === 1 && args[0] === '--write';
assert.ok(write || (args.length === 2 && args[0] === '--preview'), 'Use --write or --preview PRODUCT_ID');

const cache = new Map();
const {productVariants} = readProjectData('data/products/index.ts', cache);
const {flatSteelCategoryId, flatSteelDimensions} = readProjectData('lib/flatSteel.ts', cache);
const {productIllustrationFacts} = readProjectData('lib/productIllustrationFacts.ts', cache);
const {productIllustrationSignature} = readProjectData('lib/productPreviewImage.ts', cache);
const products = productVariants.filter(p => p.categoryId === flatSteelCategoryId && (write || p.id === args[1]));
assert.ok(products.length, 'No matching steel strip');

const canvas = {width: 2400, height: 1800, channels: 3};
const photoUrl = '/images/catalog/polosa/originals/polosa_stalnaya_1448_1086_original.png';
const markedFile = 'public/images/catalog/polosa/originals/polosa_stalnaya_2400_1800_marked.jpg';
const marked = await sharp(markedFile).removeAlpha().raw().toBuffer({resolveWithObject: true});
for (const key of Object.keys(canvas)) assert.equal(marked.info[key], canvas[key], markedFile);
const clean = await sharp('public' + photoUrl).resize(canvas.width, canvas.height).removeAlpha().raw().toBuffer();
const number = new Intl.NumberFormat('ru-RU', {maximumFractionDigits: 2});

// Only the variable inscriptions change. Keep the prefix, vertical arrows, and
// «мм» to the right of the thickness as original pixels from the owner's JPG.
const fields = {
  title: {kind: 'title', original: '20 x 4', box: [846, 90, 600, 140], left: 865, top: 126},
  thickness: {kind: 'dimension', original: '4', box: [555, 996, 136, 68], right: 676, top: 1010},
  width: {kind: 'dimension', original: '20 мм', box: [1135, 1304, 330, 67], center: 1299, top: 1317},
  length: {kind: 'length', original: '6 м', box: [598, 1548, 270, 70], left: 611, top: 1567},
  mass: {kind: 'mass', original: '0,63 кг/м', box: [598, 1618, 265, 78], left: 611, top: 1634},
};

function labelsFor(product) {
  const section = flatSteelDimensions(product);
  assert.ok(section, product.name);
  const {width, thickness} = section;
  const length = productIllustrationFacts(product).find(fact => fact.name === 'Длина')?.value;
  assert.match(length ?? '', /^\d+(?:,\d+)?(?:\s*[-–]\s*\d+(?:,\d+)?)? м$/u, product.id);
  assert.ok(product.weightConfirmed && product.weightPerMeterKg > 0, `${product.id}: missing verified mass`);
  return {
    title: `${width} x ${thickness}`, thickness, width: width + ' мм',
    length: length.replace(/\s*[-–]\s*/u, '–'), mass: number.format(product.weightPerMeterKg) + ' кг/м',
  };
}

function restore(base, [left, top, width, height]) {
  for (let y = top; y < top + height; y++) {
    const start = (y * canvas.width + left) * 3;
    clean.copy(base, start, start, start + width * 3);
  }
}

async function labelHalo([x, y, width, height], left, top, textWidth, textHeight, title) {
  // Continue the title's soft backing under the fixed prefix at the left edge.
  const start = title ? -32 : left - x - 7;
  const end = left - x + textWidth + (title ? 13 : 7);
  const blur = title ? 8 : 5;
  const inset = title ? 10 : 7;
  // Render the blur beyond the patch before cropping so the fixed title
  // prefix and the new numbers share one continuous highlight.
  const pad = 32;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width + pad * 2}" height="${height}" viewBox="${-pad} 0 ${width + pad * 2} ${height}">
    <defs><filter id="soft" filterUnits="userSpaceOnUse" x="-60" y="-30" width="${width + 120}" height="${height + 60}"><feGaussianBlur stdDeviation="${blur}"/></filter></defs>
    <rect x="${start}" y="${top - y - inset}" width="${end - start}" height="${textHeight + 2 * inset}" rx="4" fill="white" filter="url(#soft)"/></svg>`;
  const input = await sharp(Buffer.from(svg)).extract({left: pad, top: 0, width, height}).png().toBuffer();
  return {input, left: x, top: y};
}

function restoreWidthLine(base, [x,,width], textLeft, textRight) {
  // Continue the stroke across the patch with the master's own antialiased
  // scanlines. Leave the same gap on each side of the new inscription.
  for (let y = 1335; y <= 1340; y++) {
    const row = y * canvas.width * 3;
    const sample = marked.data.subarray(row + 1120 * 3, row + 1120 * 3 + 3);
    base.fill(sample, row + x * 3, row + (textLeft - 9) * 3);
    base.fill(sample, row + (textRight + 9) * 3, row + (x + width) * 3);
  }
}

async function render(product) {
  const base = Buffer.from(marked.data);
  const layers = [];
  for (const [name, text] of Object.entries(labelsFor(product))) {
    const field = fields[name];
    if (text === field.original) continue;
    const {data, info} = await renderBeamLabel(field.kind, text);
    const left = field.left ?? (field.right ? field.right - info.width : field.center - Math.round(info.width / 2));
    const [x, y, width, height] = field.box;
    assert.ok(left >= x && left + info.width <= x + width && field.top >= y && field.top + info.height <= y + height,
      `${product.id}: ${name} exceeds the reference layout`);
    restore(base, field.box);
    if (name === 'width') restoreWidthLine(base, field.box, left, left + info.width);
    if (name === 'title' || name === 'length' || name === 'mass') {
      layers.push(await labelHalo(field.box, left, field.top, info.width, info.height, name === 'title'));
    }
    layers.push({input: data, left, top: field.top});
  }
  return sharp(base, {raw: canvas}).composite(layers).webp({lossless: true, effort: 4}).toBuffer();
}

async function replaceFile(file, data) {
  const temporary = file + `.${process.pid}.tmp`;
  await fs.writeFile(temporary, data);
  await fs.rename(temporary, file);
}

const artworkDirectory = '/images/catalog/polosa/measurement';
const directory = write ? `public${artworkDirectory}` : '.tmp/flat-steel-image-render';
await fs.mkdir(directory, {recursive: true});
const results = [];
for (const product of products) results.push({product, image: await render(product)});
for (const {product, image} of results) {
  const file = write ? `public${catalogMeasurementUrl(product)}` : path.join(directory, product.id + '.webp');
  await replaceFile(file, image);
  console.log(product.name, file);
}
if (write) {
  const file = 'data/product-illustrations.json';
  const manifest = JSON.parse(await fs.readFile(file, 'utf8'));
  for (const {product} of results) {
    manifest[product.id] = {
      imageUrl: catalogMeasurementUrl(product),
      photoUrl, signature: productIllustrationSignature(product),
    };
  }
  await replaceFile(file, JSON.stringify(manifest, null, 2) + '\n');
}
