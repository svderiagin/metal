import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {readProjectData} from './project-data.mjs';
import {numberSignRemovalTargets, removeImageNumberSign} from './image-number-sign.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(root);
const directory = 'imports/profile-square-image-template';
const temporaryDirectory = path.join(root, '.tmp/profile-square-image-render');
await fs.mkdir(temporaryDirectory, {recursive: true});
await fs.mkdir(path.join(temporaryDirectory, 'font-cache'), {recursive: true});
const fontPath = 'imports/shveller-image-template/fonts/Inter-variable.ttf';
const fontConfiguration = path.join(temporaryDirectory, 'fonts.conf');
await fs.writeFile(fontConfiguration, `<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "urn:fontconfig:fonts.dtd"><fontconfig><dir>${path.dirname(path.join(root, fontPath))}</dir><cachedir>${temporaryDirectory}/font-cache</cachedir></fontconfig>`);
process.env.FONTCONFIG_FILE = fontConfiguration;
process.env.PANGOCAIRO_BACKEND = 'fontconfig';
const {default: sharp} = await import('sharp');
sharp.concurrency(2);

const WIDTH = 2400, HEIGHT = 1800;
const sourceDirectory = 'public/images/catalog/truba-profilnia/truba_kvadratnaya';
const referencePath = `${sourceDirectory}/truba_kvadratnaya_2400_1800_marked.jpg`;
const photoPath = `${sourceDirectory}/truba_kvadratnaya_1448_1086_original.jpg`;
const reference = await fs.readFile(referencePath);
const original = await fs.readFile(photoPath);
const referenceMetadata = await sharp(reference).metadata();
const originalMetadata = await sharp(original).metadata();
assert.equal(referenceMetadata.width, WIDTH);
assert.equal(referenceMetadata.height, HEIGHT);
assert.equal(originalMetadata.width * HEIGHT, originalMetadata.height * WIDTH);
// Resize the clean photo only to obtain matching backgrounds for changed labels.
// Every other pixel comes directly from the owner's marked reference.
const photo = await sharp(original).resize(WIDTH, HEIGHT).png().toBuffer();
const referencePixels = await sharp(reference).removeAlpha().raw().toBuffer();
const svg = body => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}">${body}</svg>`);
const xml = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const number = value => String(value).replace('.', ',');
const unit = (value, suffix) => `${number(value)}\u00a0${suffix}`;

// Fixed heading, footer captions, arrows, cut face and reflection are untouched.
const patches = {
  title: {left: 735, top: 222, width: 765, height: 108},
  height: {left: 835, top: 1000, width: 240, height: 90},
  width: {left: 1210, top: 1456, width: 260, height: 80},
  thickness: {left: 1676, top: 1056, width: 300, height: 124},
  length: {left: 590, top: 1550, width: 460, height: 70},
  mass: {left: 590, top: 1620, width: 500, height: 75},
};
const referenceLabels = {
  title: '15 x 15 x 1,5', height: '15\u00a0мм', width: '15\u00a0мм',
  thickness: '1,5\u00a0мм', length: '6\u00a0м', mass: '0,605\u00a0кг/м',
};
const patchLayers = {};
for (const [key, box] of Object.entries(patches)) patchLayers[key] = {
  input: await sharp(photo).extract(box).png().toBuffer(), left: box.left, top: box.top,
};
async function textImage(text, size, weight = 400) {
  return sharp({text: {text: `<span foreground="#41464D" weight="${weight}" font_features="calt=0">${xml(text)}</span>`,
    font: `Inter ${size}`, fontfile: fontPath, dpi: 72, rgba: true}}).png().toBuffer({resolveWithObject: true});
}
async function thicknessHalo(text, box, left, top) {
  const metadata = await sharp(text).metadata();
  const halo = await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${box.width}" height="${box.height}"><rect x="${left - box.left - 8}" y="${top - box.top - 8}" width="${metadata.width + 16}" height="${metadata.height + 16}" rx="10" fill="white"/></svg>`))
    .blur(6).png().toBuffer();
  // Clip the halo to this same declared patch: protected pixels stay exact.
  return {input: await sharp(patchLayers.thickness.input).composite([
    {input: halo, left: 0, top: 0},
    {input: text, left: left - box.left, top: top - box.top},
  ]).png().toBuffer(), left: box.left, top: box.top};
}

const products = readProjectData('data/products/index.ts').productVariants.filter(p =>
  p.productTypeId === 'type-cat-trp-sub-1' && p.id.startsWith('profile-pipe-square-'));
