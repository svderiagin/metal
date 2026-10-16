import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {randomBytes} from 'node:crypto';
import {readProjectData} from './project-data.mjs';

const cache = new Map();
const {normalizeCartItems, createCartLines} = readProjectData('lib/cart.ts', cache);
const {productVariants} = readProjectData('data/products/index.ts', cache);
const {calculateLineTotal, metersToTons, tonsToMeters} = readProjectData('lib/orderMeasurement.ts', cache);
const {revalidateCartPrice} = readProjectData('lib/cartPricing.ts', cache);
const {hasValidOrderAmount} = readProjectData('lib/server/payments.ts', cache);
const {comparePrices} = readProjectData('lib/catalogFilters.ts', cache);

function serverModule(file, mocks = {}) {
  const testModule = {exports: {}};
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020}}).outputText;
  vm.runInNewContext(source, {module:testModule, exports: testModule.exports, process: {env: {NODE_ENV: 'test'}}, Response,
    require: name => name in mocks ? mocks[name] : readProjectData(name.replace('@/', '') + '.ts', cache),
  });
  return testModule.exports;
}
const {createTrustedOrder} = serverModule('lib/server/orders.ts', {'node:crypto': {randomBytes}});

test('stored cart deduplicates IDs, validates unknown JSON and keeps fractional units', () => {
  const product = productVariants.find(p => p.price && p.unit === 'kg');
  const items = normalizeCartItems([null, 'broken', {productId:product.id, quantity:1}, {productId:product.id, quantity:.5}, {productId:'unknown', quantity:2}, {productId:'invalid', quantity:Infinity}]);
  assert.equal(items.length, 2);
  assert.equal(items[0].quantity, .5);
  const lines = createCartLines(items);
  assert.equal(lines[0].estimatedTotal, product.price * .5);
  assert.equal(lines[0].quantityUnit, 'кг');
  assert.ok(lines[1].invalidReason);
  assert.equal(lines[1].slug, '');
  assert.equal(normalizeCartItems({items}).length, 0);
});

test('server and cart share current measured prices and ignore cached money', () => {
  const product = productVariants.find(p => p.categoryId === 'cat-arm' && p.diameterMm === 12 && p.inStock);
  const measurement = {inputMode:'meter', meters:100, weightTons:999, pricePerTon:1, estimatedTotal:1};
  const [item] = normalizeCartItems([{productId:product.id, quantity:999, measurement}]);
  assert.equal(item.quantity, 100);
  const cart = revalidateCartPrice(product, item);
  assert.equal(cart.measurement.weightTons, .0888);
  const order = createTrustedOrder({items:[item], customer:{}, delivery:{}, paymentMethod:'CARD'});
  assert.equal(order.totalAmount, cart.estimatedTotal);
  assert.equal(order.items[0].quantity, 100);
  assert.equal(hasValidOrderAmount(order), true, 'metres must be priced by weight, not multiplied by a tonne price');
  order.items[0].subtotal += 1;
  assert.equal(hasValidOrderAmount(order), false);
});

test('payment amount uses per-line kopeck rounding for fractional quantities', () => {
  const items = [.333, .667].map(quantity => ({quantity, unitPrice:10.01, subtotal:calculateLineTotal(quantity, 10.01)}));
  assert.equal(hasValidOrderAmount({items, totalAmount:10.01}), true);
  assert.equal(hasValidOrderAmount({items, totalAmount:10.02}), false);
});

test('overflow and invalid quantities cannot become a zero-valued valid order', () => {
  assert.equal(calculateLineTotal(Number.MAX_VALUE, 100), null);
  assert.equal(metersToTons(Number.MAX_VALUE, 100), null);
  assert.equal(tonsToMeters(Number.MAX_VALUE, .888), null);
  const product = productVariants.find(p => p.pricePerTon && p.weightPerMeterKg);
  for (const quantity of [0, -1, Infinity, 1000]) assert.ok(revalidateCartPrice(product, {quantity}).invalidReason);
  assert.ok(revalidateCartPrice(product, {quantity:1, measurement:{inputMode:'meter', meters:Number.MAX_VALUE, weightTons:1}}).invalidReason);
});

test('unknown prices sort last in both price directions', () => {
  for (const descending of [false, true]) {
    const prices = [null, 200, undefined, 100].sort((a,b) => comparePrices(a,b,descending));
    assert.deepEqual(prices.slice(0,2), descending ? [200,100] : [100,200]);
  }
});

test('unconfigured contact and quote routes fail honestly in local development', async () => {
  for (const endpoint of ['contact','quote']) {
    const {POST} = serverModule(`app/api/${endpoint}/route.ts`);
    const response = await POST({json:async () => ({name:'Тест', email:'audit@example.invalid', phone:'+79000000000', message:'Локальная проверка', consent:true})});
    assert.equal(response.status, 503);
    assert.equal((await response.json()).ok, false);
  }
});
