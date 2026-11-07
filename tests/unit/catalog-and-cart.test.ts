import test from "node:test";
import assert from "node:assert/strict";
import {getAllProductVariants} from "../../lib/catalog";
import {selectVariants, variantFilterLabel, referenceProfileName, uniqueAttributeValues} from "../../lib/variantCatalog";
import {getVariantAttribute, getVariantFilterKeys} from "../../lib/variantPresentation";
import {addCartItem, updateCartItem} from "../../lib/cartMutations";
import {createCartLines, normalizeCartItems} from "../../lib/cart";
import {revalidateCartPrice} from "../../lib/cartPricing";
import {applyCatalogOverrides} from "../../lib/catalogOverrides";
import {storefrontDescription} from "../../lib/catalogContent";
import type {ProductVariant} from "../../types/product";

const products = getAllProductVariants();
const channels = products.filter(product => product.categoryId === "rozmet-cat-shveller");
const options = {filters: {}, filterKeys: [], stockOnly: false, minimumPrice: "", maximumPrice: "", sort: "name" as const};

test("channel filters distinguish section numbers and supplier lengths", () => {
  assert.deepEqual(getVariantFilterKeys("shveller"), ["size", "length"]);
  assert.equal(getVariantAttribute(channels[0], "size"), "5");
  assert.equal(getVariantAttribute(channels[0], "length"), "11,7 м");
  assert.equal(variantFilterLabel(channels, "size"), "Номер профиля");
  assert.equal(variantFilterLabel(channels, "length"), "Длина по каталогу");
  assert.equal(uniqueAttributeValues(channels, "size").length, 14);
  assert.deepEqual(selectVariants(channels, {...options, filterKeys: ["size"], filters: {size: "5"}}).map(p => p.id), ["rozmet-2235"]);
  assert.deepEqual(selectVariants(channels, {...options, stockOnly: true}).every(p => p.inStock), true);
});

test("dimensions sort by every side; unknown and quote prices stay last", () => {
  const first = {...channels[0], attributes: [{key: "size" as const, label: "Размер", value: "100×30"}], categoryId: "test"};
  const second = {...first, id: "second", attributes: [{key: "size" as const, label: "Размер", value: "100×20"}]};
  assert.equal(selectVariants([first, second], {...options, sort: "size"})[0].id, "second");
  const prices = [{...first, price: null}, {...first, id: "cheap", price: 10}, {...first, id: "expensive", price: 20}];
  for (const sort of ["price-asc", "price-desc"] as const) assert.equal(selectVariants(prices, {...options, sort}).at(-1)?.price, null);
  assert.equal(selectVariants(prices, {...options, minimumPrice: "10,5", maximumPrice: "21"})[0].id, "expensive");
  assert.equal(selectVariants(prices, {...options, minimumPrice: "30", maximumPrice: "20"}).length, 0);
  assert.equal(selectVariants(prices, {...options, minimumPrice: "broken"}).length, 3);
  assert.equal(selectVariants([{...first, quoteOnly: true}], {...options, maximumPrice: "1000"}).length, 0);
  assert.equal(referenceProfileName("Швеллер № 6.5", "shveller"), "№ 6,5");
  assert.equal(referenceProfileName("Уголок стальной 25×25×3", "ugolok"), "25×25×3");
});

test("image/specification overrides require matching category, identity and source URL", () => {
  const angle = products.find(product => product.id === "rozmet-2209")!;
  const raw = {...angle, specifications: angle.specifications.map(s => s.name === "Теоретическая масса" ? {...s, name: "Вес"} : s)};
  const displayed = applyCatalogOverrides(raw);
  assert.equal(displayed.specifications.find(s => s.name === "Теоретическая масса")?.value, "1.12 кг/м.п.");
  for (const mismatch of [{...raw, id: "unknown"}, {...raw, sourceReference: "https://example.invalid/other"}, {...raw, categoryId: "other"}]) {
    assert.equal(applyCatalogOverrides(mismatch), mismatch);
  }
  assert.equal(applyCatalogOverrides({...raw, id: "unknown", sourceReference: undefined}).id, "unknown");
  assert.equal(storefrontDescription("Компания «Розмет» предлагает швеллер. В компании «Розмет» можно заказать."), "В каталоге можно выбрать швеллер. Можно заказать.");
});

test("ordinary cart changes validate whole units, merge, and reject unknown or invalid quantities", () => {
  const piece = products.find(p => p.id.startsWith("rozmet-") && p.unit === "piece" && p.price !== null && !p.quoteOnly)!;
  assert.equal(addCartItem([], piece, 1.5).length, 0);
  let items = addCartItem([], piece, 2);
  items = addCartItem(items, piece, 3);
  assert.equal(items.length, 1);
  assert.equal(items[0].quantity, 5);
  assert.equal(updateCartItem(items, piece, 2.5), items);
  assert.equal(updateCartItem(items, piece, 6)[0].quantity, 6);
  assert.equal(addCartItem(items, undefined), items);
  assert.equal(updateCartItem(items, undefined, 3), items);
  for (const quantity of [0, -1, NaN, Infinity, 1000]) assert.equal(addCartItem(items, piece, quantity), items);
  assert.equal(addCartItem(items, {...piece, quoteOnly: true}, 1), items);
});

test("measured cart mutations ignore cached money and reprice the edited quantity", () => {
  const rebar = products.find(p => p.categoryId === "cat-arm" && !p.demo && p.diameterMm === 12 && p.inStock)!;
  const measurement = {inputMode: "meter" as const, meters: 100, weightTons: 999, pricePerTon: 1, estimatedTotal: 1};
  let items = addCartItem([], rebar, 100, measurement);
  assert.equal(items[0].measurement?.weightTons, .0888);
  assert.equal(createCartLines(items)[0].estimatedTotal, revalidateCartPrice(rebar, items[0]).estimatedTotal);
  items = updateCartItem(items, rebar, 200);
  assert.equal(items[0].measurement?.meters, 200);
  assert.equal(items[0].measurement?.weightTons, .1776);
  assert.equal(addCartItem(items, rebar, 1, {...measurement, meters: NaN}), items);
  assert.ok(revalidateCartPrice(rebar, {quantity: 1, measurement: {...measurement, inputMode: "invalid" as "meter"}}).invalidReason);
  assert.ok(revalidateCartPrice({...rebar, price: NaN}, {quantity: 1}).invalidReason);
  const unknown = createCartLines(normalizeCartItems([{productId: "removed-product", quantity: 2}]))[0];
  assert.ok(unknown.invalidReason);
});

test("profile pipes preserve selected length and reject fractional pieces", () => {
  const original = products.find(p => p.categoryId === "cat-trp" && p.lengthMeters === 6 && p.profileWidthMm === 40)!;
  const pipe: ProductVariant = {...original, price: 157, priceConfirmed: true, quoteOnly: false, priceQualifier: "exact", unit: "meter", priceUnit: "за метр"};
  const items = addCartItem([], pipe, 12, undefined, {pieces: 2, lengthMeters: 6});
  assert.equal(items[0].pieceOrder?.pieces, 2);
  assert.equal(updateCartItem(items, pipe, 15), items);
  assert.equal(updateCartItem(items, pipe, 24)[0].pieceOrder?.pieces, 4);
  assert.equal(addCartItem(items, pipe, 12, undefined, {pieces: 2, lengthMeters: 12}), items);
});
