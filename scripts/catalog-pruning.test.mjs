import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {readProjectData} from './project-data.mjs';

const allowed = [
  ['cat-arm', 'Арматура', 'armatura'],
  ['cat-trp', 'Трубы профильные', 'truby-profilnye'],
  ['cat-trk', 'Труба круглая', 'truba-kruglaya'],
  ['cat-pnf', 'Профнастил', 'profnastil'],
  ['cat-mesh', 'Сетка металлическая', 'setka-metallicheskaya'],
  ['cat-bal', 'Балка', 'balka'],
];
const allowedIds = new Set(allowed.map(([id]) => id));
const snapshot = JSON.parse(fs.readFileSync('imports/protected-catalog.snapshot.json', 'utf8'));
const {categories, originalCategories} = readProjectData('data/categories.ts');
const {subcategories, originalSubcategories} = readProjectData('data/subcategories.ts');
const {productVariants} = readProjectData('data/products/index.ts');
const catalog = readProjectData('lib/catalog.ts');

test('catalog exposes only the six retained categories in their current order', () => {
  assert.deepEqual(Array.from(categories, category => [category.id, category.name, category.slug]), allowed);
  assert.deepEqual(Array.from(originalCategories, category => category.id), allowed.map(([id]) => id));
  assert.ok(subcategories.every(subcategory => allowedIds.has(subcategory.categoryId)));
  assert.ok(originalSubcategories.every(subcategory => allowedIds.has(subcategory.categoryId)));
  assert.ok(productVariants.every(product => allowedIds.has(product.categoryId)));
});

test('retained categories, subcategories and products are byte-for-byte unchanged', () => {
  assert.equal(JSON.stringify(categories), JSON.stringify(snapshot.categories));
  assert.equal(JSON.stringify(subcategories), JSON.stringify(snapshot.subcategories));
  assert.equal(JSON.stringify(productVariants), JSON.stringify(snapshot.products));
});

test('removed category routes cannot be resolved by the catalog', () => {
  for (const slug of ['katanka', 'kvadrat', 'krug', 'listovoy-prokat', 'otvody', 'polosa', 'provoloka', 'truby-nerzhaveyushchie', 'ugolok', 'shveller', 'shestigrannik', 'tsvetnoy-metalloprokat']) {
    assert.equal(catalog.getCategoryBySlug(slug), undefined, slug);
  }
  assert.equal(categories.length, 6);
  assert.equal(subcategories.length, 20);
  assert.equal(productVariants.length, 240);
});
