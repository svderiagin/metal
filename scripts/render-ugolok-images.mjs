import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {readProjectData} from './project-data.mjs';
import {numberSignRemovalTargets, removeImageNumberSign} from './image-number-sign.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(root);
const directory = 'imports/ugolok-image-template';
const temporaryDirectory = path.join(root, '.tmp/ugolok-image-render');
await fs.mkdir(temporaryDirectory, {recursive: true});
const fontConfiguration = path.join(temporaryDirectory, 'fonts.conf');
await fs.writeFile(fontConfiguration, `<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "urn:fontconfig:fonts.dtd"><fontconfig><dir>${path.join(root, 'imports/shveller-image-template/fonts')}</dir><cachedir>${temporaryDirectory}/font-cache</cachedir></fontconfig>`);
process.env.FONTCONFIG_FILE = fontConfiguration;
process.env.PANGOCAIRO_BACKEND = 'fontconfig';
const {default: sharp} = await import('sharp');

const WIDTH = 2400, HEIGHT = 1800;
const referencePath = `${directory}/reference-25x25x3.jpg`;
const reference = await fs.readFile(referencePath);
const metadata = await sharp(reference).metadata();
assert.equal(metadata.width, WIDTH);
assert.equal(metadata.height, HEIGHT);
const referencePixels = await sharp(reference).removeAlpha().raw().toBuffer();
const fontPath = 'imports/shveller-image-template/fonts/Inter-variable.ttf';
const svg = body => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}">${body}</svg>`);
const xml = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

// All rectangles are on the light background, clear of the product and its edges.
// The generated plate supplies background only; the photograph always comes from the reference.
const patches = {
  title: {left: 110, top: 100, width: 1260, height: 120},
  firstLeg: {left: 700, top: 840, width: 232, height: 88},
  secondLeg: {left: 1175, top: 1438, width: 370, height: 76},
  thickness: {left: 1920, top: 1324, width: 290, height: 84},
  length: {left: 590, top: 1550, width: 420, height: 67},
  mass: {left: 590, top: 1620, width: 500, height: 70},
};
const referenceLabels = {
  title: 'Угол стальной № 25x25x3', firstLeg: '25\u00a0мм', secondLeg: '25\u00a0мм',
  thickness: '3\u00a0мм', length: '6\u00a0м', mass: '0,5\u00a0кг/м.п.',
};
const plate = await sharp(`${directory}/clean-background-generated.png`).resize(WIDTH, HEIGHT).removeAlpha().raw().toBuffer();
const patchLayers = {};
for (const [key, box] of Object.entries(patches)) {
  const pixels = Buffer.alloc(box.width * box.height * 4);
  for (let y = 0; y < box.height; y++) for (let x = 0; x < box.width; x++) {
    const source = ((box.top + y) * WIDTH + box.left + x) * 3;
    const target = (y * box.width + x) * 4;
    plate.copy(pixels, target, source, source + 3);
    pixels[target + 3] = Math.round(255 * Math.min(1, x / 12, y / 12, (box.width - 1 - x) / 12, (box.height - 1 - y) / 12));
  }
  patchLayers[key] = {input: await sharp(pixels, {raw: {width: box.width, height: box.height, channels: 4}}).png().toBuffer(), left: box.left, top: box.top};
}

async function textImage(text, size, weight = 400) {
  return sharp({text: {text: `<span foreground="#41464D" weight="${weight}">${xml(text)}</span>`,
    font: `Inter ${size}`, fontfile: fontPath, dpi: 72, rgba: true}}).png().toBuffer({resolveWithObject: true});
}

