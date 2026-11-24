import fs from 'node:fs/promises';
import {catalogMeasurementUrl} from './catalog-measurement-path.mjs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {readProjectData} from './project-data.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(root);
const templateDirectory = 'imports/shveller-image-template';
const temporaryDirectory = path.join(root, '.tmp/shveller-image-render');
await fs.mkdir(path.join(temporaryDirectory, 'font-cache'), {recursive: true});
const fontConfiguration = path.join(temporaryDirectory, 'fonts.conf');
await fs.writeFile(fontConfiguration, `<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "urn:fontconfig:fonts.dtd"><fontconfig><dir>${path.join(root, templateDirectory, 'fonts')}</dir><cachedir>${temporaryDirectory}/font-cache</cachedir></fontconfig>`);
process.env.FONTCONFIG_FILE = fontConfiguration;
process.env.PANGOCAIRO_BACKEND = 'fontconfig';
const {default: sharp} = await import('sharp');

const WIDTH = 2400, HEIGHT = 1800;
const fontPath = `${templateDirectory}/fonts/Inter-variable.ttf`;
const products = readProjectData('data/products/index.ts').productVariants
  .filter(product => product.categoryId === 'catalog-cat-shveller');
assert.ok(products.length, 'No channel offers to illustrate');

const write = process.argv.includes('--write');
const previewIndex = process.argv.indexOf('--preview');
const previewProfile = previewIndex >= 0 ? process.argv[previewIndex + 1]?.replace('.', ',') : undefined;
assert.ok(!(write && previewIndex >= 0), 'Use --write for the whole family or --preview for one profile');
assert.ok(previewIndex < 0 || previewProfile, '--preview requires a profile or product ID');
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
const parallelPatches = {
  title: {left: 110, top: 105, width: 960, height: 120},
  flangeWidth: {left: 680, top: 876, width: 224, height: 58},
  webThickness: {left: 1160, top: 1227, width: 320, height: 83},
  flangeThickness: {left: 1964, top: 986, width: 370, height: 94},
  height: {left: 900, top: 1408, width: 980, height: 90},
  length: {left: 600, top: 1552, width: 470, height: 64},
  mass: {left: 600, top: 1621, width: 470, height: 65},
};
const parallelLayout = {
  title: {size: 84, weight: 700, left: 136, top: 127},
  flangeWidth: {size: 56, center: 814, top: 884, rightLimit: 896},
  webThickness: {size: 56, left: 1172, top: 1245},
  flangeThickness: {size: 56, left: 1980, top: 1010, halo: {padding: 7, blur: 5}},
  height: {size: 56, center: 1390, top: 1431},
  length: {size: 44, weight: 750, left: 610, top: 1568},
  mass: {size: 44, weight: 750, left: 610, top: 1634},
};
const originals = 'public/images/catalog/shveller/originals';
const templates = {
  'П': {
    referencePath: `${templateDirectory}/reference-5.jpg`,
    photoPath: `${templateDirectory}/photo.png`,
    patches: parallelPatches,
    layout: parallelLayout,
    labels: {
      title: 'Швеллер № 5', flangeWidth: '32 мм', webThickness: '4,4 мм',
      flangeThickness: '7 мм', height: '50 мм', length: '11,7 м', mass: '4,84 кг/м',
    },
    heightLine: {left: 920, right: 1860, y: 1451, color: '#59636F', redrawArrows: true},
  },
  'У': {
    referencePath: `${originals}/shveller_Y_2400_1800_marked.jpg`,
    photoPath: `${originals}/shveller_Y_1448_1086_original.jpg`,
    patches: {
      title: {left: 110, top: 105, width: 860, height: 120},
      flangeWidth: {left: 684, top: 878, width: 216, height: 58},
      webThickness: {left: 1208, top: 1223, width: 370, height: 80},
      flangeThickness: {left: 2025, top: 876, width: 295, height: 103},
      height: {left: 1269, top: 1389, width: 311, height: 72},
      length: {left: 600, top: 1552, width: 470, height: 64},
      mass: {left: 600, top: 1621, width: 470, height: 65},
    },
    layout: {
      title: {size: 84, weight: 700, left: 135, top: 126},
      flangeWidth: {size: 56, weight: 480, center: 796, top: 885},
      webThickness: {size: 56, weight: 480, left: 1220, top: 1236},
      flangeThickness: {size: 56, weight: 480, left: 2055, top: 900, halo: {padding: 11, blur: 8}},
      height: {size: 56, weight: 480, center: 1422, top: 1401},
      length: {size: 44, weight: 750, left: 610, top: 1567},
      mass: {size: 44, weight: 750, left: 610, top: 1634},
    },
    labels: {
      title: 'Швеллер 8У', flangeWidth: '40 мм', webThickness: '4,5 мм',
      flangeThickness: '7,4 мм', height: '80 мм', length: '12 м', mass: '7,05 кг/м',
    },
    heightLine: {left: 1269, right: 1580, y: 1423.4, color: '#5B616D'},
  },
};

