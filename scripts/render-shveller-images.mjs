import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {readProjectData} from './project-data.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(root);
const templateDirectory = 'imports/shveller-image-template';
const temporaryDirectory = path.join(root, '.tmp/shveller-image-render');
await fs.mkdir(temporaryDirectory, {recursive: true});
const fontConfiguration = path.join(temporaryDirectory, 'fonts.conf');
await fs.writeFile(fontConfiguration, `<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "urn:fontconfig:fonts.dtd"><fontconfig><dir>${path.join(root, templateDirectory, 'fonts')}</dir><cachedir>${temporaryDirectory}/font-cache</cachedir></fontconfig>`);
process.env.FONTCONFIG_FILE = fontConfiguration;
process.env.PANGOCAIRO_BACKEND = 'fontconfig';
const {default: sharp} = await import('sharp');

const WIDTH = 2400, HEIGHT = 1800;
const referencePath = `${templateDirectory}/reference-5.jpg`;
const photoPath = `${templateDirectory}/photo.png`;
const fontPath = `${templateDirectory}/fonts/Inter-variable.ttf`;
const reference = await fs.readFile(referencePath);
const photo = await fs.readFile(photoPath);
const referencePixels = await sharp(reference).removeAlpha().raw().toBuffer();
const products = readProjectData('data/products/index.ts').productVariants
  .filter(product => product.categoryId === 'rozmet-cat-shveller');
assert.equal(products.length, 14, 'Review the channel collection before changing its image set');
for (const input of [reference, photo]) {
  const metadata = await sharp(input).metadata();
  assert.equal(metadata.width, WIDTH);
  assert.equal(metadata.height, HEIGHT);
}

const write = process.argv.includes('--write');
const previewIndex = process.argv.indexOf('--preview');
const previewNumber = previewIndex >= 0 ? process.argv[previewIndex + 1]?.replace('.', ',') : undefined;
assert.ok(!(write && previewIndex >= 0), 'Use --write for the whole family or --preview for one profile');
assert.ok(previewIndex < 0 || previewNumber, '--preview requires a profile number');
const previewDirectory = '.tmp/catalog-image-qa/shveller-preview';
await fs.mkdir(previewDirectory, {recursive: true});

const xml = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const svg = body => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}">${body}</svg>`);
async function textImage(text, size, weight = 400) {
  return sharp({text: {
    text: `<span foreground="#41464D" weight="${weight}">${xml(text)}</span>`,
    font: `Inter ${size}`, fontfile: fontPath, dpi: 72, rgba: true,
  }}).png().toBuffer({resolveWithObject: true});
}

// Erase only the variable labels using the matching unannotated photograph.
// All other pixels (including the reflection and existing dimension arrows)
// are retained from the user-approved reference. No AI editing or inpainting.
const patches = {
  title: {left: 110, top: 105, width: 960, height: 120},
  flangeWidth: {left: 680, top: 876, width: 224, height: 58},
  webThickness: {left: 1160, top: 1227, width: 320, height: 83},
  flangeThickness: {left: 1964, top: 986, width: 370, height: 94},
  height: {left: 900, top: 1408, width: 980, height: 90},
  length: {left: 600, top: 1552, width: 470, height: 64},
  mass: {left: 600, top: 1621, width: 470, height: 65},
};
const referenceLabels = {
  title: 'Швеллер № 5', flangeWidth: '32 мм', webThickness: '4,4 мм',
  flangeThickness: '7 мм', height: '50 мм', length: '11,7 м', mass: '4,84 кг/м',
};
const patchLayers = Object.fromEntries(await Promise.all(Object.entries(patches).map(async ([key, rectangle]) => [key, {
  input: await sharp(photo).extract(rectangle).png().toBuffer(),
  left: rectangle.left, top: rectangle.top,
}])));