const {productIllustrationSignature} = readProjectData('lib/productPreviewImage.ts');
assert.equal(products.length, 28, 'Review the collection before changing its image set');
const write = process.argv.includes('--write');
const previewIndex = process.argv.indexOf('--preview');
const previewId = previewIndex >= 0 ? process.argv[previewIndex + 1] : undefined;
assert.ok(write !== (previewIndex >= 0), 'Use --write or --preview PRODUCT_ID');
assert.ok(previewIndex < 0 || previewId, '--preview requires a product ID');
const outputDirectory = write ? 'public/images/catalog/product-illustrations' : 'output/image-edits/profile-square-catalog-preview';
await fs.mkdir(outputDirectory, {recursive: true});
const records = [];
for (const product of products) {
  if (previewId && product.id !== previewId) continue;
  const {profileWidthMm: width, profileHeightMm: height, wallThicknessMm: wall, weightPerMeterKg: mass} = product;
  assert.ok(width > 0 && width === height && wall > 0 && mass > 0 && product.weightConfirmed, `${product.id}: missing confirmed parameters`);
  const length = product.lengthMeters ? unit(product.lengthMeters, 'м')
    : product.lengthRangeMeters?.length === 2 ? `${product.lengthRangeMeters.map(number).join('–')}\u00a0м` : undefined;
  assert.ok(length, `${product.id}: missing catalog length`);
  const labels = [
    {key: 'title', text: `${number(width)} x ${number(height)} x ${number(wall)}`, size: 84, weight: 700, left: 749, top: 237},
    {key: 'height', text: unit(height, 'мм'), size: 56, center: 954, top: 1022},
    {key: 'width', text: unit(width, 'мм'), size: 56, center: 1338, top: 1478},
    {key: 'thickness', text: unit(wall, 'мм'), size: 56, left: 1692, top: 1084},
    {key: 'length', text: length, size: 44, weight: 700, left: 608, top: 1568},
    {key: 'mass', text: unit(mass, 'кг/м'), size: 44, weight: 750, left: 608, top: 1634},
  ];
  const changed = labels.filter(label => label.text !== referenceLabels[label.key]);
  const placements = [];
  let renderedReference = reference;
  if (changed.length) {
    const clean = await sharp(reference).composite(changed.map(label => patchLayers[label.key])).png().toBuffer();
    const layers = [], lines = [];
    for (const label of changed) {
      const box = patches[label.key];
      const rendered = await textImage(label.text, label.size, label.weight);
      const left = label.center === undefined ? label.left : Math.round(label.center - rendered.info.width / 2);
      assert.ok(left >= box.left && left + rendered.info.width <= box.left + box.width, `${product.id}: clipped ${label.key}`);
      assert.ok(label.top >= box.top && label.top + rendered.info.height <= box.top + box.height, `${product.id}: clipped label height`);
      if (label.key === 'height') lines.push(`<path d="M954 ${box.top}V${label.top - 10} M954 ${label.top + rendered.info.height + 10}V${box.top + box.height}"/>`);
      if (label.key === 'width') lines.push(`<path d="M${box.left} 1499.5H${left - 10} M${left + rendered.info.width + 10} 1499.5H${box.left + box.width}"/>`);
      layers.push(label.key === 'thickness' ? await thicknessHalo(rendered.data, box, left, label.top)
        : {input: rendered.data, left, top: label.top});
      placements.push({...label, left, width: rendered.info.width, height: rendered.info.height});
    }
    renderedReference = await sharp(clean).composite([
      {input: svg(`<g stroke="#59636F" stroke-width="4" fill="none">${lines.join('')}</g>`), left: 0, top: 0}, ...layers,
    ]).png().toBuffer();
  }
  const image = await removeImageNumberSign(sharp,
    await sharp(renderedReference).webp({lossless: true, effort: 6}).toBuffer(), product.id);
  const headingCorrection = numberSignRemovalTargets.find(({id}) => id === product.id);
  const mask = Buffer.alloc(WIDTH * HEIGHT);
  for (const {key} of changed) {
    const box = patches[key];
    for (let y = box.top; y < box.top + box.height; y++) mask.fill(1, y * WIDTH + box.left, y * WIDTH + box.left + box.width);
  }
  if (headingCorrection) {
    const box = headingCorrection.box;
    for (let y = box.top; y < box.top + box.height; y++) mask.fill(1, y * WIDTH + box.left, y * WIDTH + box.left + box.width);
  }
  const renderedPixels = await sharp(image).removeAlpha().raw().toBuffer();
  let protectedPixelChanges = 0;
  for (let p = 0; p < mask.length; p++) if (!mask[p] && (referencePixels[p * 3] !== renderedPixels[p * 3]
    || referencePixels[p * 3 + 1] !== renderedPixels[p * 3 + 1] || referencePixels[p * 3 + 2] !== renderedPixels[p * 3 + 2])) protectedPixelChanges++;
  assert.equal(protectedPixelChanges, 0, `${product.id}: pixels changed outside variable-label regions`);
  const filename = `${product.id}.webp`;
  const output = `${outputDirectory}/${filename}`;
  await fs.writeFile(output, image);
  records.push({id: product.id, imageUrl: `/images/catalog/product-illustrations/${filename}`,
    photoUrl: photoPath.replace(/^public/, ''), signature: productIllustrationSignature(product),
    labels: labels.map(({key, text}) => ({key, text})), changedLabels: changed.map(label => label.key),
    placements, protectedPixelChanges, output, width: WIDTH, height: HEIGHT,
    ...(headingCorrection ? {headingCorrection: {removed: '№', box: headingCorrection.box, shiftLeft: headingCorrection.shiftLeft}} : {}),
    sha256: createHash('sha256').update(image).digest('hex')});
  console.log(`${product.id}: ${output}; protectedPixelChanges=${protectedPixelChanges}`);
}
assert.ok(records.length, 'Unknown preview product');
if (write) {
  assert.equal(records.length, 28);
  await fs.mkdir(directory, {recursive: true});
  await fs.writeFile(`${directory}/rendered.json`, JSON.stringify({renderer: 'scripts/render-profile-square-images.mjs',
    reference: referencePath, cleanPhoto: photoPath,
    typography: {family: 'Inter', fontFile: fontPath, backend: 'fontconfig', text: '#41464D', lines: '#59636F'},
    patches, method: 'Owner marked reference; clean photograph patches and deterministic labels from confirmed public catalog parameters. Lossless WebP; no generative editing.',
    illustration: 'Shared family photograph. Nominal dimensions are labels, not scaled manufacturing geometry.', records}, null, 2) + '\n');
  const manifestPath = 'data/product-illustrations.json';
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
  for (const {id, imageUrl, photoUrl, signature} of records) manifest[id] = {imageUrl, photoUrl, signature};
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
}
