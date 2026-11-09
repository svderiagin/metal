import test from "node:test";
import assert from "node:assert/strict";
import {getProductVariantById} from "../../lib/cartCatalog";
import {getAllProductVariants} from "../../lib/catalog";
import {addCartItem, updateCartItem, updateCartPieceOrder} from "../../lib/cartMutations";
import {createCartLines, normalizeCartItems} from "../../lib/cart";
import {revalidateCartPrice} from "../../lib/cartPricing";
import {getCartMeasurementQuantityOptions, getMeasurementQuantityOptions, tonsToMeters} from "../../lib/orderMeasurement";
import {isDemonstrationProduct} from "../../lib/catalogOffer";
import {isVgpVariant} from "../../lib/vgp";
import {parseCreateOrderInput} from "../../lib/server/validation";
import {createTrustedOrder} from "../../lib/server/orders";
import {createOrderInput} from "../../lib/checkout";
import type {CartItem, CartMeasurement} from "../../types/cart";
import type {ProductVariant} from "../../types/product";
import type {CheckoutFormData, CreateOrderInput} from "../../types/order";

function fixture(id: string): ProductVariant {
  const product = getProductVariantById(id);
  assert.ok(product, `Catalog fixture ${id} must exist`);
  return product;
}

function close(actual: number | undefined | null, expected: number) {
  assert.ok(actual !== undefined && actual !== null);
  assert.ok(Math.abs(actual - expected) <= Math.max(1, Math.abs(expected)) * 1e-12,
    `Expected ${actual} to be close to ${expected}`);
}

function orderInput(items: CartItem[]): CreateOrderInput {
  return {consent: true, items, paymentMethod: "INVOICE",
    customer: {type: "INDIVIDUAL", fullName: "Тест корзины", email: "cart@example.invalid", phone: "+79000000000"},
    delivery: {address: "Локальная проверка без отправки"}};
}

test("the 999 tonne limit gives each rebar diameter its corresponding metre limit", () => {
  for (const [id, maximumMeters, minimumTons] of [
    ["rebar-a500c-6-coil", 4500000, 0.00000222],
    ["rebar-a500c-12-coil", 1125000, 0.00000888],
  ] as const) {
    const product = fixture(id);
    const meters = getMeasurementQuantityOptions(product, "meter");
    const tons = getMeasurementQuantityOptions(product, "ton");
    assert.equal(meters.minimum, 0.01);
    assert.equal(meters.maximum, maximumMeters);
    assert.equal(tons.minimum, minimumTons);
    assert.equal(tons.maximum, 999);
    close(tonsToMeters(tons.maximum, product.weightPerMeterKg!), meters.maximum);
    assert.deepEqual(getCartMeasurementQuantityOptions(product, "meter"), meters);
    assert.deepEqual(getCartMeasurementQuantityOptions(product, "ton"), tons);
  }
  assert.deepEqual(getMeasurementQuantityOptions({...fixture("rebar-a500c-6-coil"), weightPerMeterKg: undefined}, "ton"),
    {minimum: 0.001, maximum: 999, decimalPlaces: 3});
});

test("editing either field promotes a legacy tonne line and reprices the full-precision volume", () => {
  const product = fixture("rebar-a500c-6-coil");
  const legacy: CartItem[] = [{productId: product.id, quantity: 0.01}];
  const meters = updateCartItem(legacy, product, 12.5, "meter");
  assert.equal(legacy[0].measurement, undefined);
  assert.equal(meters[0].quantity, 12.5);
  assert.equal(meters[0].measurement?.inputMode, "meter");
  close(meters[0].measurement?.weightTons, 0.002775);
  assert.equal(createCartLines(meters)[0].estimatedTotal, 203.41);

  const tons = updateCartItem(meters, product, 0.01, "ton");
  assert.equal(tons[0].quantity, 0.01);
  assert.equal(tons[0].measurement?.inputMode, "ton");
  close(tons[0].measurement?.meters, 45.04504504504504);
  assert.equal(createCartLines(tons)[0].estimatedTotal, 733);

  const editedAgain = updateCartItem(tons, product, 100.25, "meter");
  assert.equal(editedAgain[0].measurement?.inputMode, "meter");
  close(editedAgain[0].measurement?.weightTons, 0.0222555);
  assert.equal(createCartLines(editedAgain)[0].estimatedTotal, 1631.33);
  const tiny = updateCartItem(editedAgain, product, 0.01, "meter");
  close(tiny[0].measurement?.weightTons, 0.00000222);
  assert.equal(createCartLines(tiny)[0].estimatedTotal, 0.16);
});

