import assert from 'node:assert/strict';
import test from 'node:test';
import sharp from 'sharp';
import {readProjectData} from './project-data.mjs';
import {renderBeamLabel} from '../imports/beam-image-template/labels.mjs';

const cache = new Map();
const {getAllProductVariants} = readProjectData('lib/catalog.ts', cache);
const {getProductIllustration} = readProjectData('lib/productPreviewImage.ts', cache);
const pipes = getAllProductVariants().filter(product => product.productTypeId === 'type-cat-trk-sub-1');
const template = '/images/catalog/truba-kruglaya/vgp/truba_vgp_2400_1800';
const width = 2400, height = 1800;
const title = {left: 704, top: 112, width: 440, height: 105};
const wall = {left: 755, top: 680, width: 102, height: 68};
const diameter = {left: 1160, top: 1435, width: 355, height: 80};
const length = {left: 602, top: 1558, width: 170, height: 51};
const mass = {left: 602, top: 1623, width: 345, height: 62};

function pixels(file, area) {
  const image = sharp(file).toColourspace('srgb').removeAlpha();
  return (area ? image.extract(area) : image).raw().toBuffer();
}

test('all VGP variants keep the owner’s photograph and arrows outside the five variable inscriptions', async () => {
  const expected = await pixels(`public${template}_marked.jpg`);
  const variable = Buffer.alloc(width * height);
  for (const box of [title, wall, diameter, length, mass]) {
    for (let y = box.top; y < box.top + box.height; y++) {
      variable.fill(1, y * width + box.left, y * width + box.left + box.width);
    }
  }
  assert.equal(pipes.length, 7);
  for (const pipe of pipes) {
    const illustration = getProductIllustration(pipe);
    assert.equal(illustration?.photoUrl, `${template}_original.jpg`, pipe.id);
    const actual = await pixels(`public${illustration.imageUrl}`);
    assert.equal(actual.length, expected.length, pipe.id);
    for (let p = 0; p < variable.length; p++) {
      if (variable[p]) continue;
      const i = 3 * p;
      if (actual[i] !== expected[i] || actual[i + 1] !== expected[i + 1] || actual[i + 2] !== expected[i + 2]) {
        assert.fail(`${pipe.id}: unexpected change at (${p % width}, ${Math.floor(p / width)})`);
      }
    }
  }
});

test('the diameter dimension on each published pipe shows its physical outer diameter, including Ду15', async () => {
  for (const pipe of pipes) {
    const text = `Ø ${pipe.diameterMm.toLocaleString('ru-RU')} мм`;
    const label = await renderBeamLabel('dimension', text);
    const area = {left: Math.round(1337 - label.info.width / 2), top: 1453, width: label.info.width, height: label.info.height};
    const alpha = await sharp(label.data).extractChannel('alpha').raw().toBuffer();
    const actual = await pixels(`public${getProductIllustration(pipe).imageUrl}`, area);
    // Compare solid ink and empty spaces against the expected glyph outlines,
    // allowing the photograph's brightness to vary through antialiased edges.
    for (let p = 0; p < alpha.length; p++) {
      if ((alpha[p] > 245 && actual[3 * p] > 110) || (alpha[p] < 5 && actual[3 * p] < 175)) {
        assert.fail(`${pipe.id}: diameter lettering differs from “${text}”`);
      }
    }
  }
});

test('variant titles, wall thicknesses, lengths and masses match their SKU on the published image', async () => {
  const number = new Intl.NumberFormat('ru-RU');
  for (const pipe of pipes) {
    const file = `public${getProductIllustration(pipe).imageUrl}`;
    const thickness = number.format(pipe.wallThicknessMm);
    const fields = [
      [title, 'title', `${pipe.nominalBoreMm} x ${thickness}`, '15 x 2,8', 707, 126],
      [wall, 'dimension', thickness, '2,8', null, 689],
      [length, 'length', `${pipe.lengthMeters} м`, '6 м', 611, 1567],
      [mass, 'mass', `${number.format(pipe.weightPerMeterKg)} кг/м`, '1,28 кг/м', 611, 1633],
    ];
    for (const [area, style, text, referenceText, anchor, top] of fields) {
      let expected;
      if (text === referenceText) {
        expected = await pixels(`public${template}_marked.jpg`, area);
      } else {
        const background = await pixels(`public${template}_original.jpg`, area);
        const label = await renderBeamLabel(style, text);
        const left = anchor ?? 846 - label.info.width;
        expected = await sharp(background, {raw: {width: area.width, height: area.height, channels: 3}})
          .composite([{input: label.data, left: left - area.left, top: top - area.top}]).removeAlpha().raw().toBuffer();
      }
      assert.ok(expected.equals(await pixels(file, area)), `${pipe.id}: ${text}`);
    }
  }
});
