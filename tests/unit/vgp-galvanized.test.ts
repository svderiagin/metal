import test from "node:test";
import assert from "node:assert/strict";
import {getAllProductVariants} from "../../lib/catalog";
import {isVgpVariant, normalizeGalvanizedVgpVariant, wholeVgpOrder} from "../../lib/vgp";
import {getMeasurementQuantityOptions, metersToTons, tonsToMeters} from "../../lib/orderMeasurement";
import {cartPricingVariant, projectCartProduct} from "../../lib/cartProjection";
import {revalidateCartPrice} from "../../lib/cartPricing";
import {getProductIllustration} from "../../lib/productPreviewImage";
import raw from "../../data/imported-catalog.json";
import type {ProductVariant} from "../../types/product";

const pipe = getAllProductVariants().find(p => p.id === "local-984")!;
const source = raw.products.find(p => p.id === pipe.id)! as ProductVariant;

test("galvanized DN25 uses the GOST outside diameter and zinc-adjusted nominal mass without changing the offer", () => {
  assert.equal(pipe.nominalBoreMm, 25);
  assert.equal(pipe.diameterMm, 33.5);
  assert.equal(pipe.wallThicknessMm, 2.8);
  assert.equal(pipe.weightPerMeterKg, 2.1836);
  assert.ok(Math.abs(pipe.weightPerMeterKg - 2.12 * 1.03) < 1e-12);
  assert.equal(pipe.weight?.value, 2.1836);
  assert.equal(pipe.specifications.find(s => s.name === "Теоретическая масса")?.value, "2,18 кг/м");
  assert.equal(pipe.lengthMeters, 7.8);
  assert.match(pipe.description, /±150 мм/);
  assert.equal(pipe.standard, "ГОСТ 3262-75");
  for (const key of ["id", "sku", "slug", "categoryId", "subcategoryId", "productTypeId", "price", "priceUnit", "unit", "quoteOnly", "availability", "inStock"] as const) {
    assert.equal(pipe[key], source[key], key);
  }
  assert.deepEqual(normalizeGalvanizedVgpVariant(pipe), pipe);
  const foreign = {...source, sku: "another-offer"};
  assert.deepEqual(normalizeGalvanizedVgpVariant(foreign), foreign);
  assert.ok(isVgpVariant(pipe));
  assert.ok(!isVgpVariant({...pipe, subcategoryId: "cat-trk-sub-4"}));
  assert.match(getProductIllustration(pipe)?.imageUrl ?? "", /vgp_ocinkovannaya_2400_1800_marked\.jpg$/);
});

test("galvanized pipe conversions retain all mass digits and agree on whole 7.8 m pipes", () => {
  const cart = cartPricingVariant(projectCartProduct(pipe));
  assert.equal(cart.weightPerMeterKg, 2.1836);
  assert.ok(isVgpVariant(cart));
  assert.equal(getMeasurementQuantityOptions(pipe, "meter").minimum, 7.8);
  assert.ok(Math.abs(metersToTons(7.8, 2.1836)! - 0.01703208) < 1e-12);
  assert.ok(Math.abs(tonsToMeters(0.01703208, 2.1836)! - 7.8) < 1e-12);
  for (const product of [pipe, cart]) {
    for (const pieces of [1, 2, 10]) {
      const meters = 7.8 * pieces;
      const byMeters = wholeVgpOrder(product, meters, "meter")!;
      const byTons = wholeVgpOrder(product, meters * 2.1836 / 1000, "ton")!;
      assert.equal(byMeters.pieces, pieces);
      assert.deepEqual(byMeters, byTons);
      assert.ok(Math.abs(byMeters.weightTons - 0.01703208 * pieces) < 1e-12);
    }
    assert.equal(wholeVgpOrder(product, 7.81, "meter")?.meters, 15.6);
    assert.equal(wholeVgpOrder(product, NaN, "meter"), null);
    assert.equal(wholeVgpOrder(product, -1, "meter"), null);
  }
  // No price has been supplied: conversion must not turn an inquiry into a purchase.
  assert.ok(revalidateCartPrice(pipe, {quantity: 7.8, measurement: {inputMode: "meter", meters: 7.8, weightTons: 0.01703208}}).invalidReason);
  // An isolated priced fixture verifies the same client/server conversion contract.
  const priced = {...pipe, price: 100000, pricePerTon: 100000, quoteOnly: false};
  const result = revalidateCartPrice(priced, {quantity: 7.8, measurement: {inputMode: "meter", meters: 7.8, weightTons: 0.01703208}});
  assert.equal(result.invalidReason, undefined);
  assert.equal(result.estimatedTotal, 1703.21);
  assert.ok(revalidateCartPrice(priced, {quantity: 8, measurement: {inputMode: "meter", meters: 8, weightTons: 8 * 2.1836 / 1000}}).invalidReason);
});