test("VGP rounds requests to whole pipes while both fields share the last legal pipe", () => {
  const product = fixture("local-258");
  assert.equal(getMeasurementQuantityOptions(product, "meter").maximum, 780468);
  assert.equal(getMeasurementQuantityOptions(product, "ton").maximum, 998.99904);
  const items: CartItem[] = [{productId: product.id, quantity: 0.01}];
  const twoPipes = updateCartItem(items, product, 7, "meter");
  assert.equal(twoPipes[0].quantity, 12);
  assert.equal(twoPipes[0].measurement?.meters, 12);
  close(twoPipes[0].measurement?.weightTons, 0.01536);
  assert.equal(createCartLines(twoPipes)[0].estimatedTotal, 823.91);
  const threePipes = updateCartItem(twoPipes, product, 0.02, "ton");
  assert.equal(threePipes[0].measurement?.inputMode, "ton");
  assert.equal(threePipes[0].measurement?.meters, 18);
  close(threePipes[0].quantity, 0.02304);
  const maximum = updateCartItem(threePipes, product, 998.99904, "ton");
  assert.equal(maximum[0].measurement?.meters, 780468);
  assert.equal(createCartLines(maximum)[0].invalidReason, undefined);
  assert.equal(updateCartItem(maximum, product, 780469, "meter"), maximum);
  assert.equal(updateCartItem(maximum, product, 999, "ton"), maximum);
});

test("both rebar fields accept 999 tonnes and former metre-cap volumes but reject more than 999 tonnes", () => {
  for (const [id, maximumMeters] of [["rebar-a500c-6-coil", 4500000], ["rebar-a500c-12-coil", 1125000]] as const) {
    const product = fixture(id);
    const initial: CartItem[] = [{productId: product.id, quantity: 0.01}];
    const bulk = updateCartItem(initial, product, 17, "ton");
    assert.equal(bulk[0].measurement?.weightTons, 17);
    assert.equal(createCartLines(bulk)[0].invalidReason, undefined);
    const longOrder = updateCartItem(bulk, product, 20000, "meter");
    assert.equal(longOrder[0].measurement?.meters, 20000);
    assert.equal(createCartLines(longOrder)[0].invalidReason, undefined);
    const meters = updateCartItem(longOrder, product, maximumMeters, "meter");
    assert.equal(meters[0].measurement?.meters, maximumMeters);
    close(meters[0].measurement?.weightTons, 999);
    const tons = updateCartItem(meters, product, 999, "ton");
    assert.equal(tons[0].measurement?.inputMode, "ton");
    close(tons[0].measurement?.meters, maximumMeters);
    assert.equal(createCartLines(tons)[0].invalidReason, undefined);
    assert.equal(updateCartItem(tons, product, maximumMeters + 1, "meter"), tons);
    assert.equal(updateCartItem(tons, product, 999.001, "ton"), tons);
  }
});

test("restoring oversized measured and legacy orders preserves the quantity and blocks repricing", () => {
  const product = fixture("rebar-a500c-6-coil");
  const measurement: CartMeasurement = {inputMode: "ton", meters: 4504504.504504505,
    weightTons: 1000, pricePerTon: 1, estimatedTotal: 1};
  for (const stored of [
    {productId: product.id, quantity: 1000, measurement},
    {productId: product.id, quantity: 1000},
    {productId: product.id, quantity: 1100},
  ]) {
    const restored = normalizeCartItems([stored]);
    assert.equal(restored.length, 1);
    assert.equal(restored[0].quantity, stored.quantity);
    if ("measurement" in stored) {
      assert.equal(restored[0].measurement?.weightTons, 1000);
      assert.equal(restored[0].measurement?.meters, measurement.meters);
    }
    const line = createCartLines(restored)[0];
    assert.equal(line.quantity, stored.quantity);
    assert.ok(line.invalidReason);
    assert.equal(line.estimatedTotal, 0);
    assert.ok(revalidateCartPrice(product, restored[0]).invalidReason);
  }
});

