import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import test from 'node:test';
import sharp from 'sharp';
import {readProjectData} from './project-data.mjs';

const cache = new Map();
const {productVariants} = readProjectData('data/products/index.ts', cache);
const {getProductIllustration} = readProjectData('lib/productPreviewImage.ts', cache);
const {results} = JSON.parse(readFileSync('imports/electrowelded-image-template/rendered.json', 'utf8'));
const products = productVariants.filter(product => ['cat-trk-sub-2', 'cat-trk-sub-4'].includes(product.subcategoryId));

test('all electrowelded rows use full-resolution JPGs made from their respective VGP original', async () => {
  assert.equal(products.length, 21);
  assert.deepEqual(new Set(results.map(result => result.id)), new Set(products.map(product => product.id)));
  const crop = {left: 1700, top: 600, width: 450, height: 500};
  for (const product of products) {
    const image = getProductIllustration(product);
    const result = results.find(item => item.id === product.id);
    assert.equal(`public${image.imageUrl}`, result.output);
    assert.equal(`public${image.photoUrl}`, result.source);
    const meta = await sharp(result.output).metadata();
    assert.deepEqual([meta.format, meta.width, meta.height, meta.chromaSubsampling], ['jpeg', 2400, 1800, '4:4:4']);
    assert.equal(result.changedOutsideAnnotationsBeforeJpegEncoding, 0, product.id);
    const source = await sharp(result.source).extract(crop).removeAlpha().raw().toBuffer();
    const actual = await sharp(result.output).extract(crop).removeAlpha().raw().toBuffer();
    let totalDifference = 0;
    for (let i = 0; i < source.length; i++) totalDifference += Math.abs(source[i] - actual[i]);
    assert.ok(totalDifference / source.length < 1, `${product.id}: photograph changed beyond JPG encoding noise`);
  }
});

test('range lengths stay ranges and archived legacy rows have no public illustrations', () => {
  const byId = Object.fromEntries(results.map(result => [result.id, result]));
  for (const id of ['local-58627', 'local-58631', 'local-58634']) assert.equal(byId[id].lengthLabel, '11–12 м');
  assert.equal(byId['local-125936'].lengthLabel, '6 м');
  assert.equal(byId['local-443'].weightPerMeterKg, 7.38);
  for (const id of ['prd-073', 'prd-074']) {
    assert.equal(byId[id], undefined);
    assert.equal(products.find(product => product.id === id), undefined);
  }
});

test('regenerating the largest section preserves source pixels before JPG encoding', async () => {
  execFileSync(process.execPath, ['scripts/render-electrowelded-images.mjs', '--preview', 'local-58634']);
  const preview = JSON.parse(readFileSync('.tmp/electrowelded-original-qa/rendered.json', 'utf8')).results[0];
  assert.deepEqual(preview.title, ['Труба электросварная 325 × 10']);
  assert.equal(preview.weightPerMeterKg, 77.68);
  assert.equal(preview.changedOutsideAnnotationsBeforeJpegEncoding, 0);
  assert.ok(preview.annotatedPixels < 2400 * 1800 * 0.03, 'annotation must not cover the product surface');
  assert.ok((await sharp(preview.output).raw().toBuffer()).equals(await sharp(results.find(result => result.id === preview.id).output).raw().toBuffer()));
});
