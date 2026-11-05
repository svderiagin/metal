import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {readProjectData} from '../../scripts/project-data.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
process.chdir(root);
const directory = 'imports/list-rifleniy-image-template';
const temporary = path.join(root, '.tmp/list-rifleniy-layout/annotations');
await fs.mkdir(temporary, {recursive: true});
await fs.mkdir(path.join(temporary, 'font-cache'), {recursive: true});
const fontConfiguration = path.join(temporary, 'fonts.conf');
await fs.writeFile(fontConfiguration, `<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "urn:fontconfig:fonts.dtd"><fontconfig><dir>${path.join(root, 'imports/shveller-image-template/fonts')}</dir><cachedir>${temporary}/font-cache</cachedir></fontconfig>`);
process.env.FONTCONFIG_FILE = fontConfiguration;
process.env.PANGOCAIRO_BACKEND = 'fontconfig';
const {default: sharp} = await import('sharp');

const WIDTH = 2400, HEIGHT = 1800;
const fontFile = 'imports/shveller-image-template/fonts/Inter-variable.ttf';
const photoFile = 'public/images/catalog/listovoy-prokat/list-rifleniy_2400_1800_original.png';
const photo = await fs.readFile(photoFile);
const metadata = await sharp(photo).metadata();
assert.equal(metadata.width, WIDTH);
assert.equal(metadata.height, HEIGHT);
const product = readProjectData('data/products/index.ts').productVariants.find(item => item.id === 'rozmet-2202');
assert.ok(product);
const specification = name => product.specifications.find(item => item.name === name)?.value;
assert.equal(specification('Толщина'), '4 мм');
assert.equal(specification('Размер'), '1,5х6 м');

const xml = text => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const svg = body => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}">${body}</svg>`);
const number = value => Math.round(value * 10) / 10;
const point = value => `${number(value.x)},${number(value.y)}`;
const layers = [], placements = [], lines = [];
async function label(key, text, {size = 56, weight = 400, left, center, top}) {
  const rendered = await sharp({text: {
    text: `<span foreground="#41464D" weight="${weight}">${xml(text)}</span>`,
    font: `Inter ${size}`, fontfile: fontFile, dpi: 72, rgba: true,
  }}).png().toBuffer({resolveWithObject: true});
  const x = left ?? Math.round(center - rendered.info.width / 2);
  assert.ok(x >= 0 && top >= 0 && x + rendered.info.width <= WIDTH && top + rendered.info.height <= HEIGHT, `${key}: clipped text`);
  layers.push({input: rendered.data, left: x, top});
  const placement = {key, text, size, weight, left: x, top, width: rendered.info.width, height: rendered.info.height};
  placements.push(placement);
  return placement;
}
function line(a, b) {
  lines.push(`<path d="M${point(a)}L${point(b)}" fill="none" stroke="#59636F" stroke-width="4"/>`);
}
function arrow(tip, direction, length = 22, halfWidth = 7) {
  const base = {x: tip.x - direction.x * length, y: tip.y - direction.y * length};
  const normal = {x: -direction.y, y: direction.x};
  const p = {x: base.x + normal.x * halfWidth, y: base.y + normal.y * halfWidth};
  const q = {x: base.x - normal.x * halfWidth, y: base.y - normal.y * halfWidth};
  lines.push(`<path d="M${point(tip)}L${point(p)}L${point(q)}Z" fill="#59636F"/>`);
}
async function dimension(key, text, from, to, offset) {
  const dx = to.x - from.x, dy = to.y - from.y, distance = Math.hypot(dx, dy);
  const unit = {x: dx / distance, y: dy / distance};
  const normal = {x: -unit.y, y: unit.x};
  const p = {x: from.x + offset.x, y: from.y + offset.y};
  const q = {x: to.x + offset.x, y: to.y + offset.y};
  const middle = {x: (p.x + q.x) / 2, y: (p.y + q.y) / 2};
  const textBox = await label(key, text, {center: middle.x, top: Math.round(middle.y - 22)});
  // Dimension geometry follows the corresponding projected edge; horizontal
  // lettering follows the owner's readable photographic-annotation style.
  const gap = 2 * Math.min(
    (textBox.width / 2 + 18) / Math.max(Math.abs(unit.x), 0.000001),
    (textBox.height / 2 + 18) / Math.max(Math.abs(unit.y), 0.000001),
  );
  line(p, {x: middle.x - unit.x * gap / 2, y: middle.y - unit.y * gap / 2});
  line({x: middle.x + unit.x * gap / 2, y: middle.y + unit.y * gap / 2}, q);
  const offsetLength = Math.hypot(offset.x, offset.y);
  const outward = {x: offset.x / offsetLength, y: offset.y / offsetLength};
  for (const [original, end] of [[from, p], [to, q]]) {
    line({x: original.x + outward.x * 6, y: original.y + outward.y * 6},
      {x: end.x + outward.x * 22, y: end.y + outward.y * 22});
  }
  arrow(p, {x: -unit.x, y: -unit.y});
  arrow(q, unit);
  return {key, from, to, offset, normal};
}