test("invalid quantities, missing mass and unavailable offers cannot replace a valid measured line", () => {
  const product = fixture("rebar-a500c-6-coil");
  const measurement: CartMeasurement = {inputMode: "meter", meters: 12.5,
    weightTons: 999, pricePerTon: 1, estimatedTotal: 1};
  const items = addCartItem([], product, 12.5, measurement);
  close(items[0].measurement?.weightTons, 0.002775);
  assert.equal(items[0].measurement?.pricePerTon, 73300);
  assert.equal(items[0].measurement?.estimatedTotal, 203.41);
  for (const quantity of [0, -1, NaN, Infinity, 4500001]) {
    assert.equal(updateCartItem(items, product, quantity, "meter"), items);
  }
  for (const unavailable of [undefined, {...product, id: "missing-product"},
    {...product, weightPerMeterKg: undefined}, {...product, weightPerMeterKg: 0},
    {...product, demo: true}, {...product, quoteOnly: true}]) {
    assert.equal(updateCartItem(items, unavailable, 20, "meter"), items);
  }
});

test("profile pipe edits preserve whole pieces and validate the selected length range and offer", () => {
  const original = fixture("profile-pipe-square-80x80x2");
  // This quote-only catalog shape supplies dimensions; the offer exists only inside this test.
  const product: ProductVariant = {...original, price: 157, priceConfirmed: true, quoteOnly: false,
    priceQualifier: "exact", unit: "meter", priceUnit: "за метр"};
  const items = addCartItem([], product, 12, undefined, {pieces: 2, lengthMeters: 6});
  const edited = updateCartPieceOrder(items, product, 3, 7.5);
  assert.deepEqual(edited[0].pieceOrder, {pieces: 3, lengthMeters: 7.5});
  assert.equal(edited[0].quantity, 22.5);
  assert.equal(revalidateCartPrice(product, edited[0]).estimatedTotal, 3532.5);
  const morePieces = updateCartItem(edited, product, 30);
  assert.deepEqual(morePieces[0].pieceOrder, {pieces: 4, lengthMeters: 7.5});
  assert.deepEqual(updateCartPieceOrder(edited, product, 999, 12)[0].pieceOrder, {pieces: 999, lengthMeters: 12});
  for (const [pieces, length] of [[0, 7.5], [1.5, 7.5], [1000, 7.5], [3, 5.99], [3, 12.01], [3, NaN]]) {
    assert.equal(updateCartPieceOrder(edited, product, pieces, length), edited);
  }
  assert.equal(updateCartPieceOrder(edited, {...product, priceConfirmed: false}, 4, 8), edited);
  assert.equal(original.quoteOnly, true);
  assert.equal(original.price, null);
});

