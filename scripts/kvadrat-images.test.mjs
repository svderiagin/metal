import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import sharp from 'sharp';
import {readProjectData} from './project-data.mjs';

const source = JSON.parse(fs.readFileSync('data/rozmet-catalog.json', 'utf8'));
const mapping = JSON.parse(fs.readFileSync('data/square-images.json', 'utf8'));
const manifest = JSON.parse(fs.readFileSync('imports/kvadrat-image-template/rendered.json', 'utf8'));
const {productVariants} = readProjectData('data/products/index.ts');
const {getSquareProductParameters, getSquareProductSpecifications} = readProjectData('lib/squarePresentation.ts');
const {getVariantAttribute, getVariantFilterKeys} = readProjectData('lib/variantPresentation.ts');
const squares = productVariants.filter(p => p.categoryId === 'rozmet-cat-kvadrat');

test('all seven squares have distinct illustrations without changing source product fields', () => {
  assert.equal(squares.length, 7);
  assert.equal(Object.keys(mapping.products).length, squares.length);
  assert.equal(new Set(squares.map(p => p.imageUrls[0])).size, squares.length);
  for (const product of squares) {
    const {imageUrls, ...actual} = product;
    const {imageUrls: originalImages, ...expected} = source.products.find(p => p.id === product.id);
    assert.ok(originalImages.length);
    assert.deepEqual(actual, expected, product.id);
    assert.equal(imageUrls.length, 1);
    assert.equal(imageUrls[0], mapping.products[product.id].imageUrl);
    assert.equal(mapping.products[product.id].sourceUrl, product.sourceReference);
  }
});

test('square table, filters and image labels agree on section, catalog length and mass', () => {
  assert.equal(JSON.stringify(getVariantFilterKeys('kvadrat')), JSON.stringify(['size', 'length']));
  assert.equal(new Set(squares.map(p => getVariantAttribute(p, 'size'))).size, 7, 'the section filter must not use supplier length as section');
  for (const product of squares) {
    const parameters = getSquareProductParameters(product);
    const values = Object.fromEntries(manifest.records.find(r => r.id === product.id).labels.map(l => [l.key, l.text]));
    const specs = getSquareProductSpecifications(product);
    assert.equal(specs.find(s => s.name === 'Сечение').value, parameters.section);
    assert.equal(specs.find(s => s.name === 'Теоретическая масса').value, values.mass);
    assert.equal(values.height, parameters.dimension);
    assert.equal(values.width, parameters.dimension);
    assert.equal(values.length, '6\u00a0м');
    assert.equal(getVariantAttribute(product, 'length'), values.length);
    assert.equal(getVariantAttribute(product, 'size'), parameters.section);
  }
  const sixteen = getSquareProductParameters(squares.find(p => p.id === 'rozmet-26579'));
  assert.equal(sixteen.mass, '1,54\u00a0кг/м', 'do not silently replace supplier mass with a formula');
  assert.equal(getSquareProductParameters({...squares[0], name: 'Нет номера'}), null);
});

test('2400 × 1800 square images preserve all pixels outside the variable-label regions', async () => {
  const reference = await sharp(manifest.reference).removeAlpha().raw().toBuffer();
  assert.equal(manifest.records.length, squares.length);
  for (const record of manifest.records) {
    const rendered = await sharp(`public${record.imageUrl}`).removeAlpha().raw().toBuffer({resolveWithObject: true});
    assert.equal(rendered.info.width, 2400);
    assert.equal(rendered.info.height, 1800);
    assert.equal(rendered.info.channels, 3);
    const allowed = Buffer.alloc(2400 * 1800);
    for (const key of record.changedLabels) {
      const box = manifest.patches[key];
      for (let y = box.top; y < box.top + box.height; y++) allowed.fill(1, y * 2400 + box.left, y * 2400 + box.left + box.width);
    }
    let changed = 0;
    for (let p = 0; p < allowed.length; p++) if (!allowed[p] && (reference[p * 3] !== rendered.data[p * 3] || reference[p * 3 + 1] !== rendered.data[p * 3 + 1] || reference[p * 3 + 2] !== rendered.data[p * 3 + 2])) changed++;
    assert.equal(changed, 0, record.id);
    if (record.profile === '8x8') {
      assert.equal(record.referenceUnmodified, true);
      assert.equal(reference.equals(rendered.data), true);
    }
  }
});
