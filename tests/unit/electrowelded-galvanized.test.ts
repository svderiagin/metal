import test from "node:test";
import assert from "node:assert/strict";
import {getAllProductVariants} from "../../lib/catalog";
import {normalizeGalvanizedElectroweldedVariant} from "../../lib/electroweldedPipe";
import {isVgpVariant, isWholePipeVariant} from "../../lib/pipeFamily";
import {wholePipeOrder} from "../../lib/wholePipeOrder";
import {getMeasurementQuantityOptions} from "../../lib/orderMeasurement";
import {cartPricingVariant, projectCartProduct} from "../../lib/cartProjection";
import {revalidateCartPrice} from "../../lib/cartPricing";
import {addCartItem, updateCartItem} from "../../lib/cartMutations";
import {createTrustedOrder} from "../../lib/server/orders";
import raw from "../../data/imported-catalog.json";
import type {ProductVariant} from "../../types/product";

const pipe = getAllProductVariants().find(p => p.id === "local-443")!;
const source = raw.products.find(p => p.id === pipe.id)! as ProductVariant;
const close = (actual: number | undefined, expected: number) => assert.ok(actual !== undefined && Math.abs(actual - expected) < 1e-10, `${actual} ≠ ${expected}`);

test("89×3.5 uses the GOST 10704 steel mass and explicitly excludes the unknown zinc coating mass", () => {
  assert.equal(pipe.diameterMm, 89);
  assert.equal(pipe.wallThicknessMm, 3.5);
  assert.equal(pipe.lengthMeters, 7.8);
  assert.equal(pipe.nominalBoreMm, undefined);
  assert.equal(pipe.weightPerMeterKg, 7.38);
  assert.equal(Math.round(0.0246615 * (89 - 3.5) * 3.5 * 100) / 100, 7.38);
  assert.deepEqual(pipe.weight, {value: 7.38, unit: "кг/м"});
  assert.equal(pipe.specifications.find(s => s.name === "Теоретическая масса без цинкового покрытия")?.value, "7,38 кг/м");
  assert.match(pipe.description, /±150 мм/);
  assert.equal(pipe.standard, "ГОСТ 10704-91; ГОСТ 10705-80");
  for (const key of ["id", "sku", "slug", "categoryId", "subcategoryId", "productTypeId", "price", "pricePerTon", "priceUnit", "unit", "quoteOnly", "availability", "inStock"] as const) {
    assert.equal(pipe[key], source[key], key);
  }
  assert.deepEqual(normalizeGalvanizedElectroweldedVariant(pipe), pipe);
  const foreign = {...source, sku: "different-offer"};
  assert.equal(normalizeGalvanizedElectroweldedVariant(foreign), foreign);
  assert.ok(!isVgpVariant(pipe));
  assert.ok(isWholePipeVariant(pipe));
});

test("electrowelded pipe orders use whole 7.8 m lengths consistently in public and cart data", () => {
  for (const product of [pipe, cartPricingVariant(projectCartProduct(pipe))]) {
    assert.equal(getMeasurementQuantityOptions(product, "meter").minimum, 7.8);
    for (const pieces of [1, 2, 10]) {
      const byMeters = wholePipeOrder(product, 7.8 * pieces, "meter")!;
      const byTons = wholePipeOrder(product, 0.057564 * pieces, "ton")!;
      assert.equal(byMeters.pieces, pieces);
      assert.deepEqual(byMeters, byTons);
      close(byMeters.weightTons, 0.057564 * pieces);
    }
    assert.equal(wholePipeOrder(product, 7.81, "meter")?.meters, 15.6);
    assert.equal(wholePipeOrder(product, -1, "meter"), null);
    assert.equal(wholePipeOrder(product, NaN, "meter"), null);
    const one = addCartItem([], product, 7.8, {inputMode: "meter", meters: 7.8, weightTons: 0.057564, pricePerTon: 1, estimatedTotal: 1});
    assert.equal(one.length, 1);
    assert.equal(one[0].measurement?.estimatedTotal, 4869.91);
    const two = updateCartItem(one, product, 7.81, "meter");
    close(two[0].measurement?.weightTons, 0.115128);
    close(two[0].measurement?.meters, 15.6);
    const reversed = updateCartItem(two, product, 0.057564, "ton");
    close(reversed[0].measurement?.meters, 7.8);
    assert.equal(reversed[0].measurement?.estimatedTotal, 4869.91);
    assert.equal(updateCartItem(one, product, NaN, "meter"), one);
    assert.ok(revalidateCartPrice(product, {quantity: 8, measurement: {inputMode: "meter", meters: 8, weightTons: 8 * 7.38 / 1000}}).invalidReason);
  }
});

test("the authoritative order recalculates pipe mass and price rather than trusting submitted values", () => {
  const input = {
    customer: {type: "INDIVIDUAL" as const, fullName: "Тест", email: "test@example.invalid", phone: "+79000000000"},
    delivery: {address: "Тестовый адрес"}, paymentMethod: "INVOICE" as const, consent: true,
    items: [{productId: pipe.id, quantity: 15.6, measurement: {inputMode: "meter" as const, meters: 15.6, weightTons: 0.001}}],
  };
  const order = createTrustedOrder(input);
  assert.ok(order);
  close(order.items[0].measurement?.weightTons, 0.115128);
  assert.equal(order.items[0].subtotal, 9739.83);
  assert.equal(order.items[0].weightPerMeterKg, 7.38);
  assert.equal(createTrustedOrder({...input, items: [{productId: pipe.id, quantity: 8,
    measurement: {inputMode: "meter", meters: 8, weightTons: 0.05904}}]}), null);
});