test("all purchasable measured variants share their physical caps across cart and authoritative order input", () => {
  const products = getAllProductVariants().filter(product => product.unit === "ton" && !isDemonstrationProduct(product)
    && !product.quoteOnly && product.priceQualifier !== "from" && (product.price ?? 0) > 0 && Number.isFinite(product.price)
    && (product.pricePerTon ?? 0) > 0 && Number.isFinite(product.pricePerTon)
    && (product.weightPerMeterKg ?? 0) > 0 && Number.isFinite(product.weightPerMeterKg)
    && (product.inStock || (product.imported === true && product.availability === "UNKNOWN")));
  const categories = new Set(products.map(product => product.categoryId));
  for (const category of ["cat-arm", "cat-bal", "cat-trk"]) assert.ok(categories.has(category), category);
  for (const product of products) {
    const meterOptions = getMeasurementQuantityOptions(product, "meter");
    const tonOptions = getMeasurementQuantityOptions(product, "ton");
    assert.ok(meterOptions.minimum > 0 && Number.isFinite(meterOptions.maximum), product.id);
    assert.ok(tonOptions.maximum > 0 && tonOptions.maximum <= 999, product.id);
    close(tonsToMeters(tonOptions.minimum, product.weightPerMeterKg!), meterOptions.minimum);
    close(tonsToMeters(tonOptions.maximum, product.weightPerMeterKg!), meterOptions.maximum);
    if (isVgpVariant(product)) {
      close(meterOptions.maximum / product.lengthMeters!, Math.round(meterOptions.maximum / product.lengthMeters!));
      assert.ok((meterOptions.maximum + product.lengthMeters!) * product.weightPerMeterKg! / 1000 > 999, product.id);
    } else {
      assert.equal(tonOptions.maximum, 999, product.id);
      close(meterOptions.maximum, 999000 / product.weightPerMeterKg!);
    }
    const seed: CartItem[] = [{productId: product.id, quantity: 0.01}];
    const fromMeters = updateCartItem(seed, product, meterOptions.maximum, "meter");
    assert.equal(fromMeters[0].quantity, meterOptions.maximum, product.id);
    assert.equal(fromMeters[0].measurement?.meters, meterOptions.maximum, product.id);
    const fromTons = updateCartItem(fromMeters, product, tonOptions.maximum, "ton");
    for (const [items, mode] of [[fromMeters, "meter"], [fromTons, "ton"]] as const) {
      assert.notEqual(items, seed, product.id);
      assert.equal(items[0].measurement?.inputMode, mode, product.id);
      close(items[0].measurement?.meters, meterOptions.maximum);
      close(items[0].measurement?.weightTons, tonOptions.maximum);
      const line = createCartLines(items)[0];
      assert.equal(line.invalidReason, undefined, product.id);
      const parsed = parseCreateOrderInput(orderInput(items));
      assert.ok(parsed, product.id);
      // Pure construction only: no repository, notifications, payment provider or HTTP is called.
      const trusted = createTrustedOrder(parsed);
      assert.ok(trusted, product.id);
      assert.equal(trusted.items[0].measurement?.inputMode, mode, product.id);
      assert.equal(trusted.items[0].unitPrice, product.pricePerTon, product.id);
      assert.equal(trusted.totalAmount, line.estimatedTotal, product.id);
    }
    const extraMeters = isVgpVariant(product) ? product.lengthMeters! : 1;
    const oversizedMeters = meterOptions.maximum + extraMeters;
    const oversizedTons = oversizedMeters * product.weightPerMeterKg! / 1000;
    assert.equal(updateCartItem(fromTons, product, oversizedMeters, "meter"), fromTons, product.id);
    assert.equal(updateCartItem(fromTons, product, oversizedTons, "ton"), fromTons, product.id);
    const oversized: CartItem = {productId: product.id, quantity: oversizedTons,
      measurement: {inputMode: "ton", meters: oversizedMeters, weightTons: oversizedTons, pricePerTon: 1, estimatedTotal: 1}};
    const parsed = parseCreateOrderInput(orderInput([oversized]));
    assert.ok(parsed, product.id);
    assert.equal(createTrustedOrder(parsed), null, product.id);
  }
});

test("the order boundary replaces forged converted values and cached prices and rejects an invalid mixed order", () => {
  const items: CartItem[] = [
    {productId: "rebar-a500c-6-coil", quantity: 12.5,
      measurement: {inputMode: "meter", meters: 12.5, weightTons: 999, pricePerTon: 1, estimatedTotal: 1}},
    {productId: "rebar-a500c-12-coil", quantity: 0.01,
      measurement: {inputMode: "ton", meters: 99999, weightTons: 0.01, pricePerTon: 1, estimatedTotal: 1}},
  ];
  for (const item of items) {Object.freeze(item.measurement); Object.freeze(item);}
  Object.freeze(items);
  const parsed = parseCreateOrderInput(orderInput(items));
  assert.ok(parsed);
  const trusted = createTrustedOrder(parsed);
  assert.ok(trusted);
  assert.equal(trusted.totalAmount, 907.41);
  assert.equal(trusted.items[0].unitPrice, 73300);
  assert.equal(trusted.items[0].subtotal, 203.41);
  close(trusted.items[0].measurement?.weightTons, 0.002775);
  assert.equal(trusted.items[1].unitPrice, 70400);
  assert.equal(trusted.items[1].subtotal, 704);
  close(trusted.items[1].measurement?.meters, 11.26126126126126);
  assert.equal(items[0].measurement?.weightTons, 999);
  assert.equal(items[1].measurement?.meters, 99999);
  for (const invalid of [
    {productId: "removed-cart-product", quantity: 2},
    {productId: "rebar-a500c-12-coil", quantity: 1125001,
      measurement: {inputMode: "meter" as const, meters: 1125001, weightTons: 999.000888, pricePerTon: 1, estimatedTotal: 1}},
    {productId: "rebar-a500c-12-coil", quantity: 1000,
      measurement: {inputMode: "ton" as const, meters: 100, weightTons: 1000, pricePerTon: 1, estimatedTotal: 1}},
    {productId: "profile-pipe-square-20x20x2", quantity: 6, pieceOrder: {pieces: 1, lengthMeters: 6}},
  ]) {
    const input = parseCreateOrderInput(orderInput([items[0], invalid]));
    assert.ok(input);
    assert.equal(createTrustedOrder(input), null, invalid.productId);
  }
  assert.equal(parseCreateOrderInput(orderInput([items[0], {productId: "rebar-a500c-12-coil", quantity: 1000}])), null);
});