await label('title', 'Лист рифлёный № 4', {size: 84, weight: 700, left: 132, top: 127});
const dimensions = [];
dimensions.push(await dimension('length', '6000\u00a0мм', {x: 855, y: 1034}, {x: 1751, y: 130}, {x: -89, y: -88}));
dimensions.push(await dimension('width', '1500\u00a0мм', {x: 860, y: 1054}, {x: 1566, y: 1338}, {x: -49, y: 120}));

// The nominal thickness is measured between the two planes of the base sheet.
// Short external arrows keep the tiny interval legible and exclude raised ribs.
const thickness = {top: {x: 855, y: 1034}, bottom: {x: 855, y: 1054}, dimensionX: 730};
line({x: 700, y: thickness.top.y}, thickness.top);
line({x: 700, y: thickness.bottom.y}, thickness.bottom);
line({x: 730, y: 974}, {x: 730, y: 1114});
arrow({x: 730, y: thickness.top.y}, {x: 0, y: 1});
arrow({x: 730, y: thickness.bottom.y}, {x: 0, y: -1});
const thicknessText = await label('thickness', '4\u00a0мм', {center: 566, top: 1022});
line({x: thicknessText.left + thicknessText.width + 18, y: 1044}, {x: 730, y: 1044});
await label('thickness-caption', 'Толщина основания', {size: 32, left: 390, top: 960});

await label('length-caption', 'Длина по каталогу', {size: 44, left: 132, top: 1568});
await label('length-value', '6\u00a0м', {size: 40, weight: 700, left: 610, top: 1568});
await label('width-caption', 'Ширина по каталогу', {size: 44, left: 132, top: 1634});
await label('width-value', '1,5\u00a0м', {size: 44, weight: 750, left: 610, top: 1634});

const empty = await sharp({create: {width: WIDTH, height: HEIGHT, channels: 4, background: {r: 0, g: 0, b: 0, alpha: 0}}}).png().toBuffer();
const overlay = await sharp(empty).composite([{input: svg(lines.join('')), left: 0, top: 0}, ...layers]).png().toBuffer();
const output = 'public/images/catalog/listovoy-prokat/list-rifleniy-4-1500x6000-marked.png';
await sharp(photo).composite([{input: overlay, left: 0, top: 0}]).png({compressionLevel: 9}).toFile(output);
await fs.writeFile(`${directory}/annotation-overlay.png`, overlay);
await fs.writeFile(`${directory}/annotation-lines.svg`, svg(lines.join('')));
const sourcePixels = await sharp(photo).removeAlpha().raw().toBuffer();
const outputPixels = await sharp(output).removeAlpha().raw().toBuffer();
const overlayPixels = await sharp(overlay).ensureAlpha().raw().toBuffer();
let outsideOverlayChanges = 0, overlayPixelCount = 0;
for (let i = 0; i < WIDTH * HEIGHT; i++) {
  if (overlayPixels[i * 4 + 3] !== 0) {overlayPixelCount++; continue;}
  if (sourcePixels[i * 3] !== outputPixels[i * 3] || sourcePixels[i * 3 + 1] !== outputPixels[i * 3 + 1] || sourcePixels[i * 3 + 2] !== outputPixels[i * 3 + 2]) outsideOverlayChanges++;
}
assert.equal(outsideOverlayChanges, 0, 'The clean photograph changed outside the annotation overlay');
const hash = data => createHash('sha256').update(data).digest('hex');
const report = {
  preparedOn: '2026-11-04', status: 'owner-requested-example-only', connectedToProductTables: false,
  renderer: `${directory}/render-annotations.mjs`, productId: product.id, productName: product.name,
  sourceReference: product.sourceReference, specifications: product.specifications,
  referenceStyle: 'imports/kvadrat-image-template/reference-8x8.jpg',
  cleanPhoto: {file: photoFile, sha256: hash(photo)}, output: {file: output, width: WIDTH, height: HEIGHT, sha256: hash(await fs.readFile(output))},
  typography: {family: 'Inter', fontFile, backend: 'fontconfig', textColor: '#41464D', lineColor: '#59636F', lineWidth: 4},
  labels: placements, dimensions, thickness,
  verification: {outsideOverlayChanges, overlayPixelCount},
  engineeringNotes: [
    'Длинная сторона обозначена 6000 мм, короткая — 1500 мм; размерные линии параллельны соответствующим кромкам иллюстрации.',
    '4 мм относится к основанию листа, а не к высоте вместе с рифлями; точки выносок находятся на верхней и нижней плоскости основания у ближнего угла.',
    'Иллюстрация семейства с номинальными размерами, не масштабный производственный чертёж.',
    'Масса не добавлена: каталог даёт 31.4 кг/м², что совпадает с массой гладкого основания 4 мм; подтверждения массы рифлёного исполнения нет. Каталожные данные не менялись.',
    'Владелец разрешил произвольную позицию для демонстрации; выбрана существующая позиция 4 мм, 1500×6000 мм.',
  ],
  methodReference: 'https://www.tatasteeluk.com/products/hot-rolled/durbar-floor-plate',
};
await fs.writeFile(`${directory}/annotations.json`, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({output, labels: placements.map(({key, text}) => ({key, text})), outsideOverlayChanges}, null, 2));
