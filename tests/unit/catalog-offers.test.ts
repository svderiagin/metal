import test from "node:test";
import assert from "node:assert/strict";
import {getAllProductVariants, getAllProductTypes} from "../../lib/catalog";
import {isDemonstrationProduct, storefrontVariant} from "../../lib/catalogOffer";
import {revalidateCartPrice} from "../../lib/cartPricing";
import {getProductTypeSummary} from "../../lib/productTypeSummary";
import {projectCartProduct, cartPricingVariant} from "../../lib/cartProjection";

const products = getAllProductVariants();
const find = (id: string) => products.find(product => product.id === id)!;

test("unconfirmed demo offers cannot contribute prices or accept a stale cart purchase", () => {
  const demos = products.filter(isDemonstrationProduct);
  assert.equal(demos.length, 5);
  assert.equal(demos.filter(product => !product.demo).length, 5);
  for (const product of demos.filter(product => !product.priceConfirmed)) {
    const originalPrice = product.price;
    const displayed = storefrontVariant(product);
    assert.equal(displayed.price, null);
    assert.equal(displayed.quoteOnly, true);
    assert.equal(displayed.pricePerTon, undefined);
    assert.equal(product.price, originalPrice, "saved source facts remain intact");
    assert.ok(revalidateCartPrice(product, {quantity: 1}).invalidReason);
    const restored = cartPricingVariant(projectCartProduct(product));
    assert.ok(revalidateCartPrice(restored, {quantity: 1}).invalidReason);
  }
  const type = getAllProductTypes().find(type => type.subcategoryId === "cat-trp-sub-1")!;
  const legacy = products.filter(product => product.productTypeId === type.id && isDemonstrationProduct(product));
  assert.equal(getProductTypeSummary(type, legacy).minimumPrice, null);
  assert.equal(getProductTypeSummary(type, legacy).standard, "Уточняется");
});

test("confirmed 35GS bars are priced using their catalogue lengths and nominal mass", () => {
  for (const [id, mass, total] of [["prd-003", 0.888, 519.48], ["prd-004", 2.47, 1444.95]] as const) {
    const product = find(id);
    assert.equal(isDemonstrationProduct(product), false);
    assert.equal(product.form, "bar");
    assert.equal(product.lengthMeters, 11.7);
    assert.equal(product.weightPerMeterKg, mass);
    assert.equal(storefrontVariant(product), product);
    const weightTons = 11.7 * mass / 1000;
    const metreOrder = revalidateCartPrice(product, {quantity: 11.7, measurement: {inputMode: "meter", meters: 11.7, weightTons}});
    assert.equal(metreOrder.invalidReason, undefined);
    assert.equal(metreOrder.estimatedTotal, total);
    assert.equal(revalidateCartPrice(product, {quantity: weightTons}).estimatedTotal, total);
    assert.ok(revalidateCartPrice(product, {quantity: 2}).invalidReason);
  }
});
