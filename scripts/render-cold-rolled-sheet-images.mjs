import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {readProjectData} from './project-data.mjs';
import {removeImageNumberSign} from './image-number-sign.mjs';

const directory = 'public/images/catalog/listovoy-prokat/list_holodnokataniy';
const temporaryDirectory = path.resolve('.tmp/cold-rolled-sheet-catalog');
const fontPath = path.resolve('imports/shveller-image-template/fonts/Inter-variable.ttf');
const fontConfiguration = path.join(temporaryDirectory, 'fonts.conf');
const fontCache = path.join(temporaryDirectory, 'font-cache');
await fs.mkdir(fontCache, {recursive: true});
await fs.writeFile(fontConfiguration, `<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "urn:fontconfig:fonts.dtd"><fontconfig><dir>${path.dirname(fontPath)}</dir><cachedir>${fontCache}</cachedir></fontconfig>`);
process.env.FONTCONFIG_FILE = fontConfiguration;
process.env.PANGOCAIRO_BACKEND = 'fontconfig';
const {default: sharp} = await import('sharp');

const {isColdRolledSheet, getSheetParameters} = readProjectData('lib/sheetPresentation.ts');
const {products} = JSON.parse(await fs.readFile('data/rozmet-catalog.json', 'utf8'));
const sheets = products.filter(isColdRolledSheet);
assert.deepEqual(sheets.map(({id}) => id).sort(), ['rozmet-2182', 'rozmet-2185']);
const referenceProduct = sheets.find(({id}) => id === 'rozmet-2182');
assert.deepEqual({...getSheetParameters(referenceProduct)}, {
  thickness: '0,5', width: '1250', length: '2500', mass: '12,26 кг/шт', format: '1250 × 2500 мм',
}, 'Review the reference artwork if the supplier specifications change');

const marked = `${directory}/list_holodnokataniy_2400_1800_marked.jpg`;
const clean = `${directory}/list_holodnokataniy_2400_1800_original.jpg`;
const width = 2400, height = 1800;
for (const file of [marked, clean]) {
  const metadata = await sharp(file).metadata();
  assert.deepEqual([metadata.width, metadata.height], [width, height], file);
}
const referencePixels = await sharp(marked).removeAlpha().raw().toBuffer();

// Keep the supplied title words, arrow lines, dimensions and thickness units.
const fields = {
  designation: {box: {left: 1184, top: 114, width: 155, height: 103}, left: 1194, top: 126, size: 84, weight: 700},
  thickness: {box: {left: 510, top: 999, width: 102, height: 73}, right: 600, top: 1010, size: 56, weight: 500},
  mass: {box: {left: 612, top: 1620, width: 320, height: 66}, left: 623, top: 1633, size: 44, weight: 500},
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
    const rendered = await sharp({text: {text: `<span foreground="#111111" weight="${weight}">${value}</span>`,
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
  assert.ok(expectedPixels.equals(pixels), `${product.id}: pixels changed outside label patches`);
  const thickness = values.thickness.replace(',', '.');
  const file = `${directory}/list-holodnokataniy-${thickness}-${values.width}x${values.length}-${product.id}.webp`;
  outputs.push({product, file, image: await removeImageNumberSign(sharp, image, product.id)});
}

for (const {file, image} of outputs) {
  await fs.writeFile(write ? file : path.join(temporaryDirectory, path.basename(file)), image);
  console.log(file);
}
if (write) {
  const products = Object.fromEntries(outputs.map(({product, file}) => [product.id, {
    sourceUrl: product.sourceReference, imageUrl: file.slice('public'.length),
  }]));
  await fs.writeFile('data/cold-rolled-sheet-images.json', JSON.stringify({products}, null, 2) + '\n');
}