test("restored unknown, stale and nonwhole lines stay visible with no payable total while malformed state is discarded", () => {
  const stored = [
    {productId: "removed-cart-product", quantity: 42},
    {productId: "profile-pipe-square-20x20x2", quantity: 6, pieceOrder: {pieces: 1, lengthMeters: 6}},
    {productId: "profnastil-c8-03-ral-3005", quantity: 1.5},
    {productId: "rozmet-2235", quantity: 1000},
  ];
  const snapshot = JSON.stringify(stored);
  const restored = normalizeCartItems(stored);
  const lines = createCartLines(restored);
  assert.equal(lines.length, stored.length);
  for (const [index, line] of lines.entries()) {
    assert.equal(line.productId, stored[index].productId);
    assert.equal(line.quantity, stored[index].quantity);
    assert.ok(line.invalidReason, line.productId);
    assert.equal(line.estimatedTotal, 0, line.productId);
  }
  assert.equal(JSON.stringify(stored), snapshot);
  assert.deepEqual(normalizeCartItems([null, {}, {productId: 42, quantity: 1},
    ...[0, -1, NaN, Infinity].map(quantity => ({productId: "rebar-a500c-6-coil", quantity})),
    {productId: "rebar-a500c-6-coil", quantity: 1, measurement: {inputMode: "meter", meters: -1, weightTons: 1}},
    {productId: "rebar-a500c-6-coil", quantity: 1, measurement: {inputMode: "invalid", meters: 1, weightTons: 1}},
    {productId: "profile-pipe-square-20x20x2", quantity: 9, pieceOrder: {pieces: 1.5, lengthMeters: 6}},
    {productId: "rebar-a500c-6-coil", quantity: 1, measurement: {inputMode: "meter", meters: 1, weightTons: 1},
      pieceOrder: {pieces: 1, lengthMeters: 6}},
  ]), []);
});

test("fixed-length profile pipes reject alternate lengths and fractional pieces without mutating prior state", () => {
  const original = fixture("profile-pipe-square-20x20x2");
  const product: ProductVariant = {...original, price: 157, priceConfirmed: true, quoteOnly: false,
    priceQualifier: "exact", unit: "meter", priceUnit: "за метр"};
  assert.equal(product.lengthMeters, 6);
  const items = addCartItem([], product, 18, undefined, {pieces: 3, lengthMeters: 6});
  Object.freeze(items[0].pieceOrder); Object.freeze(items[0]); Object.freeze(items);
  const edited = updateCartPieceOrder(items, product, 4, 6);
  assert.deepEqual(edited[0].pieceOrder, {pieces: 4, lengthMeters: 6});
  assert.equal(edited[0].quantity, 24);
  assert.equal(revalidateCartPrice(product, edited[0]).estimatedTotal, 3768);
  assert.deepEqual(items[0].pieceOrder, {pieces: 3, lengthMeters: 6});
  for (const [pieces, length] of [[3, 12], [3, 5.99], [0, 6], [2.5, 6], [1000, 6], [NaN, 6], [3, Infinity]]) {
    assert.equal(updateCartPieceOrder(items, product, pieces, length), items);
  }
  assert.equal(updateCartItem(items, product, 15), items);
  assert.deepEqual(updateCartItem(items, product, 24)[0].pieceOrder, {pieces: 4, lengthMeters: 6});
  assert.equal(original.quoteOnly, true);
  assert.equal(original.price, null);
});

