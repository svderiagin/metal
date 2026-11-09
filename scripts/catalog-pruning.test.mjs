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
const removedSupplierSlugs = ['provoloka-ok', 'stulchik', 'zaglushki-dlya-trub', 'armaturnye-izdeliya', 'stroymaterialy', 'vintovye-svai', 'petli-dlya-vorot', 'otvodi'];

test('catalog exposes only the six retained categories in their current order', () => {
  assert.deepEqual(Array.from(categories.slice(0,6), category => [category.id, category.name, category.slug]), allowed);
  assert.deepEqual(Array.from(originalCategories, category => category.id), allowed.map(([id]) => id));
  assert.ok(subcategories.every(subcategory => allowedIds.has(subcategory.categoryId) || subcategory.id.startsWith('rozmet-sub-')));
  assert.ok(originalSubcategories.every(subcategory => allowedIds.has(subcategory.categoryId)));
  assert.ok(productVariants.every(product => allowedIds.has(product.categoryId) || product.id.startsWith('rozmet-')));
});

test('retained categories, subcategories and products are byte-for-byte unchanged', () => {
  assert.equal(JSON.stringify(categories.filter(category=>allowedIds.has(category.id))), JSON.stringify(snapshot.categories));
  assert.equal(JSON.stringify(subcategories.filter(subcategory=>allowedIds.has(subcategory.categoryId))), JSON.stringify(snapshot.subcategories));
  assert.equal(JSON.stringify(productVariants.filter(product=>allowedIds.has(product.categoryId))), JSON.stringify(snapshot.products));
});

test('removed category routes cannot be resolved by the catalog', () => {
  for (const slug of ['katanka', 'krug', 'otvody', 'provoloka', 'truby-nerzhaveyushchie', 'shestigrannik', 'tsvetnoy-metalloprokat', ...removedSupplierSlugs]) {
    assert.equal(catalog.getCategoryBySlug(slug), undefined, slug);
  }
  assert.equal(categories.filter(category=>allowedIds.has(category.id)).length, 6);
  assert.equal(subcategories.filter(subcategory=>allowedIds.has(subcategory.categoryId)).length, 20);
  assert.equal(productVariants.filter(product=>allowedIds.has(product.categoryId)).length, 240);
});

test('removed supplier families have no raw records, image mappings or source roots', () => {
  const removedIds = new Set(removedSupplierSlugs.map(slug => `rozmet-cat-${slug}`));
  const imported = JSON.parse(fs.readFileSync('data/rozmet-catalog.json', 'utf8'));
  const mapping = JSON.parse(fs.readFileSync('data/catalog-images.json', 'utf8'));
  const source = JSON.parse(fs.readFileSync('imports/rozmet-source.json', 'utf8'));
  const scope = JSON.parse(fs.readFileSync('data/rozmet-scope.json', 'utf8'));
  for (const category of imported.categories) assert.ok(!removedIds.has(category.id), category.id);
  for (const record of [...imported.subcategories, ...imported.products]) assert.ok(!removedIds.has(record.categoryId), record.id);
  for (const id of Object.keys(mapping.categories)) assert.ok(!removedIds.has(id), id);
  for (const root of source.roots) {
    const slug = new URL(root).pathname.split('/').filter(Boolean).at(-1).replaceAll('_', '-');
    assert.ok(!removedSupplierSlugs.includes(slug), slug);
    assert.ok(scope.categorySlugs.includes(slug), slug);
  }
});
