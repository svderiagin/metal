import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {readProjectData} from './project-data.mjs';

const cache = new Map();
const {productVariants} = readProjectData('data/products/index.ts', cache);
const {projectCartProduct, cartPricingVariant} = readProjectData('lib/cartProjection.ts', cache);
const {revalidateCartPrice} = readProjectData('lib/cartPricing.ts', cache);
const generated = JSON.parse(fs.readFileSync('data/cart-catalog.json', 'utf8'));
const plain = value => JSON.parse(JSON.stringify(value));

test('generated cart data stays an exact projection of the public catalog', () => {
  assert.deepEqual(generated.products, plain(productVariants.map(projectCartProduct)));
  for (const [key, file, name] of [
    ['categories', 'data/categories.ts', 'categories'],
    ['subcategories', 'data/subcategories.ts', 'subcategories'],
    ['types', 'data/productTypes.ts', 'productTypes'],
  ]) {
    assert.deepEqual(generated[key], plain(readProjectData(file, cache)[name].map(({id, slug}) => ({id, slug}))));
  }
});

test('compact cart data preserves authoritative pricing and validation for every product', () => {
  for (const product of productVariants) {
    const compact = cartPricingVariant(projectCartProduct(product));
    const inputs = [0, .5, 1, 5, 999, 1000].map(quantity => ({quantity}));
    inputs.push({quantity: 12, pieceOrder: {pieces: 2, lengthMeters: product.lengthMeters ?? 6}});
    for (const inputMode of ['meter', 'ton']) {
      inputs.push({quantity: 12, measurement: {inputMode, meters: 12, weightTons: .1}});
    }
    for (const input of inputs) {
      assert.deepEqual(plain(revalidateCartPrice(compact, input)), plain(revalidateCartPrice(product, input)), product.id);
    }
  }
});