async function render(product) {
  const number = product.name.match(/№\s*(\d+(?:[.,]\d+)?)/u)?.[1].replace('.', ',');
  assert.ok(number, product.name);
  const expectedPath = `/images/catalog/shveller/shveller-${number.replace(',', '-')}-clean.webp`;
  assert.equal(product.imageUrls[0], expectedPath, 'Do not change product routing or image associations');
  const values = Object.fromEntries(['Высота', 'Ширина полки', 'Толщина стенки', 'Толщина полки', 'Длина по каталогу', 'Теоретическая масса'].map(name => {
    const entries = product.specifications.filter(item => item.name === name);
    assert.equal(entries.length, 1, `${product.id}: missing or ambiguous ${name}`);
    return [name, entries[0].value];
  }));
  let image = reference;
  const labels = [
    {key: 'title', text: `Швеллер № ${number}`, size: 84, weight: 700, left: 136, top: 127},
    {key: 'flangeWidth', text: values['Ширина полки'], size: 56, center: 814, top: 884},
    {key: 'webThickness', text: values['Толщина стенки'], size: 56, left: 1172, top: 1245},
    {key: 'flangeThickness', text: values['Толщина полки'], size: 56, left: 1980, top: 1010, halo: true},
    {key: 'height', text: values['Высота'], size: 56, center: 1390, top: 1431},
    {key: 'length', text: values['Длина по каталогу'], size: 44, weight: 750, left: 610, top: 1568},
    {key: 'mass', text: values['Теоретическая масса'], size: 44, weight: 750, left: 610, top: 1634},
  ];
  const placements = [];
  const changedLabels = labels.filter(label => label.text !== referenceLabels[label.key]);
  if (changedLabels.length) {
    const cleanReference = await sharp(reference).composite(changedLabels.map(label => patchLayers[label.key])).png().toBuffer();
    const layers = [];
    for (const label of changedLabels) {
      const rendered = await textImage(label.text, label.size, label.weight);
      let left = label.center === undefined ? label.left : Math.round(label.center - rendered.info.width / 2);
      // Longer flange-width values must not run into the metal's front edge.
      if (label.key === 'flangeWidth') left = Math.min(left, 896 - rendered.info.width);
      assert.ok(left >= 0 && left + rendered.info.width <= WIDTH, `${product.id}: ${label.key} is clipped`);
      const box = patches[label.key];
      assert.ok(left >= box.left && left + rendered.info.width <= box.left + box.width, `${product.id}: label exceeds its patch`);
      assert.ok(label.top >= box.top && label.top + rendered.info.height <= box.top + box.height, `${product.id}: label height exceeds its patch`);
      placements.push({...label, left, width: rendered.info.width, height: rendered.info.height});
      if (label.halo) {
        const halo = svg(`<defs><filter id="label-background" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="5"/></filter><clipPath id="label-area"><rect x="${box.left}" y="${box.top}" width="${box.width}" height="${box.height}"/></clipPath></defs><g clip-path="url(#label-area)"><rect x="${left - 7}" y="${label.top - 7}" width="${rendered.info.width + 14}" height="${rendered.info.height + 14}" rx="5" fill="#FFFFFF" filter="url(#label-background)"/></g>`);
        layers.push({input: halo, left: 0, top: 0});
      }
      layers.push({input: rendered.data, left, top: label.top});
    }
    const overall = placements.find(label => label.key === 'height');
    // Restore the overall-dimension segment erased with its old numeric label.
    const gapLeft = overall ? overall.left - 10 : 0;
    const gapRight = overall ? overall.left + overall.width + 10 : 0;
    const lines = overall ? [{input: svg(`<g stroke="#59636F" stroke-width="4" fill="none">
      <path d="M920 1408V1467 M1860 1408V1467 M920 1451H${gapLeft} M${gapRight} 1451H1860"/>
      </g><g fill="#59636F"><path d="M920 1451l24 -4v8z M1860 1451l-24 -4v8z"/></g>`), left: 0, top: 0}] : [];
    image = await sharp(cleanReference).composite([...lines, ...layers]).png().toBuffer();
  }
  const output = write ? `public${expectedPath}` : `${previewDirectory}/shveller-${number.replace(',', '-')}.webp`;
  // Lossless source assets preserve the photograph; next/image delivers smaller variants.
  const result = await sharp(image).webp({lossless: true, effort: 6}).toBuffer();
  const mask = Buffer.alloc(WIDTH * HEIGHT);
  for (const {key} of changedLabels) {
    const box = patches[key];
    for (let y = box.top; y < box.top + box.height; y++) mask.fill(1, y * WIDTH + box.left, y * WIDTH + box.left + box.width);
  }
  const renderedPixels = await sharp(result).removeAlpha().raw().toBuffer();
  let protectedPixelChanges = 0;
  for (let p = 0; p < mask.length; p++) if (!mask[p] && (referencePixels[p * 3] !== renderedPixels[p * 3] || referencePixels[p * 3 + 1] !== renderedPixels[p * 3 + 1] || referencePixels[p * 3 + 2] !== renderedPixels[p * 3 + 2])) protectedPixelChanges++;
  assert.equal(protectedPixelChanges, 0, `${product.id}: pixels changed outside variable-label regions`);
  await fs.writeFile(output, result);
  return {id: product.id, number, imageUrl: expectedPath, values, labels: labels.map(({key, text}) => ({key, text})),
    sourceReference: referencePath, referenceUnmodified: changedLabels.length === 0,
    changedLabels: changedLabels.map(label => label.key), placements, protectedPixelChanges, output, width: WIDTH, height: HEIGHT,
    format: 'lossless WebP', bytes: result.length, sha256: createHash('sha256').update(result).digest('hex')};
}

const selected = previewNumber ? products.filter(product => product.name.match(/№\s*(\d+(?:[.,]\d+)?)/u)?.[1].replace('.', ',') === previewNumber) : products;
assert.ok(selected.length, 'Unknown preview profile');
const records = [];
for (const product of selected) {
  const record = await render(product);
  records.push(record);
  console.log(`${record.number}: ${record.width}x${record.height}; ${Math.round(record.bytes / 1024)} KiB; ${record.output}`);
}
if (write) {
  assert.equal(records.length, 14, '--write must update the whole reviewed family');
  await fs.writeFile('imports/shveller-image-template/rendered.json', JSON.stringify({
    renderer: 'scripts/render-shveller-images.mjs', reference: referencePath, cleanPhoto: photoPath,
    typography: {family: 'Inter', fontFile: fontPath, backend: 'fontconfig', values: {size: 44, weight: 750}}, patches,
    method: 'Original reference pixels with deterministic Inter labels from public product specifications; no generative editing.',
    illustration: 'Shared family photograph; nominal dimensions are labels, not a scaled manufacturing drawing.', records,
  }, null, 2) + '\n');
}