async function loadTemplate(template) {
  const {referencePath, photoPath, patches} = template;
  const reference = await fs.readFile(referencePath);
  const referenceMetadata = await sharp(reference).metadata();
  assert.equal(referenceMetadata.width, WIDTH);
  assert.equal(referenceMetadata.height, HEIGHT);
  const source = sharp(photoPath);
  const {width, height} = await source.metadata();
  assert.equal(width * HEIGHT, height * WIDTH, `${photoPath}: reference aspect ratio changed`);
  const photo = width === WIDTH ? await fs.readFile(photoPath) : await source.resize(WIDTH, HEIGHT).png().toBuffer();
  const patchLayers = Object.fromEntries(await Promise.all(Object.entries(patches).map(async ([key, rectangle]) => [key, {
    input: await sharp(photo).extract(rectangle).png().toBuffer(),
    left: rectangle.left, top: rectangle.top,
  }])));
  const referencePixels = await sharp(reference).removeAlpha().raw().toBuffer();
  return {...template, reference, referencePixels, patchLayers};
}

function restoreHeightLine({left, right, y, color, redrawArrows}, placement) {
  const arrows = redrawArrows ? `M${left} 1408V1467 M${right} 1408V1467 ` : '';
  const arrowheads = redrawArrows ? `<g fill="${color}"><path d="M${left} ${y}l24 -4v8z M${right} ${y}l-24 -4v8z"/></g>` : '';
  return svg(`<g stroke="${color}" stroke-width="4" fill="none">
      <path d="${arrows}M${left} ${y}H${placement.left - 10} M${placement.left + placement.width + 10} ${y}H${right}"/>
      </g>${arrowheads}`);
}

const loadedTemplates = {};

