import test from 'node:test';
import assert from 'node:assert/strict';
import {readProjectData} from './project-data.mjs';

const {productVariants} = readProjectData('data/products/index.ts');
const catalog = readProjectData('lib/catalog.ts');
const {metersToTons, tonsToMeters, calculateLineTotal} = readProjectData('lib/orderMeasurement.ts');
const channels = productVariants.filter(product => product.categoryId === 'cat-shv');

test('channel category exposes two canonical subcategories and exactly 31 unique rows', () => {
  const subcategories = catalog.getSubcategoriesByCategoryId('cat-shv');
  assert.deepEqual(Array.from(subcategories, item => item.name), ['Швеллер горячекатаный', 'Швеллер гнутый']);
  assert.equal(channels.length, 31);
  assert.equal(new Set(channels.map(product => product.id)).size, 31);
  assert.equal(new Set(channels.map(product => product.name)).size, 31);
  assert.equal(channels.filter(product => product.subcategoryId === 'cat-shv-sub-1').length, 20);
  assert.equal(channels.filter(product => product.subcategoryId === 'cat-shv-sub-2').length, 11);
});

test('hot-rolled channel assortment has fourteen ordinary and six 09G2S positions', () => {
  const rows = channels.filter(product => product.subcategoryId === 'cat-shv-sub-1');
  assert.equal(rows.filter(product => product.steelGrade === '09Г2С').length, 6);
  assert.equal(rows.filter(product => product.steelGrade === undefined).length, 14);
  assert.deepEqual(
    Array.from(new Set(rows.map(product => product.standard))),
    ['ГОСТ 8240-97'],
  );
  assert.ok(rows.every(product => product.channelNumber >= 8 && product.channelNumber <= 20));
  assert.ok(rows.every(product => ['П', 'У'].includes(product.channelSeries)));
});

test('bent channel dimensions, wall thicknesses and nominal masses match the supplied table', () => {
  const rows = channels.filter(product => product.subcategoryId === 'cat-shv-sub-2');
  const actual = rows.map(product => [
    `${product.profileHeightMm}×${product.profileWidthMm}×${String(product.wallThicknessMm).replace('.', ',')}`,
    product.weightPerMeterKg,
  ]);
  assert.deepEqual(Array.from(actual), [
    ['50×40×3', 2.81], ['60×32×2,5', 2.26], ['60×32×4', 3.43],
    ['60×40×3', 3.04], ['80×40×3', 3.51], ['80×50×4', 5.18],
    ['80×60×4', 5.81], ['100×50×3', 4.47], ['100×50×4', 5.81],
    ['120×50×3', 4.91], ['120×50×4', 6.44],
  ]);
  assert.ok(rows.every(product => product.standard === 'ГОСТ 8278-83'));
});

test('new channel rows do not invent price, length or stock; existing supplier offers retain them', () => {
  const priced = channels.filter(product => product.price !== null);
  assert.equal(priced.length, 7);
  assert.ok(priced.every(product => product.priceConfirmed && product.lengthMeters === 12));
  assert.ok(channels.every(product => product.availability === 'UNKNOWN' && !product.inStock));
  for (const product of channels.filter(product => product.price === null)) {
    assert.equal(product.pricePerTon, undefined);
    assert.equal(product.quoteOnly, true);
    if (product.id !== 'local--967') assert.equal(product.lengthMeters, undefined);
  }
});

test('channel metre, tonne and price calculations retain full conversion precision', () => {
  for (const product of channels) {
    const tons = metersToTons(123.45, product.weightPerMeterKg);
    assert.ok(Math.abs(tonsToMeters(tons, product.weightPerMeterKg) - 123.45) < 1e-9);
    if (product.pricePerTon === undefined) continue;
    assert.equal(calculateLineTotal(tons, product.pricePerTon), Math.round(tons * product.pricePerTon * 100) / 100);
  }
});

test('channel names, steel grade and exact bent dimensions work in catalog search', () => {
  const {createCatalogSearchIndex} = readProjectData('lib/search/index.ts');
  const search = createCatalogSearchIndex(channels);
  assert.equal(search.search('09Г2С').total, 6);
  assert.equal(search.search('швеллер 8У').hits[0].product.name, 'Швеллер 8У');
  assert.equal(search.search('60x32x2.5').hits[0].product.name, 'Швеллер гнутый 60×32×2,5');
  assert.equal(search.search('120×50×4').hits[0].product.name, 'Швеллер гнутый 120×50×4');
});
