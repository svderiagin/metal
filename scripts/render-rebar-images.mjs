import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {renderRebarImage} from '../imports/rebar-image-template/labels.mjs';
import {readProjectData} from './project-data.mjs';
import {catalogMeasurementUrl} from './catalog-measurement-path.mjs';

process.chdir(fileURLToPath(new URL('..', import.meta.url)));
const args = process.argv.slice(2);
const write = args.length === 1 && args[0] === '--write';
assert.ok(write || (args.length === 2 && args[0] === '--preview'), 'Use --write or --preview PRODUCT_ID');

const cache = new Map();
const {productVariants} = readProjectData('data/products/index.ts', cache);
const {productIllustrationSignature} = readProjectData('lib/productPreviewImage.ts', cache);
const {isDemonstrationProduct} = readProjectData('lib/catalogOffer.ts', cache);
const products = productVariants.filter(p => p.categoryId === 'cat-arm' && (write || p.id === args[1]));
assert.ok(products.length, 'No matching rebar products');

const families = {
  'cat-arm-sub-1': {profile: 'ribbed', designation: 'А500С'},
  'cat-arm-sub-2': {profile: 'ribbed', designation: 'А400 (35ГС)'},
  'cat-arm-sub-3': {profile: 'ribbed', designation: 'А400 (25Г2С)'},
  'cat-arm-sub-4': {profile: 'smooth', designation: 'А240'},
};
const photos = {
  ribbed: '/images/catalog/armatura/originals/riflenaya/armatura_reflenaya_1448_1086_original.jpg',
  smooth: '/images/catalog/armatura/originals/gladkaya/armatura_gladkaya_2400_1800_original.webp',
};
const number = new Intl.NumberFormat('ru-RU', {useGrouping: false, maximumFractionDigits: 12});

function labelsFor(product) {
  const family = families[product.subcategoryId];
  assert.ok(family, product.id + ': rebar family requires a reviewed template');
  const {profile, designation} = family;
  const demo = isDemonstrationProduct(product);
  // Demo grade/length/mass attributes are placeholders. Only the published
  // product designation may be used, just as it appears in the catalogue.
  const size = demo ? product.name.match(/(\d+(?:[.,]\d+)?)\s*мм$/iu)?.[1] : product.diameterMm;
  assert.ok(demo ? size : Number.isFinite(size) && size > 0, product.id + ': missing nominal diameter');
  const diameter = (demo ? size.replace('.', ',') : number.format(size)) + ' мм';
  const productClass = product.attributes.find(item => item.key === 'class')?.value;
  const grade = productClass && profile === 'smooth' ? productClass : designation;
  const quality = /\b2\s+сорт/iu.test(product.name) ? ', 2 сорт' : '';
  const title = `Арматура ${profile === 'smooth' ? 'гладкая' : 'рифлёная'} ${grade} Ø ${diameter}${quality}`;
  if (demo) return {profile, title, diameter, supplyLabel: '', supplyValue: '', mass: ''};

  const coil = product.form === 'coil';
  assert.ok(coil || (product.form === 'bar' && product.lengthMeters > 0 && Number.isFinite(product.lengthMeters)),
    product.id + ': missing form or bar length');
  assert.ok(product.weightPerMeterKg > 0 && Number.isFinite(product.weightPerMeterKg) && product.weightConfirmed !== false,
    product.id + ': unconfirmed linear mass');
  return {
    profile, title, diameter,
    supplyLabel: coil ? 'Форма поставки' : 'Длина по каталогу',
    supplyValue: coil ? 'В бунтах' : number.format(product.lengthMeters) + ' м',
    mass: number.format(product.weightPerMeterKg) + ' кг/м',
  };
}

async function replaceFile(file, contents) {
  const temporary = file + '.' + process.pid + '.tmp';
  await fs.writeFile(temporary, contents);
  await fs.rename(temporary, file);
}

const records = products.map(product => ({product, labels: labelsFor(product)}));
const directory = '.tmp/rebar-image-render';
const images = new Map();
const published = new Map();
const publishedById = new Map();
const {default: sharp} = await import('sharp');
for (const {product, labels} of records) {
  const key = JSON.stringify(labels);
  if (!images.has(key)) {
    const raster = await renderRebarImage(labels);
    images.set(key, await sharp(raster).webp({lossless: true, effort: 4}).toBuffer());
  }
  console.log(product.id, labels.title, labels.supplyValue, labels.mass);
}
// Finish rendering the entire selection before replacing any storefront files.
for (const {product, labels} of records) {
  const key = JSON.stringify(labels);
  const scopedKey = `${product.subcategoryId}/${key}`;
  const previous = published.get(scopedKey);
  const url = previous ?? catalogMeasurementUrl(product);
  publishedById.set(product.id, url);
  if (write && previous) continue;
  if (write) published.set(scopedKey, url);
  const output = write ? `public${url}` : path.join(directory, product.id + '.webp');
  await fs.mkdir(path.dirname(output), {recursive: true});
  await replaceFile(output, images.get(key));
}
if (write) {
  const manifestPath = 'data/product-illustrations.json';
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
  for (const {product, labels} of records) {
    manifest[product.id] = {
      imageUrl: publishedById.get(product.id),
      photoUrl: photos[labels.profile], signature: productIllustrationSignature(product),
      ...(isDemonstrationProduct(product) ? {showForDemo: true} : {}),
    };
  }
  await replaceFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
}
