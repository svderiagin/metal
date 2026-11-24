import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';
import {renderBeamLabel} from '../imports/beam-image-template/labels.mjs';
import {readProjectData} from './project-data.mjs';
import {catalogMeasurementUrl} from './catalog-measurement-path.mjs';

process.chdir(fileURLToPath(new URL('..', import.meta.url)));
const galvanized = process.argv.includes('--galvanized');
const args = process.argv.slice(2).filter(arg => arg !== '--galvanized');
const write = args.length === 1 && args[0] === '--write';
const preview = args.length === 2 && args[0] === '--preview';
assert.ok(write || preview, 'Use [--galvanized] --write or [--galvanized] --preview PRODUCT_ID');

const canvas = {width: 2400, height: 1800, channels: 3};
const familyDirectory = '/images/catalog/truba-kruglaya/truba-vodogazoprovodnaya' + (galvanized ? '-otsinkovannaya' : '');
const template = `${familyDirectory}/originals/truba_vgp${galvanized ? '_ocinkovannaya' : ''}_2400_1800_`;
const photoUrl = template + 'original.jpg';
async function readPixels(url) {
  const {data, info} = await sharp('public' + url).removeAlpha().raw().toBuffer({resolveWithObject: true});
  for (const key of Object.keys(canvas)) assert.equal(info[key], canvas[key], url);
  return data;
}
const [marked, clean] = await Promise.all([readPixels(template + 'marked.jpg'), readPixels(photoUrl)]);
const cache = new Map();
const {productVariants} = readProjectData('data/products/index.ts', cache);
const {isVgpVariant} = readProjectData('lib/vgp.ts', cache);
const {formatMassPerMeter} = readProjectData('lib/numberFormat.ts', cache);
const {productIllustrationSignature} = readProjectData('lib/productPreviewImage.ts', cache);
const galvanizedReference = JSON.parse(await fs.readFile('data/vgp-galvanized-specifications.json', 'utf8'));
const subcategoryId = galvanized ? 'cat-trk-sub-3' : 'cat-trk-sub-1';
const products = productVariants.filter(p => isVgpVariant(p) && p.subcategoryId === subcategoryId
  && p.id !== galvanizedReference.id && (write || p.id === args[1]));
assert.ok(products.length, 'No matching VGP product');
const number = new Intl.NumberFormat('ru-RU');

// Coordinates enclose only variable text. The title prefix, wall unit, arrows,
// captions and the photograph remain the actual pixels from the marked template.
const fields = {
  title: galvanized
    ? {style: 'title', original: 'Ду25 x 2,8', box: [120,218,580,105], left: 133, top: 234}
    : {style: 'title', original: '15 x 2,8', box: [704,112,440,105], left: 707, top: 126},
  wall: {style: 'dimension', original: '2,8', box: [755,680,102,68], right: 846, top: 689},
  length: {style: 'length', original: galvanized ? '7,8 м' : '6 м', box: [602,1558,170,51], left: 611, top: 1567},
  mass: {style: 'mass', original: galvanized ? '2,18 кг/м' : '1,28 кг/м', box: [602,1623,345,62], left: 611, top: 1633},
};

function restore(base, [left, top, width, height]) {
  for (let y = top; y < top + height; y++) {
    const start = (y * canvas.width + left) * 3;
    clean.copy(base, start, start, start + width * 3);
  }
}

function extendDiameterLine(base, start, end, sampleX) {
  for (let y = 1470; y <= 1474; y++) {
    const source = (y * canvas.width + sampleX) * 3;
    for (let x = start; x < end; x++) marked.copy(base, (y * canvas.width + x) * 3, source, source + 3);
  }
}

async function render(p) {
  const {nominalBoreMm: dn, diameterMm: od, wallThicknessMm: wall, lengthMeters: length, weightPerMeterKg: mass} = p;
  assert.ok([dn, od, wall, length, mass].every(n => Number.isFinite(n) && n > 0) && od > 2 * wall,
    `Missing or invalid dimensions, length or mass for ${p.id}`);
  const labels = {
    title: `${galvanized ? 'Ду' : ''}${number.format(dn)} x ${number.format(wall)}`,
    wall: number.format(wall),
    length: number.format(length) + ' м',
    mass: (galvanized ? formatMassPerMeter(mass) : number.format(mass)) + ' кг/м',
  };
  const base = Buffer.from(marked);
  const layers = [];
  for (const [name, field] of Object.entries(fields)) {
    if (labels[name] === field.original) continue;
    const {data, info} = await renderBeamLabel(field.style, labels[name]);
    const left = field.left ?? field.right - info.width;
    const [x, y, w, h] = field.box;
    assert.ok(left >= x && left + info.width <= x + w && field.top >= y && field.top + info.height <= y + h,
      `${p.id}: ${name} exceeds the template`);
    restore(base, field.box);
    layers.push({input: data, left, top: field.top});
  }

  // Replace the outside diameter within the original arrow line.
  if (!galvanized || od !== galvanizedReference.diameterMm) {
    const diameter = await renderBeamLabel('dimension', 'Ø ' + number.format(od) + ' мм');
    const center = galvanized ? 1335 : 1337;
    const padding = galvanized ? 8 : 10;
    const left = Math.round(center - diameter.info.width / 2);
    const gapLeft = left - padding, gapRight = left + diameter.info.width + padding;
    assert.ok(gapLeft < 1250 && gapRight > 1422 && gapLeft > 1060 && gapRight < 1610,
      `${p.id}: diameter label must cover the old inscription and clear both arrowheads`);
    const clearLeft = galvanized ? Math.min(gapLeft, 1192) : gapLeft;
    const clearRight = galvanized ? Math.max(gapRight, 1477) : gapRight;
    restore(base, [clearLeft, 1435, clearRight - clearLeft, 80]);
    if (galvanized) {
      extendDiameterLine(base, clearLeft, gapLeft, 1175);
      extendDiameterLine(base, gapRight, clearRight, 1495);
    }
    layers.push({input: diameter.data, left, top: galvanized ? 1447 : 1453});
  }
  return sharp(base, {raw: canvas}).composite(layers).webp({lossless: true, effort: 4}).toBuffer();
}

const directory = write ? `public${familyDirectory}/measurement` : '.tmp/vgp-image-render';
await fs.mkdir(directory, {recursive: true});
async function replaceFile(file, data) {
  const temporary = file + `.${process.pid}.tmp`;
  await fs.writeFile(temporary, data);
  await fs.rename(temporary, file);
}

const results = [];
for (const product of products) results.push({product, image: await render(product)});
for (const {product, image} of results) {
  const output = write ? `public${catalogMeasurementUrl(product)}` : path.join(directory, product.id + '.webp');
  await replaceFile(output, image);
  console.log(product.name, output);
}
if (write) {
  const manifestPath = 'data/product-illustrations.json';
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
  for (const {product} of results) {
    manifest[product.id] = {
      imageUrl: catalogMeasurementUrl(product),
      photoUrl, signature: productIllustrationSignature(product),
    };
  }
  await replaceFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
}
