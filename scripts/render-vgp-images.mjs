import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';
import {renderBeamLabel} from '../imports/beam-image-template/labels.mjs';
import {readProjectData} from './project-data.mjs';

process.chdir(fileURLToPath(new URL('..', import.meta.url)));
const args = process.argv.slice(2);
const write = args.length === 1 && args[0] === '--write';
const preview = args.length === 2 && args[0] === '--preview';
assert.ok(write || preview, 'Use --write or --preview PRODUCT_ID');

const canvas = {width: 2400, height: 1800, channels: 3};
const template = '/images/catalog/truba-kruglaya/vgp/truba_vgp_2400_1800_';
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
const {productIllustrationSignature} = readProjectData('lib/productPreviewImage.ts', cache);
const products = productVariants.filter(p => isVgpVariant(p) && (write || p.id === args[1]));
assert.ok(products.length, 'No matching VGP product');
const number = new Intl.NumberFormat('ru-RU');

// Coordinates enclose only variable text. The title prefix, wall unit, arrows,
// captions and the photograph remain the actual pixels from the marked template.
const fields = {
  title: {style: 'title', original: '15 x 2,8', box: [704,112,440,105], left: 707, top: 126},
  wall: {style: 'dimension', original: '2,8', box: [755,680,102,68], right: 846, top: 689},
  length: {style: 'length', original: '6 м', box: [602,1558,170,51], left: 611, top: 1567},
  mass: {style: 'mass', original: '1,28 кг/м', box: [602,1623,345,62], left: 611, top: 1633},
};

function restore(base, [left, top, width, height]) {
  for (let y = top; y < top + height; y++) {
    const start = (y * canvas.width + left) * 3;
    clean.copy(base, start, start, start + width * 3);
  }
}

async function render(p) {
  const {nominalBoreMm: dn, diameterMm: od, wallThicknessMm: wall, lengthMeters: length, weightPerMeterKg: mass} = p;
  assert.ok([dn, od, wall, length, mass].every(n => Number.isFinite(n) && n > 0) && od > 2 * wall,
    `Missing or invalid dimensions, length or mass for ${p.id}`);
  const labels = {
    title: `${number.format(dn)} x ${number.format(wall)}`,
    wall: number.format(wall),
    length: number.format(length) + ' м',
    mass: number.format(mass) + ' кг/м',
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

  // The owner's Ду15 master says «50 мм» here. Use each SKU's outside
  // diameter, including Ду15. Open a gap in the existing line for the Ø label.
  const diameter = await renderBeamLabel('dimension', 'Ø ' + number.format(od) + ' мм');
  const center = 1337, padding = 10;
  const left = Math.round(center - diameter.info.width / 2);
  const gapLeft = left - padding, gapRight = left + diameter.info.width + padding;
  assert.ok(gapLeft < 1250 && gapRight > 1422 && gapLeft > 1060 && gapRight < 1610,
    `${p.id}: diameter label must cover the old inscription and clear both arrowheads`);
  restore(base, [gapLeft, 1435, gapRight - gapLeft, 80]);
  layers.push({input: diameter.data, left, top: 1453});
  return sharp(base, {raw: canvas}).composite(layers).webp({lossless: true, effort: 4}).toBuffer();
}

const directory = write ? 'public/images/catalog/product-illustrations' : '.tmp/vgp-image-render';
await fs.mkdir(directory, {recursive: true});
async function replaceFile(file, data) {
  const temporary = file + `.${process.pid}.tmp`;
  await fs.writeFile(temporary, data);
  await fs.rename(temporary, file);
}

const results = [];
for (const product of products) results.push({product, image: await render(product)});
for (const {product, image} of results) {
  const output = path.join(directory, product.id + '.webp');
  await replaceFile(output, image);
  console.log(product.name, output);
}
if (write) {
  const manifestPath = 'data/product-illustrations.json';
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
  for (const {product} of results) {
    manifest[product.id] = {
      imageUrl: `/images/catalog/product-illustrations/${product.id}.webp`,
      photoUrl, signature: productIllustrationSignature(product),
    };
  }
  await replaceFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
}
