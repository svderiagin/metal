import assert from 'node:assert/strict';
import test from 'node:test';
import sharp from 'sharp';
import {readProjectData} from './project-data.mjs';
import {renderBeamLabel} from '../imports/beam-image-template/labels.mjs';

const cache = new Map();
const {getAllProductVariants} = readProjectData('lib/catalog.ts', cache);
const {getProductIllustration, productIllustrationSignature} = readProjectData('lib/productPreviewImage.ts', cache);
const strips = getAllProductVariants().filter(product => product.categoryId === 'rozmet-cat-polosa');
const originalUrl = '/images/catalog/polosa/polosa_stalnaya_1448_1086_original.png';
const marked = 'public/images/catalog/polosa/polosa_stalnaya_2400_1800_marked.jpg';
const width = 2400, height = 1800;
const fields = {
  title: [846, 90, 600, 140],
  width: [1135, 1304, 330, 67],
  thickness: [555, 996, 136, 68],
  length: [598, 1548, 270, 70],
  mass: [598, 1618, 265, 78],
};
// Kilograms per metre, rounded to the precision of the supplied 20×4 label.
const massBySection = {
  '20×4': '0,63', '25×4': '0,79', '30×4': '0,94', '40×3': '0,94', '40×4': '1,26',
  '40×5': '1,57', '50×4': '1,57', '50×5': '1,96', '60×5': '2,36', '60×6': '2,83',
  '80×4': '2,51', '80×5': '3,14', '80×6': '3,77', '80×8': '5,02', '80×10': '6,28',
  '100×4': '3,14', '100×6': '4,71', '100×8': '6,28', '100×10': '7,85',
};

async function pixels(file) {
  const {data, info} = await sharp(file).toColourspace('srgb').removeAlpha().raw().toBuffer({resolveWithObject: true});
  assert.deepEqual([info.width, info.height, info.channels], [width, height, 3], file);
  return data;
}

function clearInscriptions(data) {
  for (const [x, y, w, h] of Object.values(fields)) {
    for (let row = y; row < y + h; row++) {
      const start = (row * width + x) * 3;
      data.fill(0, start, start + w * 3);
    }
  }
}

async function checkInscriptions(actual, reference, strip) {
  const section = /^Полоса стальная (\d+)×(\d+) мм$/u.exec(strip.name);
  assert.ok(section, strip.name);
  const [, w, t] = section;
  const mass = massBySection[`${w}×${t}`];
  assert.ok(mass, strip.name);
  const labels = [
    ['title', 'title', `${w} x ${t}`, '20 x 4', 126],
    ['width', 'dimension', w + ' мм', '20 мм', 1317],
    ['thickness', 'dimension', t, '4', 1010],
    ['length', 'length', w === '100' && t === '4' ? '5,85–6 м' : '6 м', '6 м', 1567],
    ['mass', 'mass', mass + ' кг/м', '0,63 кг/м', 1634],
  ];
  for (const [field, kind, text, original, top] of labels) {
    const [x, y, boxWidth, boxHeight] = fields[field];
    if (text === original) {
      for (let row = y; row < y + boxHeight; row++) {
        const start = (row * width + x) * 3, end = start + boxWidth * 3;
        assert.ok(actual.subarray(start, end).equals(reference.subarray(start, end)), `${strip.id}: ${field} should match the reference`);
      }
      continue;
    }
    const label = await renderBeamLabel(kind, text);
    const alpha = await sharp(label.data).extractChannel('alpha').raw().toBuffer();
    const leftByField = {title: 865, width: 1299 - Math.round(label.info.width / 2), thickness: 676 - label.info.width, length: 611, mass: 611};
    const left = leftByField[field];
    if (field === 'title') {
      // Both sides of the title patch share the same soft highlight between words.
      const edge = (138 * width + x) * 3;
      assert.ok(Math.abs(actual[edge] - actual[edge - 3]) <= 1, `${strip.id}: visible seam in the title backing`);
    }
    if (field === 'width') {
      const line = 1337 * width;
      const stroke = reference[(line + 1120) * 3];
      for (let col = x; col < x + boxWidth; col++) {
        if (col < left - 10 || col > left + label.info.width + 10) {
          assert.equal(actual[(line + col) * 3], stroke, `${strip.id}: broken width line at x=${col}`);
        }
      }
    }
    for (let row = y; row < y + boxHeight; row++) {
      for (let col = x; col < x + boxWidth; col++) {
        const dx = col - left, dy = row - top;
        // The horizontal width arrow is the only non-text ink in these patches.
        if (field === 'width' && row >= 1335 && row <= 1340 && (dx < 0 || dx >= label.info.width)) continue;
        const coverage = dx >= 0 && dy >= 0 && dx < label.info.width && dy < label.info.height ? alpha[dy * label.info.width + dx] : 0;
        const red = actual[(row * width + col) * 3];
        if ((coverage > 245 && red > 110) || (coverage < 5 && red < 175)) {
          assert.fail(`${strip.id}: expected “${text}” in ${field} at (${col}, ${row})`);
        }
      }
    }
  }
}

test('all 19 published flat bars preserve the owner’s marked image outside the variable labels', async () => {
  assert.equal(strips.length, 19);
  const reference = await pixels(marked);
  const maskedReference = Buffer.from(reference);
  clearInscriptions(maskedReference);
  for (const strip of strips) {
    const illustration = getProductIllustration(strip);
    assert.equal(illustration?.signature, productIllustrationSignature(strip), strip.id);
    assert.equal(illustration.photoUrl, originalUrl, strip.id);
    assert.equal(illustration.imageUrl, `/images/catalog/product-illustrations/${strip.id}.webp`, strip.id);
    const published = await pixels('public' + illustration.imageUrl);
    if (strip.id === 'rozmet-2168') assert.ok(published.equals(reference), '20×4 must reproduce the whole marked reference');
    await checkInscriptions(published, reference, strip);
    clearInscriptions(published);
    assert.ok(published.equals(maskedReference), `${strip.id}: change outside the five labels`);
  }
});
