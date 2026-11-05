import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {readProjectData} from './project-data.mjs';

const directory = 'public/images/catalog/listovoy-prokat/list_ocinkovanniy';
const temporaryDirectory = path.resolve('.tmp/galvanized-sheet-catalog');
const fontPath = path.resolve('imports/shveller-image-template/fonts/Inter-variable.ttf');
const fontConfiguration = path.join(temporaryDirectory, 'fonts.conf');
await fs.mkdir(path.join(temporaryDirectory, 'font-cache'), {recursive: true});
await fs.writeFile(fontConfiguration, `<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "urn:fontconfig:fonts.dtd"><fontconfig><dir>${path.dirname(fontPath)}</dir><cachedir>${temporaryDirectory}/font-cache</cachedir></fontconfig>`);
process.env.FONTCONFIG_FILE = fontConfiguration;
process.env.PANGOCAIRO_BACKEND = 'fontconfig';
const {default: sharp} = await import('sharp');

const {isGalvanizedSheet, getSheetParameters} = readProjectData('lib/sheetPresentation.ts');
const {products} = JSON.parse(await fs.readFile('data/rozmet-catalog.json', 'utf8'));
const sheets = products.filter(isGalvanizedSheet);
assert.deepEqual(sheets.map(({id}) => id).sort(), ['rozmet-2181', 'rozmet-2184', 'rozmet-2199']);
const referenceProduct = sheets.find(({id}) => id === 'rozmet-2181');
assert.equal(referenceProduct.name, 'Лист № 0,5 оцинкованный');
assert.deepEqual({...getSheetParameters(referenceProduct)}, {
  thickness: '0,5', width: '1250', length: '2500', mass: '12,26 кг/шт', format: '1250 × 2500 мм',
}, 'Review the reference artwork if the supplier specifications change');

const marked = `${directory}/list_ocinkovanniy_2400_1800_marked.jpg`;
const clean = `${directory}/list_ocinkovanniy_2400_1800_original.jpg`;
const width = 2400, height = 1800;
for (const file of [marked, clean]) {
  const metadata = await sharp(file).metadata();
  assert.deepEqual([metadata.width, metadata.height], [width, height], file);
}
const referencePixels = await sharp(marked).removeAlpha().raw().toBuffer();

// Keep the marked «Лист оцинкованный №» and the dimension arrows and units.
// For the derived variants replace the designation, thickness and mass values.
const fields = {
  designation: {box: {left: 1094, top: 114, width: 156, height: 103}, left: 1107, top: 127, size: 84, weight: 700},
  thickness: {box: {left: 501, top: 1008, width: 102, height: 73}, right: 591, top: 1018, size: 56, weight: 500},
  mass: {box: {left: 594, top: 1619, width: 330, height: 66}, left: 607, top: 1632, size: 44, weight: 750},
};

const write = process.argv.includes('--write');
const outputs = [];
for (const product of sheets) {
  const values = getSheetParameters(product);
  assert.ok(values, `${product.id}: missing thickness, format or mass`);
  assert.deepEqual([values.width, values.length], ['1250', '2500'], `${product.id}: update fixed dimensions in the artwork`);
  assert.match(values.mass, /^\d+(?:,\d+)? кг\/шт$/u, `${product.id}: unexpected mass unit`);

  const labels = product === referenceProduct ? {} : {
    designation: values.thickness, thickness: values.thickness, mass: values.mass.replace(' ', '\u00a0'),
  };
  const background = [], text = [], changedBoxes = [];
  for (const [key, value] of Object.entries(labels)) {
    const field = fields[key];
    const {box, top, size, weight} = field;
    const escaped = value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
    const rendered = await sharp({text: {text: `<span foreground="#41464D" weight="${weight}">${escaped}</span>`,
      font: `Inter ${size}`, fontfile: fontPath, dpi: 72, rgba: true}}).png().toBuffer({resolveWithObject: true});
    const left = field.left ?? field.right - rendered.info.width;
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
  if (!expectedPixels.equals(pixels)) {
    const offset = expectedPixels.findIndex((value, index) => value !== pixels[index]);
    const pixel = Math.floor(offset / 3);
    throw new Error(`${product.id}: pixels changed outside label patches at ${pixel % width}, ${Math.floor(pixel / width)} (${expectedPixels[offset]} → ${pixels[offset]})`);
  }
  const file = `${directory}/list-ocinkovanniy-${values.thickness.replace(',', '.')}-${values.width}x${values.length}-${product.id}.webp`;
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
  await fs.writeFile('data/galvanized-sheet-images.json', JSON.stringify({products}, null, 2) + '\n');
}
