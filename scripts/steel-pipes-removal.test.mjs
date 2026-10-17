import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {readProjectData} from './project-data.mjs';

const cache = new Map();
const {categories} = readProjectData('data/categories.ts', cache);
const {subcategories} = readProjectData('data/subcategories.ts', cache);
const {productVariants} = readProjectData('data/products/index.ts', cache);
const removedCategoryId = ['cat', 'trs'].join('-');
const removedCategorySlug = ['truby', 'stalnye'].join('-');

test('the removed steel-pipe category has no public category, families or products', () => {
  assert.equal(categories.some(category => category.id === removedCategoryId || category.slug === removedCategorySlug), false);
  assert.equal(subcategories.some(subcategory => subcategory.categoryId === removedCategoryId), false);
  assert.equal(productVariants.some(product => product.categoryId === removedCategoryId), false);
});

test('round-pipe families keep their products under round-pipe identifiers', () => {
  assert.deepEqual(
    Array.from(subcategories.filter(subcategory => subcategory.categoryId === 'cat-trk'), subcategory => subcategory.id),
    ['cat-trk-sub-1', 'cat-trk-sub-3', 'cat-trk-sub-2', 'cat-trk-sub-4'],
  );
  assert.equal(productVariants.filter(product => product.categoryId === 'cat-trk').length, 31);
});

test('obsolete category source, image and route are removed', () => {
  assert.equal(fs.existsSync(`data/products/${['truby', 'Stalnye'].join('')}.ts`), false);
  assert.equal(fs.existsSync(`public/images/catalog/${removedCategorySlug}.jpg`), false);
  assert.equal(fs.readFileSync('next.config.ts', 'utf8').includes(`/catalog/${removedCategorySlug}`), false);
});
