import assert from "node:assert/strict";
import test from "node:test";
import raw from "../../data/rozmet-catalog.json";
import {getAllProductVariants} from "../../lib/catalog";
import {applyFlatSteelSpecifications} from "../../lib/flatSteel";
import {productIllustrationFacts} from "../../lib/productIllustrationFacts";
import {getVariantAttribute} from "../../lib/variantPresentation";
import {projectCartProduct, cartPricingVariant} from "../../lib/cartProjection";
import {metersToTons, tonsToMeters} from "../../lib/orderMeasurement";
import type {ProductVariant} from "../../types/product";

const strips = getAllProductVariants().filter(p => p.categoryId === "rozmet-cat-polosa");
// Checked against the ГОСТ 103-2006 table. 40×3 is geometric, 80×4 and
// 100×4 follow the all-width provision in clause 2.3. Values are kg/m.
const masses: Record<string, number> = {
  "20×4": 0.628, "25×4": 0.785, "30×4": 0.942, "40×3": 0.942, "40×4": 1.256,
  "40×5": 1.57, "50×4": 1.57, "50×5": 1.963, "60×5": 2.355, "60×6": 2.826,
  "80×4": 2.512, "80×5": 3.14, "80×6": 3.768, "80×8": 5.024, "80×10": 6.28,
  "100×4": 3.14, "100×6": 4.71, "100×8": 6.28, "100×10": 7.85,
};

test("all flat bars expose one consistent section, delivery length and theoretical mass", () => {
  assert.equal(strips.length, 19);
  for (const p of strips) {
    const section = p.name.match(/(\d+)×(\d+)/)!;
    const specs = Object.fromEntries(p.specifications.map(s => [s.name, s.value]));
    assert.equal(p.weightPerMeterKg, masses[section[0]], p.id);
    assert.equal(p.weightConfirmed, true);
    assert.equal(specs["Ширина"], section[1] + " мм");
    assert.equal(specs["Толщина"], section[2] + " мм");
    assert.equal(getVariantAttribute(p, "size"), section[0] + " мм");
    const length = section[0] === "100×4" ? "5,85–6 м" : "6 м";
    assert.equal(getVariantAttribute(p, "length"), length);
    assert.equal(specs["Длина по каталогу"], length);
    assert.equal(specs["Теоретическая масса"], masses[section[0]].toLocaleString("ru-RU") + " кг/м");
    assert.equal(specs["Вес"], undefined);
    const facts = productIllustrationFacts(p);
    assert.equal(facts.filter(s => /Масса/.test(s.name)).length, 1);
    assert.equal(facts.find(s => s.name === "Длина")?.value, length);
    assert.doesNotMatch(p.description, /103-76|прочнее|коррозионная стойкость|100х8/iu);
    assert.match(p.shortDescription, new RegExp(`шириной ${section[1]} мм и толщиной ${section[2]} мм`));
    assert.equal(p.standard, "", "A dimensional calculation cannot certify a shipment");
  }
  const ranged = strips.find(p => p.id === "rozmet-12050")!;
  assert.equal(ranged.lengthMeters, undefined);
  assert.deepEqual(ranged.lengthRangeMeters, [5.85, 6]);
});

test("verified mass survives cart projection and metre/tonne conversion", () => {
  const p = cartPricingVariant(projectCartProduct(strips.find(p => p.id === "rozmet-28975")!));
  assert.equal(p.weightPerMeterKg, 3.14);
  assert.equal(metersToTons(100, p.weightPerMeterKg!), 0.314);
  assert.equal(tonsToMeters(0.314, p.weightPerMeterKg!), 100);
});

test("flat-steel evidence is tied to the same source and nominal size", () => {
  const original = raw.products.find(p => p.id === "rozmet-28975") as ProductVariant;
  const changedSource = {...original, sourceReference: "https://example.com/new-source"};
  assert.equal(applyFlatSteelSpecifications(changedSource).weightPerMeterKg, undefined);
  const changedSize = {...original, name: "Полоса 80×6"};
  assert.equal(applyFlatSteelSpecifications(changedSize).weightPerMeterKg, undefined);
  const published = strips.find(p => p.id === original.id)!;
  assert.deepEqual(applyFlatSteelSpecifications(published), published);
});
