import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import sharp from 'sharp';
import {assertReferencePixels} from './image-pixel-assertions.mjs';

const labelBox = {left: 125, top: 1550, width: 1150, height: 160};
for (const [name, image] of [
  ['shveller-6-5', 'public/images/catalog/shveller/shveller-6-5-clean.webp'],
  ['ugolok-160x100x10', 'public/images/catalog/ugolok/ugolok-160x100x10-clean.webp'],
  ['kvadrat-12x12', 'public/images/catalog/kvadrat/kvadrat-12x12-clean.webp'],
]) {
  test(`${name}: native-size generated length/mass labels match the reviewed visual baseline`, async () => {
    const actual = await sharp(image).extract(labelBox).removeAlpha().raw().toBuffer();
    const expected = await sharp(`tests/visual/label-baselines/${name}.png`).removeAlpha().raw().toBuffer({resolveWithObject: true});
    assert.equal(expected.info.width, labelBox.width);
    assert.equal(expected.info.height, labelBox.height);
    const matches = actual.equals(expected.data);
    if (!matches) {
      await fs.mkdir('.tmp/catalog-image-qa', {recursive: true});
      await sharp(image).extract(labelBox).png().toFile(`.tmp/catalog-image-qa/${name}-actual.png`);
    }
    assert.equal(matches, true, `Compare tests/visual/label-baselines/${name}.png with .tmp/catalog-image-qa/${name}-actual.png at 1:1; review against the source before updating the baseline.`);
  });
}

test('all 14 channel illustrations preserve the photo outside their variable label regions', async () => {
  const manifest = JSON.parse(await fs.readFile('imports/shveller-image-template/rendered.json', 'utf8'));
  assert.equal(manifest.records.length, 14);
  await assertReferencePixels(manifest, 'rozmet-2235');
});
