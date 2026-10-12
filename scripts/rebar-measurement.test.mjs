import test from 'node:test';
import assert from 'node:assert/strict';
import {readProjectData} from './project-data.mjs';

const {armaturaA500cVariants} = readProjectData('data/products/armaturaA500c.ts');
const {metersToTons, tonsToMeters, calculateLineTotal, formatDecimal} = readProjectData('lib/orderMeasurement.ts');
const {revalidateCartPrice} = readProjectData('lib/cartPricing.ts');
// GOST 34028-2016, table 1: nominal mass per metre in kilograms.
const masses = new Map([[6, .222], [8, .395], [10, .617], [12, .888],
  [14, 1.208], [16, 1.578], [18, 1.998], [20, 2.466], [22, 2.984],
  [25, 3.853], [28, 4.834], [32, 6.313], [36, 7.990]]);

test('6 mm: kilogram input and metre input produce the same order and price', () => {
  const row = armaturaA500cVariants.find(r => r.diameterMm === 6 && r.form === 'coil');
  const kilograms = 22.2;
  const tons = kilograms / 1000;
  assert.equal(formatDecimal(metersToTons(100, row.weightPerMeterKg) * 1000, 2), '22.2');
  assert.equal(formatDecimal(tonsToMeters(tons, row.weightPerMeterKg), 2), '100');
  const priced = revalidateCartPrice(row, {quantity: tons, measurement: {
    inputMode: 'ton', meters: 100, weightTons: tons, pricePerTon: row.pricePerTon, estimatedTotal: 0,
  }});
  assert.equal(formatDecimal(priced.measurement.weightTons * 1000, 2), '22.2');
  assert.equal(formatDecimal(priced.measurement.meters, 2), '100');
  assert.equal(priced.estimatedTotal, 1627.26);
});

test('all A500C rows use GOST nominal masses and reversible metre/tonne conversion', () => {
  for (const row of armaturaA500cVariants) {
    const mass = masses.get(row.diameterMm);
    assert.equal(row.weightPerMeterKg, mass, row.name);
    assert.ok(Math.abs(metersToTons(100, mass) - mass / 10) < 1e-12);
    for (const meters of [1, 6, 11.7, 100, 16207.46]) {
      const tons = metersToTons(meters, mass);
      assert.ok(Math.abs(tonsToMeters(tons, mass) - meters) < 1e-8, row.name);
    }
  }
});

test('12 mm: 100 metres weigh 0.0888 tonnes; display rounding never changes the cart total', () => {
  const row = armaturaA500cVariants.find(r => r.diameterMm === 12 && r.form === 'bar');
  assert.equal(metersToTons(100, row.weightPerMeterKg), .0888);
  assert.equal(formatDecimal(.0888, 2), '0.09');
  assert.equal(calculateLineTotal(.0888, row.pricePerTon), 6073.92);
  const priced = revalidateCartPrice(row, {quantity: 100, measurement: {
    inputMode: 'meter', meters: 100, weightTons: .09, pricePerTon: 0, estimatedTotal: 0,
  }});
  assert.equal(priced.measurement.weightTons, .0888);
  assert.equal(priced.estimatedTotal, 6073.92);
  assert.equal(formatDecimal(tonsToMeters(1, row.weightPerMeterKg), 2), '1126.13');
});

test('16 mm uses 1.578 kg/m and reprices saved orders with corrected nominal mass', () => {
  const row = armaturaA500cVariants.find(r => r.diameterMm === 16);
  const priced = revalidateCartPrice(row, {quantity: 100, measurement: {
    inputMode: 'meter', meters: 100, weightTons: .158, pricePerTon: row.pricePerTon, estimatedTotal: 10712.4,
  }});
  assert.ok(Math.abs(priced.measurement.weightTons - .1578) < 1e-12);
  assert.equal(priced.estimatedTotal, 10698.84);
  const byTons = revalidateCartPrice(row, {quantity: 1, measurement: {
    inputMode: 'ton', meters: 1000 / 1.58, weightTons: 1, pricePerTon: row.pricePerTon, estimatedTotal: row.pricePerTon,
  }});
  assert.equal(byTons.measurement.meters, 1000 / 1.578);
  assert.equal(byTons.estimatedTotal, row.pricePerTon);
});
