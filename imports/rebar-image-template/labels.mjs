import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';
import {renderBeamLabel} from '../beam-image-template/labels.mjs';

const canvas = {width: 2400, height: 1800, channels: 3};
const photos = new URL('../../public/images/catalog/armatura/', import.meta.url);
const profiles = {
  smooth: {
    marked: 'gladkaya/armatura_gladkaya_2400_1800_marked.jpg',
    clean: 'gladkaya/armatura_gladkaya_2400_1800_original.webp',
    title: 'Арматура гладкая А240 Ø 6 мм',
    titleWidth: 1350, titleBaseline: 186, maxTitleWidth: 1800,
    supplyLabel: 'Длина по каталогу', supplyValue: '6 м',
    axisX: 1494.5, axisY: 1367, gapLeft: 1421, gapRight: 1568, armLimit: 155,
  },
  ribbed: {
    marked: 'riflenaya/armatura_reflenaya_2400_1800_marked.jpg',
    clean: 'riflenaya/armatura_reflenaya_1448_1086_original.jpg',
    title: 'Арматура рифлёная А500 Ø 6 мм',
    titleWidth: 1430, titleBaseline: 187, maxTitleWidth: 1680,
    supplyLabel: 'Форма поставки', supplyValue: 'В бунтах',
    axisX: 1273.5, axisY: 1417, gapLeft: 1200, gapRight: 1347, armLimit: 178,
  },
};

const templates = new Map();
async function pixels(filename) {
  const source = sharp(fileURLToPath(new URL(filename, photos)));
  const {width, height} = await source.metadata();
  assert.equal(width * canvas.height, height * canvas.width, filename);
  return source.resize(canvas.width, canvas.height).toColourspace('srgb').removeAlpha().raw().toBuffer();
}

function restore(base, clean, left, top, width, height) {
  for (let y = top; y < top + height; y++) {
    const offset = (y * canvas.width + left) * canvas.channels;
    clean.copy(base, offset, offset, offset + width * canvas.channels);
  }
}

/** Complete Russian display strings, including units. Empty footer strings omit that row. */
export async function renderRebarImage({profile, title, diameter, supplyLabel, supplyValue, mass}) {
  const spec = profiles[profile];
  assert.ok(spec && title && diameter, 'Profile, title and diameter are required');
  assert.equal(Boolean(supplyLabel), Boolean(supplyValue), 'Supply caption and value must form a pair');
  if (!templates.has(profile)) templates.set(profile, Promise.all([pixels(spec.marked), pixels(spec.clean)]));
  const [marked, clean] = await templates.get(profile);
  const base = Buffer.from(marked);
  const layers = [];
  async function field(style, text, original, box, left, top, maxWidth) {
    if (text === original) return;
    restore(base, clean, ...box);
    if (!text) return;
    const {data, info} = await renderBeamLabel(style, text);
    // Long steel grades have to clear the photographed rod in the upper right.
    const input = info.width <= maxWidth ? data : await sharp(data).resize({width: maxWidth}).png().toBuffer();
    // Every title begins «Арматура». Its р/у descenders occupy the same
    // 19 pixels below the baseline even when brackets raise the top of the run.
    const scale = Math.min(1, maxWidth / info.width);
    const y = style === 'title' ? top - Math.round((info.height - 19) * scale) : top;
    layers.push({input, left, top: y});
  }

  await field('title', title, spec.title, [121, 111, spec.titleWidth, 106], 131, spec.titleBaseline, spec.maxTitleWidth);
  await field('caption', supplyLabel, spec.supplyLabel, [122, 1556, 403, 58], 131, 1566, 450);
  await field('length', supplyValue, spec.supplyValue, [601, 1556, 204, 58], 611, 1567, 580);
  if (!mass) restore(base, clean, 121, 1624, 459, 59);
  await field('mass', mass, '0,222 кг/м', [601, 1624, 239, 59], 611, 1633, 580);

  if (diameter !== '6 мм') {
    const {data, info} = await renderBeamLabel('dimension', diameter);
    const left = Math.round(spec.axisX - info.width / 2);
    const gapLeft = left - 10;
    const gapRight = left + info.width + 10;
    assert.ok(spec.axisX - gapLeft < spec.armLimit && gapRight - spec.axisX < spec.armLimit,
      `Diameter label would overlap the arrowheads: ${diameter}`);
    const start = Math.min(spec.gapLeft, gapLeft);
    const end = Math.max(spec.gapRight, gapRight);
    restore(base, clean, start, spec.axisY - 35, end - start, 70);

    // Retain the original arrowheads. Extend only the line exposed by a shorter label.
    const span = (from, to) => {
      if (to <= from) return;
      layers.push({input: {create: {width: to - from, height: 4, channels: 3, background: '#59636f'}},
        left: from, top: spec.axisY - 2});
    };
    span(start, gapLeft);
    span(gapRight, end);
    layers.push({input: data, left, top: Math.round(spec.axisY - info.height / 2)});
  }
  return sharp(base, {raw: canvas}).composite(layers).png({compressionLevel: 3}).toBuffer();
}
