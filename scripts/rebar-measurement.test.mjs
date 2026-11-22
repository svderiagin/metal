import test from 'node:test';
import assert from 'node:assert/strict';
import {readProjectData} from './project-data.mjs';

const {armaturaA500cVariants} = readProjectData('data/products/armaturaA500c.ts');
const {metersToTons, tonsToMeters, wholeLengthOrder, formatDecimal} = readProjectData('lib/orderMeasurement.ts');
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

test('12 mm bars: requesting 100 metres prices nine 11.7 metre bars using their exact mass', () => {
  const row = armaturaA500cVariants.find(r => r.diameterMm === 12 && r.form === 'bar');
  const order = wholeLengthOrder(row, 100, 'meter');
  assert.equal(order.pieces, 9);
  assert.equal(order.meters, 105.3);
  assert.ok(Math.abs(order.weightTons - 0.0935064) < 1e-12);
  const priced = revalidateCartPrice(row, {quantity: order.meters, measurement: {
    inputMode: 'meter', meters: order.meters, weightTons: 0.09,
  }});
  assert.equal(priced.invalidReason, undefined);
  assert.equal(priced.measurement.weightTons, order.weightTons);
  assert.equal(priced.estimatedTotal, 6395.84);
});

test('16 mm bars: saved whole lengths use the current linear mass for authoritative pricing', () => {
  const row = armaturaA500cVariants.find(r => r.diameterMm === 16 && r.form === 'bar');
  const meters = 11.7;
  const tons = 0.0184626;
  const priced = revalidateCartPrice(row, {quantity: meters, measurement: {
    inputMode: 'meter', meters, weightTons: meters * 1.58 / 1000,
  }});
  assert.equal(priced.invalidReason, undefined);
  assert.ok(Math.abs(priced.measurement.weightTons - tons) < 1e-12);
  assert.equal(priced.estimatedTotal, 1251.76);
  const byTons = revalidateCartPrice(row, {quantity: tons, measurement: {
    inputMode: 'ton', meters: tons * 1000 / 1.58, weightTons: tons,
  }});
  assert.equal(byTons.invalidReason, undefined);
  assert.equal(byTons.measurement.meters, meters);
  assert.equal(byTons.estimatedTotal, priced.estimatedTotal);
});
