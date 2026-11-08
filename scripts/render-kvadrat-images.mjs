import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {readProjectData} from './project-data.mjs';
import {numberSignRemovalTargets, removeImageNumberSign} from './image-number-sign.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(root);
const directory = 'imports/kvadrat-image-template';
const temporaryDirectory = path.join(root, '.tmp/kvadrat-image-render');
await fs.mkdir(temporaryDirectory, {recursive: true});
const fontConfiguration = path.join(temporaryDirectory, 'fonts.conf');
await fs.writeFile(fontConfiguration, `<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "urn:fontconfig:fonts.dtd"><fontconfig><dir>${path.join(root, 'imports/shveller-image-template/fonts')}</dir><cachedir>${temporaryDirectory}/font-cache</cachedir></fontconfig>`);
process.env.FONTCONFIG_FILE = fontConfiguration;
// On macOS, Core Text ignores this isolated font directory and can substitute
// a system face. Fontconfig applies the bundled Inter's actual weight axis.
process.env.PANGOCAIRO_BACKEND = 'fontconfig';
const {default: sharp} = await import('sharp');

const WIDTH = 2400, HEIGHT = 1800;
const referencePath = `${directory}/reference-8x8.jpg`;
const photoPath = `${directory}/photo.jpg`;
const reference = await fs.readFile(referencePath);
const photo = await fs.readFile(photoPath);
for (const input of [reference, photo]) {
  const metadata = await sharp(input).metadata();
  assert.equal(metadata.width, WIDTH);
  assert.equal(metadata.height, HEIGHT);
}
const referencePixels = await sharp(reference).removeAlpha().raw().toBuffer();
const fontPath = 'imports/shveller-image-template/fonts/Inter-variable.ttf';
const svg = body => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}">${body}</svg>`);
const xml = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

// Only variable text regions are replaced with crops from the owner's clean original.
// Product pixels, cut face, edges, shadows and unchanged annotation pixels stay in place.
const patches = {
  title: {left: 110, top: 105, width: 1350, height: 120},
  height: {left: 920, top: 920, width: 210, height: 85},
  width: {left: 1260, top: 1358, width: 290, height: 78},
  length: {left: 590, top: 1550, width: 460, height: 70},
  mass: {left: 590, top: 1620, width: 500, height: 75},
};
const referenceLabels = {
  title: 'Квадрат стальной № 8x8', height: '8\u00a0мм', width: '8\u00a0мм', length: '6\u00a0м', mass: '0,5\u00a0кг/м',
};
const patchLayers = {};
for (const [key, box] of Object.entries(patches)) patchLayers[key] = {
  input: await sharp(photo).extract(box).png().toBuffer(), left: box.left, top: box.top,
};
async function textImage(text, size, weight = 400) {
  return sharp({text: {text: `<span foreground="#41464D" weight="${weight}">${xml(text)}</span>`,
    font: `Inter ${size}`, fontfile: fontPath, dpi: 72, rgba: true}}).png().toBuffer({resolveWithObject: true});
}

