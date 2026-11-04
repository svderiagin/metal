import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import sharp from 'sharp';

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
  const reference = await sharp(manifest.reference).removeAlpha().raw().toBuffer();
  assert.equal(manifest.records.length, 14);
  for (const record of manifest.records) {
    const rendered = await sharp(`public${record.imageUrl}`).removeAlpha().raw().toBuffer({resolveWithObject: true});
    assert.equal(rendered.info.width, 2400, record.id);
    assert.equal(rendered.info.height, 1800, record.id);
    const allowed = Buffer.alloc(2400 * 1800);
    for (const key of record.changedLabels) {
      const box = manifest.patches[key];
      assert.ok(box.left >= 0 && box.top >= 0 && box.left + box.width <= 2400 && box.top + box.height <= 1800);
      for (let y = box.top; y < box.top + box.height; y++) allowed.fill(1, y * 2400 + box.left, y * 2400 + box.left + box.width);
    }
    let changed = 0;
    for (let p = 0; p < allowed.length; p++) if (!allowed[p] && (reference[p * 3] !== rendered.data[p * 3] || reference[p * 3 + 1] !== rendered.data[p * 3 + 1] || reference[p * 3 + 2] !== rendered.data[p * 3 + 2])) changed++;
    assert.equal(changed, 0, record.id);
    if (record.number === '5') assert.equal(reference.equals(rendered.data), true, 'preserve the approved No. 5 reference');
  }
});
