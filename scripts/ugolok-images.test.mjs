import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import sharp from 'sharp';
import {readProjectData} from './project-data.mjs';

const source = JSON.parse(fs.readFileSync('data/rozmet-catalog.json', 'utf8'));
const mapping = JSON.parse(fs.readFileSync('data/angle-images.json', 'utf8'));
const manifest = JSON.parse(fs.readFileSync('imports/ugolok-image-template/rendered.json', 'utf8'));
const {productVariants} = readProjectData('data/products/index.ts');
const {formatAngleSpecificationValue} = readProjectData('lib/anglePresentation.ts');
const angles = productVariants.filter(p => p.categoryId === 'rozmet-cat-ugolok');

test('all 22 angles preserve supplier values with approved illustrations and display mass labels', () => {
  assert.equal(angles.length, 22);
  assert.equal(Object.keys(mapping.products).length, angles.length);
  assert.equal(new Set(angles.map(p => p.imageUrls[0])).size, angles.length);
  for (const product of angles) {
    const {imageUrls, ...actual} = product;
    const original = source.products.find(p => p.id === product.id);
    const {imageUrls: originalImages, ...expected} = original;
    assert.ok(originalImages.length);
    assert.deepEqual(JSON.parse(JSON.stringify(actual)), {...expected, specifications: expected.specifications.map(item =>
      item.name === 'Вес' ? {...item, name:'Теоретическая масса'} : item)}, product.id);
    assert.equal(mapping.products[product.id].sourceUrl, product.sourceReference);
    assert.equal(imageUrls.length, 1);
    assert.equal(imageUrls[0], mapping.products[product.id].imageUrl);
    assert.ok(fs.existsSync(`public${imageUrls[0]}`));
  }
});

test('labels use catalog mass and length, and preserve distinct legs for unequal angles', () => {
  const labels = profile => Object.fromEntries(manifest.records.find(r => r.profile === profile).labels.map(l => [l.key, l.text]));
  for (const product of angles) {
    const record = manifest.records.find(r => r.id === product.id);
    const values = labels(record.profile);
    assert.equal(values.mass, formatAngleSpecificationValue(product.specifications.find(s => s.name === 'Теоретическая масса').value));
    assert.equal(values.length, formatAngleSpecificationValue(product.specifications.find(s => s.name === 'Размер').value));
  }
  const smallest = labels('25x25x3');
  assert.equal(smallest.mass, '1,12\u00a0кг/м');
  assert.equal(smallest.length, '6\u00a0м');
  const unequal = labels('100x63x6');
  assert.equal(unequal.firstLeg, '100\u00a0мм');
  assert.equal(unequal.secondLeg, '63\u00a0мм');
  assert.equal(unequal.thickness, '6\u00a0мм');
  assert.equal(unequal.mass, '7,52\u00a0кг/м');
  assert.equal(labels('160x100x10').length, '12\u00a0м');
});

test('every 2400 × 1800 lossless illustration preserves the reference outside changed label regions', async () => {
  const reference = await sharp(manifest.reference).removeAlpha().raw().toBuffer({resolveWithObject: true});
  assert.equal(manifest.records.length, angles.length);
  for (const record of manifest.records) {
    const rendered = await sharp(`public${record.imageUrl}`).removeAlpha().raw().toBuffer({resolveWithObject: true});
    assert.equal(rendered.info.width, 2400, record.id);
    assert.equal(rendered.info.height, 1800, record.id);
    assert.equal(rendered.info.channels, 3);
    const allowed = Buffer.alloc(2400 * 1800);
    for (const key of record.changedLabels) {
      const box = manifest.patches[key];
      for (let y = box.top; y < box.top + box.height; y++) allowed.fill(1, y * 2400 + box.left, y * 2400 + box.left + box.width);
    }
    let changes = 0;
    for (let p = 0; p < allowed.length; p++) if (!allowed[p] && (reference.data[p * 3] !== rendered.data[p * 3] || reference.data[p * 3 + 1] !== rendered.data[p * 3 + 1] || reference.data[p * 3 + 2] !== rendered.data[p * 3 + 2])) changes++;
    assert.equal(changes, 0, record.id);
  }
});
