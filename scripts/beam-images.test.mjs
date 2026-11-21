import assert from 'node:assert/strict';
import test from 'node:test';
import sharp from 'sharp';
import {renderBeamLabel} from '../imports/beam-image-template/labels.mjs';

const references = [
  ['local-115977', 'normalnaya'],
  ['local-115982', 'shirokopolochnaya'],
  ['local-110554', 'kolonnaya'],
  ['local-86552', 'monorelsovaya'],
];
const illustration = id => `public/images/catalog/product-illustrations/${id}.webp`;
const reference = folder => `public/images/catalog/balka/${folder}/balka_${folder}_2400_1800_marked.jpg`;
const clean = profile => {
  const folder = {'30b1': 'normalnaya', '30sh1': 'shirokopolochnaya', '30k1': 'kolonnaya', '30m': 'monorelsovaya'}[profile];
  return `public/images/catalog/balka/${folder}/balka_${folder}_2400_1800_original.jpg`;
};

function pixels(file, region) {
  const image = sharp(file).toColourspace('srgb').removeAlpha();
  return (region ? image.extract(region) : image).raw().toBuffer();
}

// Compare the published inscription, including its cleared background, to the
// expected lettering. This checks the WebP itself independently of the render log.
async function expectLabel(id, cleanPhoto, kind, text, x, y, region) {
  const {data, info} = await renderBeamLabel(kind, text);
  region ??= {left: x, top: y, width: info.width, height: info.height};
  const background = await pixels(cleanPhoto, region);
  const expected = await sharp(background, {raw: {width: region.width, height: region.height, channels: 3}})
    .composite([{input: data, left: x - region.left, top: y - region.top}]).removeAlpha().raw().toBuffer();
  const actual = await pixels(illustration(id), region);
  assert.ok(actual.equals(expected), `${id}: ${text}`);
}

test('the four reference SKUs preserve every pixel of their supplied JPEGs', async () => {
  for (const [id, folder] of references) {
    const actual = await pixels(illustration(id));
    assert.ok(actual.equals(await pixels(reference(folder))), id);
  }
});

test('24М changes the profile and mass without breaking the height line beside its wall label', async () => {
  const id = 'local-69356';
  const file = illustration(id);
  const source = reference('monorelsovaya');
  const photo = clean('30m');
  await expectLabel(id, photo, 'title', '24М', 400, 130);
  await expectLabel(id, photo, 'mass', '38,3 кг/м', 608, 1633);
  // This strip crossed an overly wide background patch during a previous render.
  const heightLine = {left: 1031, top: 585, width: 5, height: 123};
  assert.ok((await pixels(file, heightLine)).equals(await pixels(source, heightLine)), 'broken height dimension line');
  const metal = {left: 1550, top: 720, width: 650, height: 410};
  assert.ok((await pixels(file, metal)).equals(await pixels(source, metal)), 'changed metal or cut face');
});

test('40Б1 illustrations distinguish the confirmed assortment from a steel-only standard', async () => {
  const photo = clean('30b1');
  const valueArea = {left: 596, top: 1621, width: 432, height: 80};
  await expectLabel('local-116009', photo, 'mass', '56,6 кг/м', 608, 1633, valueArea);
  await expectLabel('local-65599', photo, 'mass', '56,6 кг/м', 608, 1633, valueArea);
  await expectLabel('local-65599', photo, 'caption', 'Справочная масса', 132, 1632,
    {left: 115, top: 1621, width: 470, height: 80});
  // Check the web label independently of the footer: h/b/s/t have no numeric dimensions.
  for (const [id, text] of [['local-116009', '7 мм'], ['local-65599', 's']]) {
    const {info} = await renderBeamLabel('dimension', text);
    await expectLabel(id, photo, 'dimension', text, 1269 - info.width, 626);
  }
});

test('the wide-flange demo shows a family title and an unconfirmed profile with no numerical footer', async () => {
  const id = 'prd-012';
  const photo = clean('30sh1');
  await expectLabel(id, photo, 'title', 'широкополочная', 400, 146,
    {left: 389, top: 109, width: 1050, height: 132});
  await expectLabel(id, photo, 'caption', 'Профиль и размеры', 132, 1568);
  await expectLabel(id, photo, 'length', 'уточняются', 608, 1577);
  for (const area of [
    {left: 115, top: 1621, width: 470, height: 80},
    {left: 596, top: 1621, width: 432, height: 80},
  ]) assert.ok((await pixels(illustration(id), area)).equals(await pixels(photo, area)), 'demo mass row must be cleared');
});
