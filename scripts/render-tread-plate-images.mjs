import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {readProjectData} from './project-data.mjs';

const directory = 'public/images/catalog/listovoy-prokat/list-refleniy';
const temporaryDirectory = path.resolve('.tmp/list-refleniy-qa');
const fontPath = path.resolve('imports/shveller-image-template/fonts/Inter-variable.ttf');
const fontConfiguration = path.join(temporaryDirectory, 'fonts.conf');
await fs.mkdir(path.join(temporaryDirectory, 'font-cache'), {recursive: true});
await fs.writeFile(fontConfiguration, `<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "urn:fontconfig:fonts.dtd"><fontconfig><dir>${path.dirname(fontPath)}</dir><cachedir>${temporaryDirectory}/font-cache</cachedir></fontconfig>`);
process.env.FONTCONFIG_FILE = fontConfiguration;
process.env.PANGOCAIRO_BACKEND = 'fontconfig';
const {default: sharp} = await import('sharp');

const {isTreadPlate, getSheetParameters} = readProjectData('lib/sheetPresentation.ts');
const {products} = JSON.parse(await fs.readFile('data/rozmet-catalog.json', 'utf8'));
const plates = products.filter(isTreadPlate);
assert.equal(plates.length, 4, 'Review the current tread plate range before regenerating');
const referenceProduct = plates.find(product => product.id === 'rozmet-28952');
const referenceValues = getSheetParameters(referenceProduct);
assert.deepEqual({...referenceValues}, {thickness: '3', width: '1250', length: '2500', mass: '73,59 кг/шт', format: '1250 × 2500 мм'}, 'Review the source artwork if the reference product changes');
assert.equal(referenceProduct.name, 'Лист № 3 ТУ рифленый');

const marked = `${directory}/list_refleniy_2400_1800_marked.jpg`;
const clean = `${directory}/list_refleniy_2400_1800_original.jpg`;
const width = 2400, height = 1800;
for (const file of [marked, clean]) {
  const metadata = await sharp(file).metadata();
  assert.equal(metadata.width, width, file);
  assert.equal(metadata.height, height, file);
}
const referencePixels = await sharp(marked).removeAlpha().raw().toBuffer();

// Keep the supplied dimension lines and unit glyphs. Only the number changes.
const fields = {
  title: {box: {left: 116, top: 110, width: 1008, height: 106}, x: 132, y: 124, size: 84, weight: 700},
  length: {box: {left: 1093, top: 461, width: 147, height: 66}, x: 1168, y: 474, size: 56, weight: 500, center: true},
  width: {box: {left: 1046, top: 1271, width: 136, height: 64}, x: 1115, y: 1283, size: 56, weight: 500, center: true},
  thickness: {box: {left: 544, top: 1006, width: 47, height: 65}, x: 570, y: 1019, size: 56, weight: 500, center: true},
  massLabel: {box: {left: 117, top: 1618, width: 472, height: 67}, x: 132, y: 1633, size: 44},
  mass: {box: {left: 600, top: 1618, width: 345, height: 67}, x: 610, y: 1627, size: 44, weight: 750},
};

const write = process.argv.includes('--write');
const outputs = [];
for (const product of plates) {
  const values = getSheetParameters(product);
  assert.ok(values, `${product.id}: missing thickness, format or mass`);
  if (product === referenceProduct) {
    outputs.push({product, file: marked});
    continue;
  }

  const labels = {title: product.name, length: values.length, width: values.width, thickness: values.thickness};
  const referenceLabels = {title: referenceProduct.name, ...referenceValues};
  if (values.mass !== referenceValues.mass) {
    labels.massLabel = 'Масса по каталогу';
    labels.mass = values.mass.replace(' ', '\u00a0');
  }

  const background = [], text = [];
  const expectedPixels = Buffer.from(referencePixels);
  const changedBoxes = [];
  for (const [key, value] of Object.entries(labels)) {
    if (value === referenceLabels[key]) continue;
    const {box, x, y, size, weight = 400, center} = fields[key];
    const escaped = value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
    const rendered = await sharp({text: {text: `<span foreground="#41464D" weight="${weight}">${escaped}</span>`,
      font: `Inter ${size}`, fontfile: fontPath, dpi: 72, rgba: true}}).png().toBuffer({resolveWithObject: true});
    const left = center ? Math.round(x - rendered.info.width / 2) : x;
    assert.ok(left >= box.left && left + rendered.info.width <= box.left + box.width
      && y + rendered.info.height <= box.top + box.height, `${product.id}: ${key} does not fit its patch`);
    background.push({input: await sharp(clean).extract(box).png().toBuffer(), left: box.left, top: box.top});
    text.push({input: rendered.data, left, top: y});
    changedBoxes.push(box);
  }

  const patched = await sharp(marked).composite(background).png().toBuffer();
  const image = await sharp(patched).composite(text).webp({lossless: true, effort: 6}).toBuffer();
  const pixels = await sharp(image).removeAlpha().raw().toBuffer();
  for (const box of changedBoxes) {
    for (let y = box.top; y < box.top + box.height; y++) {
      const start = (y * width + box.left) * 3;
      pixels.copy(expectedPixels, start, start, start + box.width * 3);
    }
  }
  assert.ok(expectedPixels.equals(pixels), `${product.id}: pixels changed outside label patches`);

  const file = `${directory}/list-refleniy-${values.thickness.replace(',', '.')}-${values.width}x${values.length}-${product.id}.webp`;
  outputs.push({product, file, image});
}

for (const {file, image} of outputs) {
  if (image) await fs.writeFile(write ? file : path.join(temporaryDirectory, path.basename(file)), image);
  console.log(file);
}
if (write) {
  const products = Object.fromEntries(outputs.map(({product, file}) => [product.id, {
    sourceUrl: product.sourceReference, imageUrl: file.slice('public'.length),
  }]));
  await fs.writeFile('data/tread-plate-images.json', JSON.stringify({products}, null, 2) + '\n');
}