async function render(product) {
  const profile = product.specifications.find(item => item.name === 'Профиль')?.value;
  assert.ok(profile, product.name);
  const expectedPath = catalogMeasurementUrl(product);
  assert.equal(product.imageUrls[0], expectedPath, 'Do not change product routing or image associations');
  const template = templates[product.channelSeries];
  assert.ok(template, `${product.id}: no template for series ${product.channelSeries}`);
  const {reference, referencePixels, referencePath, patches, layout, patchLayers, heightLine, labels: referenceLabels} =
    loadedTemplates[product.channelSeries] ??= await loadTemplate(template);
  const values = Object.fromEntries(['Высота', 'Ширина полки', 'Толщина стенки', 'Толщина полки', 'Длина по каталогу', 'Теоретическая масса'].map(name => {
    const entries = product.specifications.filter(item => item.name === name);
    assert.equal(entries.length, 1, `${product.id}: missing or ambiguous ${name}`);
    return [name, entries[0].value];
  }));
  let image = reference;
  const textByLabel = {
    title: `Швеллер ${profile}`,
    flangeWidth: values['Ширина полки'],
    webThickness: values['Толщина стенки'],
    flangeThickness: values['Толщина полки'],
    height: values['Высота'],
    length: values['Длина по каталогу'],
    mass: values['Теоретическая масса'],
  };
  const labels = Object.entries(textByLabel).map(([key, text]) => ({key, text, ...layout[key]}));
  const placements = [];
  const changedLabels = labels.filter(label => label.text !== referenceLabels[label.key]);
  if (changedLabels.length) {
    const cleanReference = await sharp(reference).composite(changedLabels.map(label => patchLayers[label.key])).png().toBuffer();
    const layers = [];
    for (const label of changedLabels) {
      const rendered = await textImage(label.text, label.size, label.weight);
      let left = label.center === undefined ? label.left : Math.round(label.center - rendered.info.width / 2);
      // Longer flange-width values must not run into the metal's front edge.
      if (label.rightLimit !== undefined) left = Math.min(left, label.rightLimit - rendered.info.width);
      assert.ok(left >= 0 && left + rendered.info.width <= WIDTH, `${product.id}: ${label.key} is clipped`);
      const box = patches[label.key];
      assert.ok(left >= box.left && left + rendered.info.width <= box.left + box.width, `${product.id}: label exceeds its patch`);
      assert.ok(label.top >= box.top && label.top + rendered.info.height <= box.top + box.height, `${product.id}: label height exceeds its patch`);
      placements.push({...label, left, width: rendered.info.width, height: rendered.info.height});
      if (label.halo) {
        const {padding, blur} = label.halo;
        const halo = svg(`<defs><filter id="label-background" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="${blur}"/></filter><clipPath id="label-area"><rect x="${box.left}" y="${box.top}" width="${box.width}" height="${box.height}"/></clipPath></defs><g clip-path="url(#label-area)"><rect x="${left - padding}" y="${label.top - padding}" width="${rendered.info.width + padding * 2}" height="${rendered.info.height + padding * 2}" rx="5" fill="#FFFFFF" filter="url(#label-background)"/></g>`);
        layers.push({input: halo, left: 0, top: 0});
      }
      layers.push({input: rendered.data, left, top: label.top});
    }
    const overall = placements.find(label => label.key === 'height');
    // Restore the overall-dimension segment erased with its old numeric label.
    const lines = overall ? [{input: restoreHeightLine(heightLine, overall), left: 0, top: 0}] : [];
    image = await sharp(cleanReference).composite([...lines, ...layers]).png().toBuffer();
  }
  const output = write ? `public${expectedPath}` : `${previewDirectory}/${path.basename(expectedPath)}`;
  // Lossless source assets preserve the photograph; next/image delivers smaller variants.
  const result = await sharp(image).webp({lossless: true, effort: 5}).toBuffer();
  const mask = Buffer.alloc(WIDTH * HEIGHT);
  const changedAreas = changedLabels.map(({key}) => patches[key]);
  for (const box of changedAreas) {
    for (let y = box.top; y < box.top + box.height; y++) mask.fill(1, y * WIDTH + box.left, y * WIDTH + box.left + box.width);
  }
  const renderedPixels = await sharp(result).removeAlpha().raw().toBuffer();
  let protectedPixelChanges = 0;
  for (let p = 0; p < mask.length; p++) if (!mask[p] && (referencePixels[p * 3] !== renderedPixels[p * 3] || referencePixels[p * 3 + 1] !== renderedPixels[p * 3 + 1] || referencePixels[p * 3 + 2] !== renderedPixels[p * 3 + 2])) protectedPixelChanges++;
  assert.equal(protectedPixelChanges, 0, `${product.id}: pixels changed outside variable-label regions`);
  await fs.writeFile(output, result);
  return {id: product.id, profile, imageUrl: expectedPath, values, labels: labels.map(({key, text}) => ({key, text})),
    sourceReference: referencePath,
    changedLabels: changedLabels.map(label => label.key), placements, protectedPixelChanges, output, width: WIDTH, height: HEIGHT,
    format: 'lossless WebP', bytes: result.length, sha256: createHash('sha256').update(result).digest('hex')};
}

const selected = previewProfile ? products.filter(product =>
  product.id === previewProfile || String(product.channelNumber).replace('.', ',') === previewProfile
    || product.specifications.some(item => item.name === 'Профиль' && item.value === previewProfile)) : products;
assert.ok(selected.length, 'Unknown preview profile');
const records = [];
for (const product of selected) {
  const record = await render(product);
  records.push(record);
  console.log(`${record.profile}: ${record.width}x${record.height}; ${Math.round(record.bytes / 1024)} KiB; ${record.output}`);
}
if (write) {
  assert.equal(records.length, products.length, '--write must update the whole family');
  await fs.writeFile('imports/shveller-image-template/rendered.json', JSON.stringify({
    renderer: 'scripts/render-shveller-images.mjs',
    templates: Object.fromEntries(Object.entries(templates).map(([series, {referencePath, photoPath, patches}]) =>
      [series, {reference: referencePath, cleanPhoto: photoPath, patches}])),
    typography: {family: 'Inter', fontFile: fontPath, backend: 'fontconfig', values: {size: 44, weight: 750}},
    method: 'Original reference pixels with deterministic Inter labels from public product specifications; no generative editing.',
    illustration: 'Separate approved reference photographs for parallel and sloping flange faces, with ГОСТ 8240-97 dimensions.', records,
  }, null, 2) + '\n');
}
