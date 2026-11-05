import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {readProjectData} from './project-data.mjs';

const directory = 'public/images/catalog/listovoy-prokat/list_goriachekataniy';
const temporaryDirectory = path.resolve('.tmp/hot-rolled-sheet-catalog');
const fontPath = path.resolve('imports/shveller-image-template/fonts/Inter-variable.ttf');
const fontConfiguration = path.join(temporaryDirectory, 'fonts.conf');
const fontCache = path.join(temporaryDirectory, 'font-cache');
await fs.mkdir(fontCache, {recursive: true});
await fs.writeFile(fontConfiguration, `<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "urn:fontconfig:fonts.dtd"><fontconfig><dir>${path.dirname(fontPath)}</dir><cachedir>${fontCache}</cachedir></fontconfig>`);
process.env.FONTCONFIG_FILE = fontConfiguration;
process.env.PANGOCAIRO_BACKEND = 'fontconfig';
const {default: sharp} = await import('sharp');

const {isPlainHotRolledSheet, getHotRolledSheetNumber, getSheetParameters} = readProjectData('lib/sheetPresentation.ts');
const {products} = JSON.parse(await fs.readFile('data/rozmet-catalog.json', 'utf8'));
const sheets = products.filter(isPlainHotRolledSheet);
assert.equal(sheets.length, 13, 'Review the current smooth hot-rolled sheet range before regenerating');
const referenceProduct = sheets.find(({id}) => id === 'rozmet-2187');
const referenceValues = {...getSheetParameters(referenceProduct)};
assert.deepEqual(referenceValues, {
  thickness: '2', width: '1250', length: '2500', mass: '49,06 кг/шт', format: '1250 × 2500 мм',
}, 'Review the reference artwork if the supplier specifications change');

const marked = `${directory}/list_goriachekataniy_2400_1800_marked.jpg`;
const clean = `${directory}/list_goriachekataniy_2400_1800_original.jpg`;
const width = 2400, height = 1800;
for (const file of [marked, clean]) {
  const metadata = await sharp(file).metadata();
  assert.deepEqual([metadata.width, metadata.height], [width, height], file);
}
const referencePixels = await sharp(marked).removeAlpha().raw().toBuffer();

// Preserve the supplied title words, dimension arrows and millimetre unit glyphs.
const fields = {
  designation: {box: {left: 1112, top: 112, width: 338, height: 106}, left: 1126, top: 126, size: 84, weight: 700},
  thickness: {box: {left: 501, top: 1004, width: 104, height: 70}, right: 593, top: 1017, size: 56, weight: 500},
  width: {box: {left: 1047, top: 1270, width: 137, height: 62}, center: 1115, top: 1280, size: 56, weight: 500},
  length: {box: {left: 1091, top: 464, width: 153, height: 63}, center: 1168, top: 474, size: 56, weight: 500},
  mass: {box: {left: 597, top: 1618, width: 380, height: 68}, left: 608, top: 1631, size: 44, weight: 750},
};

const write = process.argv.includes('--write');
const outputs = [];
for (const product of sheets) {
  const values = getSheetParameters(product);
  assert.ok(values, `${product.id}: missing thickness, format or mass`);
  assert.match(values.mass, /^\d+(?:,\d+)? кг\/(?:шт|м²)$/u, `${product.id}: unexpected mass unit`);
  const labels = {...values, designation: getHotRolledSheetNumber(product, values.thickness)};
  const referenceLabels = {...referenceValues, designation: referenceValues.thickness};
  const background = [], text = [], changedBoxes = [];
  for (const [key, field] of Object.entries(fields)) {
    if (labels[key] === referenceLabels[key]) continue;
    const {box, size, weight} = field;
    const value = labels[key].replace(' ', '\u00a0');
    // Sharp crops text to the ink. The raised ² adds five pixels above the baseline.
    const top = key === 'mass' && value.endsWith('м²') ? field.top - 5 : field.top;
    const rendered = await sharp({text: {text: `<span foreground="#41464D" weight="${weight}">${value}</span>`,
      font: `Inter ${size}`, fontfile: fontPath, dpi: 72, rgba: true}}).png().toBuffer({resolveWithObject: true});
    const left = field.center === undefined ? field.left ?? field.right - rendered.info.width
      : Math.round(field.center - rendered.info.width / 2);
    assert.ok(left >= box.left && left + rendered.info.width <= box.left + box.width
      && top + rendered.info.height <= box.top + box.height, `${product.id}: ${key} does not fit its patch`);
    background.push({input: await sharp(clean).extract(box).png().toBuffer(), left: box.left, top: box.top});
    text.push({input: rendered.data, left, top});
    changedBoxes.push(box);
  }

  const patched = background.length ? await sharp(marked).composite(background).png().toBuffer() : marked;
  const renderer = sharp(patched);
  if (text.length) renderer.composite(text);
  const image = await renderer.webp({lossless: true, effort: 6}).toBuffer();
  const pixels = await sharp(image).removeAlpha().raw().toBuffer();
  const expectedPixels = Buffer.from(referencePixels);
  for (const box of changedBoxes) {
    for (let y = box.top; y < box.top + box.height; y++) {
      const start = (y * width + box.left) * 3;
      pixels.copy(expectedPixels, start, start, start + box.width * 3);
    }
  }
  assert.ok(expectedPixels.equals(pixels), `${product.id}: pixels changed outside label patches`);
  const thickness = values.thickness.replace(',', '.');
  const file = `${directory}/list-goriachekataniy-${thickness}-${values.width}x${values.length}-${product.id}.webp`;
  outputs.push({product, file, image});
}

for (const {file, image} of outputs) {
  await fs.writeFile(write ? file : path.join(temporaryDirectory, path.basename(file)), image);
  console.log(file);
}
if (write) {
  const products = Object.fromEntries(outputs.map(({product, file}) => [product.id, {
    sourceUrl: product.sourceReference, imageUrl: file.slice('public'.length),
  }]));
  await fs.writeFile('data/hot-rolled-sheet-images.json', JSON.stringify({products}, null, 2) + '\n');
}
