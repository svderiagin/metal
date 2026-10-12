import test from 'node:test';
import assert from 'node:assert/strict';
import {readProjectData} from './project-data.mjs';

const {productVariants} = readProjectData('data/products/index.ts');
const {normalizeRebarVariant} = readProjectData('lib/rebar.ts');
const {revalidateCartPrice} = readProjectData('lib/cartPricing.ts');
const {metersToTons, calculateLineTotal} = readProjectData('lib/orderMeasurement.ts');

test('every remaining rebar category retains all rows and supports the reference table', () => {
  const counts = new Map([['cat-arm-sub-2', 2], ['cat-arm-sub-3', 9], ['cat-arm-sub-4', 15]]);
  for (const [id, count] of counts) {
    const rows = productVariants.filter(p => p.subcategoryId === id);
    assert.equal(rows.length, count);
    assert.equal(new Set(rows.map(p => p.id)).size, count);
    for (const row of rows) {
      assert.ok(row.diameterMm > 0, row.name);
      assert.ok(row.weightPerMeterKg > 0, row.name);
      assert.ok(['bar', 'coil'].includes(row.form));
      assert.ok(row.steelGrade);
      assert.ok(row.lengthMeters === undefined || row.lengthMeters <= 18);
      if (row.price !== null) assert.equal(row.pricePerTon, row.price);
      const tons = metersToTons(100, row.weightPerMeterKg);
      const priced = revalidateCartPrice(row, {quantity: 100, measurement: {
        inputMode: 'meter', meters: 100, weightTons: tons,
        pricePerTon: row.pricePerTon ?? 0, estimatedTotal: 0,
      }});
      if (row.quoteOnly) {
        assert.ok(priced.invalidReason);
        assert.equal(priced.estimatedTotal, 0);
      } else {
        assert.equal(priced.invalidReason, undefined);
        assert.equal(priced.estimatedTotal, calculateLineTotal(tons, row.pricePerTon));
      }
    }
  }
});

test('imported rebar preserves quote-only and unknown stock states and converts millimetres', () => {
  const quote = productVariants.find(p => p.id === 'local--705');
  assert.equal(quote.price, null);
  assert.equal(quote.pricePerTon, undefined);
  assert.equal(quote.quoteOnly, true);
  assert.equal(quote.availability, 'UNKNOWN');
  assert.equal(quote.lengthMeters, 11.7);
  assert.equal(quote.weightPerMeterKg, 1.998);
  const coil = productVariants.find(p => p.id === 'local-111021');
  assert.equal(coil.form, 'coil');
  assert.equal(coil.lengthMeters, undefined);
});

test('normalization leaves other catalog categories untouched', () => {
  const product = productVariants.find(p => p.categoryId !== 'cat-arm');
  assert.equal(normalizeRebarVariant(product), product);
});