test("whole-piece orders enforce their own cap and reject measured or pipe-order edits", () => {
  const product = fixture("profnastil-c8-03-ral-3005");
  const items = addCartItem([], product, 2);
  assert.equal(createCartLines(items)[0].estimatedTotal, 1600);
  const maximum = updateCartItem(items, product, 999);
  assert.equal(maximum[0].quantity, 999);
  assert.equal(createCartLines(maximum)[0].estimatedTotal, 799200);
  for (const quantity of [0, -1, 0.5, 999.5, 1000, NaN, Infinity]) {
    assert.equal(updateCartItem(items, product, quantity), items);
  }
  assert.equal(updateCartItem(items, product, 12, "meter"), items);
  assert.equal(updateCartItem(items, product, 0.01, "ton"), items);
  assert.equal(updateCartPieceOrder(items, product, 2, 6), items);
  assert.equal(addCartItem(maximum, product, 2)[0].quantity, 999);
});

test("a legal legacy beam reaches checkout canonically and saved orders over 999 tonnes stay blocked", () => {
  const product = fixture("local-115970");
  const stored = [{productId: product.id, quantity: 900}];
  const restored = normalizeCartItems(stored);
  const snapshot = JSON.stringify(restored);
  assert.equal(restored[0].measurement, undefined);
  assert.ok(parseCreateOrderInput(orderInput(restored)));
  const lines = createCartLines(restored);
  assert.equal(lines[0].invalidReason, undefined);
  assert.equal(lines[0].quantity, 900);
  assert.equal(lines[0].measurement?.inputMode, "ton");
  assert.equal(lines[0].measurement?.weightTons, 900);
  close(lines[0].measurement?.meters, 7281.553398058252);
  assert.equal(lines[0].estimatedTotal, 73143000);
  const form: CheckoutFormData = {customerType: "INDIVIDUAL", fullName: "Тест корзины", email: "cart@example.invalid",
    phone: "+79000000000", deliveryAddress: "Локальная проверка без отправки", companyName: "", taxNumber: "",
    legalAddress: "", comment: "", paymentMethod: "INVOICE", consentAccepted: true};
  const parsed = parseCreateOrderInput(createOrderInput(form, lines));
  assert.ok(parsed);
  const trusted = createTrustedOrder(parsed);
  assert.ok(trusted);
  assert.equal(trusted.items[0].quantity, 900);
  assert.equal(trusted.items[0].measurement?.weightTons, 900);
  assert.equal(trusted.totalAmount, 73143000);
  assert.equal(JSON.stringify(restored), snapshot);
  assert.deepEqual(stored, [{productId: product.id, quantity: 900}]);

  for (const quantity of [1000, 1100]) {
    const oversized = createCartLines(normalizeCartItems([{productId: product.id, quantity}]));
    assert.equal(oversized[0].quantity, quantity);
    assert.equal(oversized[0].measurement?.weightTons, quantity);
    assert.ok(oversized[0].invalidReason);
    assert.equal(oversized[0].estimatedTotal, 0);
    const rejected = parseCreateOrderInput(createOrderInput(form, oversized));
    assert.ok(rejected);
    assert.equal(createTrustedOrder(rejected), null);
  }
});

test("missing current mass preserves a saved measured order's units without trusting its money", () => {
  const product = fixture("local-302");
  assert.equal(product.unit, "ton");
  assert.equal(product.weightPerMeterKg, undefined);
  assert.equal(isDemonstrationProduct(product), false);
  const stored: CartItem[] = [{productId: product.id, quantity: 100,
    measurement: {inputMode: "meter", meters: 100, weightTons: 0.5, pricePerTon: 999999, estimatedTotal: 999999}}];
  Object.freeze(stored[0].measurement); Object.freeze(stored[0]); Object.freeze(stored);
  const line = createCartLines(stored)[0];
  assert.equal(line.quantity, 100);
  assert.deepEqual(line.measurement, {inputMode: "meter", meters: 100, weightTons: 0.5,
    pricePerTon: 0, estimatedTotal: 0});
  assert.ok(line.invalidReason);
  assert.equal(line.estimatedTotal, 0);
  assert.equal(stored[0].measurement?.pricePerTon, 999999);
  assert.equal(stored[0].measurement?.estimatedTotal, 999999);
  const restored = createCartLines(normalizeCartItems(stored))[0];
  assert.deepEqual(restored.measurement, line.measurement);
  assert.ok(restored.invalidReason);
  const parsed = parseCreateOrderInput(orderInput([line]));
  assert.ok(parsed);
  assert.equal(createTrustedOrder(parsed), null);
  assert.equal(updateCartItem(stored, product, 110, "meter"), stored);
});
