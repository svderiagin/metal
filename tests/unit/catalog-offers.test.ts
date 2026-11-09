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
  assert.equal(demos.length, 13);
  assert.equal(demos.filter(product => !product.demo).length, 7);
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

test("confirmed demo tonne prices remain usable without certifying their mass conversions", () => {
  for (const id of ["prd-003", "prd-004"]) {
    const product = find(id);
    assert.equal(storefrontVariant(product), product);
    const tonneOrder = revalidateCartPrice(product, {quantity: 2});
    assert.equal(tonneOrder.invalidReason, undefined);
    assert.equal(tonneOrder.estimatedTotal, 100000);
    const metreOrder = revalidateCartPrice(product, {quantity: 100, measurement: {inputMode: "meter", meters: 100, weightTons: 1}});
    assert.ok(metreOrder.invalidReason);
    assert.equal(metreOrder.estimatedTotal, 0);
  }
});