const products = readProjectData('data/products/index.ts').productVariants.filter(p => p.categoryId === 'rozmet-cat-kvadrat');
const {getSquareProductParameters} = readProjectData('lib/squarePresentation.ts');
assert.equal(products.length, 7, 'Review the collection before changing its image set');
const write = process.argv.includes('--write');
const previewIndex = process.argv.indexOf('--preview');
const previewSide = previewIndex >= 0 ? process.argv[previewIndex + 1] : undefined;
assert.ok(!(write && previewIndex >= 0), 'Use --write or --preview SIDE');
assert.ok(previewIndex < 0 || previewSide, '--preview requires a side such as 20');
const outputDirectory = write ? 'public/images/catalog/kvadrat' : 'output/image-edits/kvadrat-catalog-preview';
await fs.mkdir(outputDirectory, {recursive: true});
const records = [];
for (const product of products) {
  const parameters = getSquareProductParameters(product);
  assert.ok(parameters, `${product.id}: missing square section, length or mass`);
  if (previewSide && parameters.side !== previewSide) continue;
  const labels = [
    {key: 'title', text: `Квадрат стальной № ${parameters.profile}`, size: 84, weight: 700, left: 132, top: 127},
    {key: 'height', text: parameters.dimension, size: 56, center: 1037, top: 942},
    {key: 'width', text: parameters.dimension, size: 56, center: 1390, top: 1374},
    {key: 'length', text: parameters.length, size: 40, weight: 700, left: 610, top: 1568},
    {key: 'mass', text: parameters.mass, size: 44, weight: 750, left: 610, top: 1634},
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
      assert.ok(left >= box.left && left + rendered.info.width <= box.left + box.width, `${product.id}: clipped label`);
      assert.ok(label.top + rendered.info.height <= box.top + box.height, `${product.id}: clipped label height`);
      if (label.key === 'height') lines.push(`<path d="M1037 ${box.top}V${label.top - 10} M1037 ${label.top + rendered.info.height + 10}V${box.top + box.height}"/>`);
      if (label.key === 'width') lines.push(`<path d="M${box.left} 1394.5H${left - 10} M${left + rendered.info.width + 10} 1394.5H${box.left + box.width}"/>`);
      layers.push({input: rendered.data, left, top: label.top});
      placements.push({...label, left, width: rendered.info.width, height: rendered.info.height});
    }
    renderedReference = await sharp(clean).composite([
      {input: svg(`<g stroke="#59636F" stroke-width="4" fill="none">${lines.join('')}</g>`), left: 0, top: 0},
      ...layers,
    ]).png().toBuffer();
  }
  const image = await removeImageNumberSign(sharp, await sharp(renderedReference).webp({lossless: true, effort: 6}).toBuffer(), product.id);
  const mask = Buffer.alloc(WIDTH * HEIGHT);
  for (const {key} of changed) {
    const box = patches[key];
    for (let y = box.top; y < box.top + box.height; y++) mask.fill(1, y * WIDTH + box.left, y * WIDTH + box.left + box.width);
  }
  const renderedPixels = await sharp(image).removeAlpha().raw().toBuffer();
  const correction = numberSignRemovalTargets.find(({id}) => id === product.id);
  if (correction) {
    const box = correction.box;
    for (let y=box.top;y<box.top+box.height;y++) mask.fill(1,y*WIDTH+box.left,y*WIDTH+box.left+box.width);
  }
  let protectedPixelChanges = 0;
  for (let p = 0; p < mask.length; p++) if (!mask[p] && (referencePixels[p * 3] !== renderedPixels[p * 3] || referencePixels[p * 3 + 1] !== renderedPixels[p * 3 + 1] || referencePixels[p * 3 + 2] !== renderedPixels[p * 3 + 2])) protectedPixelChanges++;
  assert.equal(protectedPixelChanges, 0, `${product.id}: pixels changed outside variable-label regions`);
  const filename = `kvadrat-${parameters.profile}-clean.webp`;
  const output = `${outputDirectory}/${filename}`;
  await fs.writeFile(output, image);
  records.push({id: product.id, sourceUrl: product.sourceReference, profile: parameters.profile,
    imageUrl: `/images/catalog/kvadrat/${filename}`, labels: labels.map(({key, text}) => ({key, text: key==='title'?text.replace(/№\s*/gu,''):text})),
    ...(correction?{headingCorrection:{removed:'№',box:correction.box,shiftLeft:correction.shiftLeft}}:{}),
    changedLabels: changed.map(label => label.key), referenceUnmodified: changed.length === 0 && !correction, placements,
    protectedPixelChanges, output, width: WIDTH, height: HEIGHT, sha256: createHash('sha256').update(image).digest('hex')});
  console.log(`${parameters.profile}: ${output}; protectedPixelChanges=${protectedPixelChanges}`);
}
assert.ok(records.length, 'Unknown preview side');
if (write) {
  assert.equal(records.length, 7);
  await fs.writeFile(`${directory}/rendered.json`, JSON.stringify({renderer: 'scripts/render-kvadrat-images.mjs',
    reference: referencePath, cleanPhoto: photoPath,
    typography: {family: 'Inter', fontFile: fontPath, backend: 'fontconfig', mass: {size: 44, weight: 750}},
    suppliedSources: ['public/images/catalog/kvadrat/kvadrat_2400_1800_marked.jpg', 'public/images/catalog/kvadrat/kvadrat_2400_1800_original.jpg'],
    patches, method: 'Original reference pixels; clean owner-supplied photograph patches and deterministic Inter labels from public product parameters; no generative editing.',
    illustration: 'Shared family photograph; nominal labels are not scaled manufacturing geometry.', records}, null, 2) + '\n');
  await fs.writeFile('data/square-images.json', JSON.stringify({products: Object.fromEntries(records.map(({id, sourceUrl, imageUrl}) => [id, {sourceUrl, imageUrl}]))}, null, 2) + '\n');
}
