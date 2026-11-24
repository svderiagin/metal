import assert from 'node:assert/strict';
import {catalogMeasurementUrl} from './catalog-measurement-path.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import {readProjectData} from './project-data.mjs';
import {numberSignRemovalTargets, removeImageNumberSign} from './image-number-sign.mjs';

const directory = 'public/images/catalog/listovoy-prokat/list-ocynkovannyj';
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
const {products} = JSON.parse(await fs.readFile('data/additional-catalog.json', 'utf8'));
const sheets = products.filter(isColdRolledSheet);
const referenceProduct = sheets.find(({id}) => id === 'catalog-2182');
assert.ok(referenceProduct, 'Missing the cold-rolled sheet used as the artwork reference');
assert.deepEqual({...getSheetParameters(referenceProduct)}, {
  thickness: '0,5', width: '1250', length: '2500', mass: '12,26 кг/шт', format: '1250 × 2500 мм',
}, 'Review the reference artwork if the supplier specifications change');

const marked = `${directory}/originals/list_holodnokataniy_2400_1800_marked.jpg`;
const clean = `${directory}/originals/list_holodnokataniy_2400_1800_original.jpg`;
const width = 2400, height = 1800;
for (const file of [marked, clean]) {
  const metadata = await sharp(file).metadata();
  assert.deepEqual([metadata.width, metadata.height], [width, height], file);
}
const approvedReference = await removeImageNumberSign(sharp, marked, referenceProduct.id);
const referencePixels = await sharp(approvedReference).removeAlpha().raw().toBuffer();
const markedPixels = await sharp(marked).removeAlpha().raw().toBuffer();

// Keep the supplied title words, arrows and unit glyphs.
const fields = {
  designation: {box: {left: 1075, top: 114, width: 310, height: 103}, left: 1086, top: 126, size: 84, weight: 700},
  thickness: {box: {left: 510, top: 999, width: 102, height: 73}, right: 600, top: 1010, size: 56, weight: 500},
  width: {box: {left: 1049, top: 1261, width: 137, height: 59}, center: 1117, top: 1269, size: 56, weight: 500},
  length: {box: {left: 1094, top: 467, width: 150, height: 55}, center: 1169, top: 474, size: 56, weight: 500},
  mass: {box: {left: 612, top: 1620, width: 320, height: 66}, left: 623, top: 1633, size: 44, weight: 500},
};
const legacyDesignation = {...fields.designation, box: {left: 1184, top: 114, width: 155, height: 103}, left: 1194};

const write = process.argv.includes('--write');
const previewIndex = process.argv.indexOf('--preview');
const previewId = previewIndex < 0 ? undefined : process.argv[previewIndex + 1];
assert.ok(previewIndex < 0 || (!write && sheets.some(({id}) => id === previewId)), 'Use --write or --preview PRODUCT_ID');
const selectedSheets = previewId ? sheets.filter(({id}) => id === previewId) : sheets;
const outputs = [];
for (const product of selectedSheets) {
  const values = getSheetParameters(product);
  assert.ok(values, `${product.id}: missing thickness, format or mass`);
  assert.match(values.mass, /^\d+(?:,\d+)? кг\/шт$/u, `${product.id}: unexpected mass unit`);
  const file = `public${catalogMeasurementUrl(product)}`;
  if (product === referenceProduct) {
    outputs.push({product, file, image: approvedReference});
    continue;
  }

  const labels = {
    designation: values.thickness, thickness: values.thickness, mass: values.mass.replace(' ', '\u00a0'),
  };
  if (values.width !== '1250') labels.width = values.width;
  if (values.length !== '2500') labels.length = values.length;
  const legacy = numberSignRemovalTargets.some(({id}) => id === product.id);
  const source = legacy ? marked : approvedReference;
  const color = legacy ? '#111111' : '#41464D';
  const background = [], text = [], changedBoxes = [];
  for (const [key, value] of Object.entries(labels)) {
    const field = legacy && key === 'designation' ? legacyDesignation : fields[key];
    const {box, top, size, weight} = field;
    const rendered = await sharp({text: {text: `<span foreground="${color}" weight="${weight}">${value}</span>`,
      font: `Inter ${size}`, fontfile: fontPath, dpi: 72, rgba: true}}).png().toBuffer({resolveWithObject: true});
    const left = field.center === undefined
      ? field.left ?? field.right - rendered.info.width
      : Math.round(field.center - rendered.info.width / 2);
    assert.ok(left >= box.left && left + rendered.info.width <= box.left + box.width
      && top + rendered.info.height <= box.top + box.height, `${product.id}: ${key} does not fit its patch`);
    background.push({input: await sharp(clean).extract(box).png().toBuffer(), left: box.left, top: box.top});
    text.push({input: rendered.data, left, top});
    changedBoxes.push(box);
  }

  const patched = await sharp(source).composite(background).png().toBuffer();
  const renderer = sharp(patched);
  renderer.composite(text);
  const image = await renderer.webp({lossless: true, effort: 6}).toBuffer();
  const pixels = await sharp(image).removeAlpha().raw().toBuffer();
  const expectedPixels = Buffer.from(legacy ? markedPixels : referencePixels);
  for (const box of changedBoxes) {
    for (let y = box.top; y < box.top + box.height; y++) {
      const start = (y * width + box.left) * 3;
      pixels.copy(expectedPixels, start, start, start + box.width * 3);
    }
  }
  assert.ok(expectedPixels.equals(pixels), `${product.id}: pixels changed outside label patches`);
  outputs.push({product, file, image: legacy ? await removeImageNumberSign(sharp, image, product.id) : image});
}

for (const {file, image} of outputs) {
  await fs.writeFile(write ? file : path.join(temporaryDirectory, path.basename(file)), image);
  console.log(file);
}
if (write) {
  const products = Object.fromEntries(outputs.map(({product, file}) => [product.id, {
    imageUrl: file.slice('public'.length),
  }]));
  await fs.writeFile('data/cold-rolled-sheet-images.json', JSON.stringify({products}, null, 2) + '\n');
}
