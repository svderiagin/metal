import assert from "node:assert/strict";
import test from "node:test";
import raw from "../../data/imported-catalog.json";
import imageManifest from "../../imports/electrowelded-image-template/rendered.json";
import {createCartLines, normalizeCartItems} from "../../lib/cart";
import {getProductVariantById} from "../../lib/cartCatalog";
import {addCartItem, updateCartItem} from "../../lib/cartMutations";
import {getAllProductVariants} from "../../lib/catalog";
import {isWholePipeVariant} from "../../lib/pipeFamily";
import {getProductIllustration} from "../../lib/productPreviewImage";
import {createCatalogSearchIndex} from "../../lib/search";
import {createTrustedOrder} from "../../lib/server/orders";
import type {ProductVariant} from "../../types/product";

const pipes = getAllProductVariants().filter(product => product.subcategoryId === "cat-trk-sub-2");
const sourceById = new Map((raw.products as ProductVariant[]).map(product => [product.id, product]));
const imageById = new Map(imageManifest.results.map(image => [image.id, image]));
const rangedIds = new Set(["local-58627", "local-58631", "local-58634"]);
const grade20Ids = new Set(["local-53918", "local-58627", "local-58631", "local-58634", "local-62388"]);

test("ordinary electrowelded pipe facts agree with the checked dimensions and mass on the existing illustrations", () => {
  assert.equal(pipes.length, 20);
  assert.ok(pipes.every(pipe => pipe.imported));
  assert.ok(pipes.every(pipe => !["prd-073", "prd-074"].includes(pipe.id)));

  for (const pipe of pipes) {
    const source = sourceById.get(pipe.id);
    const image = imageById.get(pipe.id);
    assert.ok(source && image, pipe.id);
    assert.equal(pipe.sourceProductName, source.name, pipe.id);
    assert.equal(pipe.diameterMm, image.diameterMm, pipe.id);
    assert.equal(pipe.wallThicknessMm, image.wallThicknessMm, pipe.id);
    assert.equal(pipe.nominalBoreMm, undefined, pipe.id);
    assert.equal(pipe.weightPerMeterKg, image.weightPerMeterKg, pipe.id);
    assert.deepEqual(pipe.weight, {value: image.weightPerMeterKg, unit: "кг/м"}, pipe.id);
    assert.equal(pipe.steelGrade, grade20Ids.has(pipe.id) ? "20" : undefined, pipe.id);
    assert.equal(pipe.standard, "ГОСТ 10704-91; ГОСТ 10705-80", pipe.id);
    const illustration = getProductIllustration(pipe);
    assert.ok(illustration, pipe.id);
    assert.equal(`public${illustration.imageUrl}`, image.output, pipe.id);

    for (const key of ["sku", "slug", "categoryId", "subcategoryId", "productTypeId", "price", "pricePerTon",
      "priceUnit", "unit", "quoteOnly", "priceQualifier", "availability", "inStock"] as const) {
      assert.equal(pipe[key], source[key], `${pipe.id}: ${key}`);
    }
    const length = rangedIds.has(pipe.id) ? undefined : pipe.id === "local-125936" ? 6 : 12;
    assert.equal(pipe.lengthMeters, length, pipe.id);
    assert.deepEqual(pipe.lengthRangeMeters, rangedIds.has(pipe.id) ? [11, 12] : undefined, pipe.id);
    assert.equal(image.lengthLabel, length === undefined ? "11–12 м" : `${length} м`, pipe.id);
  }
});

test("catalog search preserves the supplier's steel spelling and complete size designation", () => {
  const index = createCatalogSearchIndex(pipes);
  const matchingIds = (query: string) => new Set(index.search(query).hits.map(hit => hit.product.id));
  assert.deepEqual(matchingIds("Ст20"), grade20Ids);
  assert.deepEqual(matchingIds("57 × 3 × 12000"), new Set(["local-302", "local-62388"]));
  assert.equal(matchingIds("ГОСТ 10705-80").size, pipes.length);
});

test("an existing tonne line uses the current section mass and remains editable in metres and tonnes", () => {
  const pipe = getProductVariantById("local-302");
  assert.ok(pipe);
  assert.equal(isWholePipeVariant(pipe), false);
  const legacy = normalizeCartItems([{productId: pipe.id, quantity: 0.05}]);
  const restored = createCartLines(legacy)[0];
  assert.equal(legacy[0].measurement, undefined);
  assert.equal(restored.invalidReason, undefined);
  assert.equal(restored.measurement?.meters, 12.5);
  assert.equal(restored.estimatedTotal, 2547);

  const byMetres = updateCartItem(legacy, pipe, 13.25, "meter");
  assert.deepEqual(byMetres[0].measurement, {inputMode: "meter", meters: 13.25, weightTons: 0.053,
    pricePerTon: 50940, estimatedTotal: 2699.82});
  const byTonnes = updateCartItem(byMetres, pipe, 0.05, "ton");
  assert.deepEqual(byTonnes[0].measurement, {inputMode: "ton", meters: 12.5, weightTons: 0.05,
    pricePerTon: 50940, estimatedTotal: 2547});
});

test("checkout reprices ranged lengths from total metres and keeps offers without a price on request", () => {
  const pipe = getProductVariantById("local-58627");
  const quote = getProductVariantById("local-58631");
  assert.ok(pipe && quote);
  assert.deepEqual(pipe.lengthRangeMeters, [11, 12]);
  assert.equal(isWholePipeVariant(pipe), false);
  const input = {
    customer: {type: "INDIVIDUAL" as const, fullName: "Тест", email: "test@example.invalid", phone: "+79000000000"},
    delivery: {address: "Тестовый адрес"}, paymentMethod: "INVOICE" as const, consent: true,
    items: [{productId: pipe.id, quantity: 12.5, measurement: {inputMode: "meter" as const, meters: 12.5, weightTons: 0.001}}],
  };
  const order = createTrustedOrder(input);
  assert.ok(order);
  assert.equal(order.items[0].measurement?.meters, 12.5);
  assert.equal(order.items[0].measurement?.weightTons, 0.6535);
  assert.equal(order.items[0].subtotal, 36230.04);
  assert.equal(quote.quoteOnly, true);
  assert.deepEqual(addCartItem([], quote, 1), []);
  assert.equal(createTrustedOrder({...input, items: [{productId: quote.id, quantity: 1}]}), null);
});