const products = readProjectData('data/products/index.ts').productVariants.filter(p => p.categoryId === 'rozmet-cat-ugolok');
const {formatAngleSpecificationValue: normalize} = readProjectData('lib/anglePresentation.ts');
assert.equal(products.length, 22, 'Review the collection before changing its image set');
const write = process.argv.includes('--write');
const previewIndex = process.argv.indexOf('--preview');
const previewProfile = previewIndex >= 0 ? process.argv[previewIndex + 1] : undefined;
assert.ok(!(write && previewIndex >= 0), 'Use --write or --preview PROFILE');
assert.ok(previewIndex < 0 || previewProfile, '--preview requires dimensions such as 160x100x10');
const outputDirectory = write ? 'public/images/catalog/ugolok' : '.tmp/catalog-image-qa/ugolok-preview';
await fs.mkdir(outputDirectory, {recursive: true});
const records = [];
for (const product of products) {
  const specification = name => {
    const entries = product.specifications.filter(s => s.name === name);
    assert.equal(entries.length, 1, `${product.id}: missing or ambiguous ${name}`);
    return entries[0].value;
  };
  const legs = specification('Размеры уголка').match(/^(\d+)[хx×](\d+)$/u);
  const thickness = specification('Толщина полок уголка').match(/^(\d+(?:[.,]\d+)?)\s*мм$/u)?.[1];
  assert.ok(legs && thickness, product.id);
  const profile = `${legs[1]}x${legs[2]}x${thickness}`;
  assert.ok(product.name.replaceAll('х', 'x').includes(profile), `${product.id}: dimensions disagree with title`);
  if (previewProfile && profile !== previewProfile) continue;
  const labels = [
    {key: 'title', text: `Угол стальной № ${profile}`, size: 84, weight: 700, left: 132, top: 125},
    {key: 'firstLeg', text: `${legs[1]}\u00a0мм`, size: 56, center: 837, top: 862},
    {key: 'secondLeg', text: `${legs[2]}\u00a0мм`, size: 56, center: 1348, top: 1454},
    {key: 'thickness', text: `${thickness}\u00a0мм`, size: 56, left: 1940, top: 1342},
    {key: 'length', text: normalize(specification('Размер')), size: 44, weight: 750, left: 610, top: 1568},
    {key: 'mass', text: normalize(specification('Теоретическая масса')), size: 44, weight: 750, left: 610, top: 1634},
  ];
  const changed = labels.filter(label => label.text !== referenceLabels[label.key]);
  const clean = await sharp(reference).composite(changed.map(label => patchLayers[label.key])).png().toBuffer();
  const layers = [], lines = [], placements = [];
  for (const label of changed) {
    const box = patches[label.key];
    let size = label.size;
    let rendered = await textImage(label.text, size, label.weight);
    while (rendered.info.width > box.width - 36) rendered = await textImage(label.text, --size, label.weight);
    let left = label.center === undefined ? label.left : Math.round(label.center - rendered.info.width / 2);
    left = Math.min(left, box.left + box.width - rendered.info.width - 10);
    assert.ok(left >= box.left && left + rendered.info.width <= box.left + box.width, `${product.id}: clipped label`);
    assert.ok(label.top + rendered.info.height <= box.top + box.height, `${product.id}: clipped label height`);
    if (label.key === 'firstLeg') {
      lines.push(`<path d="M837 ${box.top}V${label.top - 10} M837 ${label.top + rendered.info.height + 10}V${box.top + box.height}"/>`);
    }
    if (label.key === 'secondLeg') {
      lines.push(`<path d="M${box.left} 1476H${left - 10} M${left + rendered.info.width + 10} 1476H${box.left + box.width}"/>`);
    }
    layers.push({input: rendered.data, left, top: label.top});
    placements.push({...label, size, left, width: rendered.info.width, height: rendered.info.height});
  }
  const uncorrectedImage = await sharp(clean).composite([
    {input: svg(`<g stroke="#59636F" stroke-width="4" fill="none">${lines.join('')}</g>`), left: 0, top: 0},
    ...layers,
  ]).webp({lossless: true, effort: 6}).toBuffer();
  const image = await removeImageNumberSign(sharp, uncorrectedImage, product.id);
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
  const filename = `ugolok-${profile}-clean.webp`;
  const output = `${outputDirectory}/${filename}`;
  await fs.writeFile(output, image);
  records.push({id: product.id, sourceUrl: product.sourceReference, profile, imageUrl: `/images/catalog/ugolok/${filename}`,
    labels: labels.map(({key, text}) => ({key, text: key==='title'?text.replace(/№\s*/gu,''):text})), changedLabels: changed.map(label => label.key), placements,
    ...(correction?{headingCorrection:{removed:'№',box:correction.box,shiftLeft:correction.shiftLeft}}:{}),
    protectedPixelChanges, output, width: WIDTH, height: HEIGHT, sha256: createHash('sha256').update(image).digest('hex')});
  console.log(`${profile}: ${output}; protectedPixelChanges=${protectedPixelChanges}`);
}
assert.ok(records.length, 'Unknown preview profile');
if (write) {
  assert.equal(records.length, 22);
  await fs.writeFile(`${directory}/rendered.json`, JSON.stringify({renderer: 'scripts/render-ugolok-images.mjs', reference: referencePath,
    typography: {family: 'Inter', fontFile: fontPath, backend: 'fontconfig', values: {size: 44, weight: 750}},
    backgroundPlate: `${directory}/clean-background-generated.png`, patches,
    method: 'Original reference pixels; ImageGen background patches restricted to variable text; deterministic Inter labels from public product specifications.',
    illustration: 'Shared family photograph; labels show nominal dimensions, not scaled manufacturing geometry.', records}, null, 2) + '\n');
  await fs.writeFile('data/angle-images.json', JSON.stringify({products: Object.fromEntries(records.map(({id, sourceUrl, imageUrl}) => [id, {sourceUrl, imageUrl}]))}, null, 2) + '\n');
}
