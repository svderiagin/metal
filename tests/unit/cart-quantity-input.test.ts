import test from "node:test";
import assert from "node:assert/strict";
import {formatCartQuantity, formatEditableCartQuantity, normalizeCartQuantityDraft,
  normalizeCartQuantityText, stepCartQuantity} from "../../lib/cartQuantityInput";
import {correctOrderQuantity, formatCatalogNumber, parseOrderQuantity} from "../../lib/catalogNumberInput";
import {getProductVariantById} from "../../lib/cartCatalog";
import {getMeasurementQuantityOptions, metersToTons} from "../../lib/orderMeasurement";

test("live drafts preserve unfinished decimals and fractional zeros while removing leading zeros", () => {
  for (const [raw, expected] of [
    ["", ""], [" ", ""], ["0", "0"], ["0000000", "0"], ["00012", "12"],
    ["0,", "0,"], ["1.", "1,"], [".", "0,"], [",", "0,"], [".125", "0,125"],
    ["00000,50", "0,50"], ["00.50", "0,50"], ["0012.3400", "12,3400"],
    ["0.00000222", "0,00000222"],
  ]) {
    const result = normalizeCartQuantityDraft(raw, raw.length, raw.length, {maximum: 9999});
    assert.equal(result.accepted, true, raw);
    assert.equal(result.value, expected, raw);
    assert.equal(result.selectionStart, expected.length, raw);
    assert.equal(result.selectionEnd, expected.length, raw);
    assert.equal(result.message, undefined, raw);
  }
});

test("pasted grouping accepts Russian spaces without joining separate numbers or cells", () => {
  for (const [raw, expected] of [
    ["1 234", "1234"], ["1\u00a0234", "1234"], ["1\u202f234", "1234"], ["1\u2009234", "1234"],
    ["1  234", "1234"], [" 12 345,60 ", "12345,60"], ["1 234 567.89", "1234567,89"],
    ["000 123,40", "123,40"], ["1,234", "1,234"],
  ]) {
    const result = normalizeCartQuantityDraft(raw, raw.length, raw.length);
    assert.equal(result.accepted, true, raw);
    assert.equal(result.value, expected, raw);
    assert.equal(parseOrderQuantity(result.value), Number(expected.replace(",", ".")), raw);
  }
  assert.equal(normalizeCartQuantityText(" \u00a01\u00a0\u202f234\u2009 567,80 \u00a0"), "1 234 567,80");
  assert.equal(normalizeCartQuantityText("1\t2"), "1\t2");
  assert.equal(normalizeCartQuantityText("1\n2"), "1\n2");
});

test("letters, signs, operators and ambiguous pasted numbers are rejected without extracting digits", () => {
  for (const raw of [
    "1a2", "1e2", "0x10", "1+2", "1-2", "1/2", "1*2", "1×2", "2**3", "=12", "(12)",
    "-1", "-0", "+1", "−1", "12 кг", "₽12", "12₽", "12%", "NaN", "Infinity", "∞",
    "1,2.3", "1..2", "1,,2", "1,234.56", "1.234,56", "12 34", "1 2", "1 23 456", "12 345 67",
    "1 ,2", "1. 2", "1\n2", "1\r2", "1\t2", "1🙂2", "1\u200b2", "99999x",
  ]) {
    const result = normalizeCartQuantityDraft(raw, 1, raw.length, {maximum: 999});
    assert.equal(result.accepted, false, raw);
    assert.equal(result.value, raw, raw);
    assert.equal(result.selectionStart, 1, raw);
    assert.equal(result.selectionEnd, raw.length, raw);
    assert.ok(result.message, raw);
  }
});

test("draft normalization maps the selection and leaves nonnumeric composition text untouched", () => {
  for (const [raw, start, end, value, nextStart, nextEnd] of [
    ["1\u202f234,50", 2, 5, "1234,50", 1, 4],
    ["  0012.50 ", 4, 8, "12,50", 0, 4],
    [".25", 0, 3, "0,25", 1, 4],
    ["0007", 1, 3, "7", 0, 0],
    ["0000", 4, 4, "0", 1, 1],
    ["0.0500", 2, 6, "0,0500", 2, 6],
    [".25", null, null, "0,25", null, null],
  ] as const) {
    const result = normalizeCartQuantityDraft(raw, start, end);
    assert.equal(result.accepted, true, raw);
    assert.equal(result.value, value, raw);
    assert.equal(result.selectionStart, nextStart, raw);
    assert.equal(result.selectionEnd, nextEnd, raw);
  }
  // The helper validates completed text; native composition buffering belongs to the component.
  for (const raw of ["１２", "١٢", "1に2"]) {
    const result = normalizeCartQuantityDraft(raw, 1, 2);
    assert.equal(result.accepted, false, raw);
    assert.equal(result.value, raw, raw);
    assert.equal(result.selectionStart, 1, raw);
    assert.equal(result.selectionEnd, 2, raw);
  }
});

test("overflow clamps a valid number to the exact product ceiling and puts the caret at its end", () => {
  for (const [raw, maximum, expected] of [
    ["99999", 999, "999"], ["9".repeat(400), 9999, "9999"],
    ["9 999 999", 2.219778, "2,219778"], ["2,2197781", 2.219778, "2,219778"],
    ["0,00000222000001", 0.00000222, "0,00000222"],
  ] as const) {
    const result = normalizeCartQuantityDraft(raw, 0, raw.length, {maximum});
    assert.equal(result.accepted, true, raw.slice(0, 30));
    assert.equal(result.value, expected);
    assert.equal(result.selectionStart, expected.length);
    assert.equal(result.selectionEnd, expected.length);
    assert.ok(result.message);
  }
  const boundary = normalizeCartQuantityDraft("2,219778", 3, 3, {maximum: 2.219778});
  assert.equal(boundary.value, "2,219778");
  assert.equal(boundary.message, undefined);
});

test("commit corrections respect whole units and product bounds while preserving exact saved fallback", () => {
  const whole = {whole: true, minimum: 1, maximum: 999, fallback: 7};
  for (const [raw, expected] of [["", "7"], ["abc", "7"], ["12 34", "7"],
    ["0", "1"], ["-1", "1"], ["2,01", "3"], ["998,1", "999"], ["999,1", "999"]]) {
    assert.equal(correctOrderQuantity(raw, whole).value, expected, raw);
  }
  assert.equal(correctOrderQuantity("1,005", {minimum: 0.01, maximum: 9999, decimalPlaces: 2}).value, "1.01");
  assert.equal(correctOrderQuantity("0,001", {minimum: 0.01, maximum: 9999, decimalPlaces: 2}).value, "0.01");
  assert.equal(correctOrderQuantity("10000", {minimum: 0.01, maximum: 9999, decimalPlaces: 2}).value, "9999");
  assert.equal(correctOrderQuantity("", {minimum: 0.00000222, maximum: 2.219778,
    decimalPlaces: 3, fallback: 0.002775}).value, "0.002775");
  assert.equal(correctOrderQuantity("0,00000222", {minimum: 0.00000222, maximum: 2.219778}).value, "0.00000222");
  assert.equal(correctOrderQuantity("0,0001", {maximum: 999}).value, "0.0001");
});

test("decimal steps are exact, reversible and separately constrained at the physical bounds", () => {
  for (const [value, step, direction, expected] of [
    [0.1, 0.001, 1, 0.101], [0.101, 0.001, -1, 0.1],
    [0.002775, 0.001, 1, 0.003775], [0.002775, 0.001, -1, 0.001775],
    [0.00000222, 0.001, 1, 0.00100222], [1.005, 0.01, 1, 1.015], [1.015, 0.01, -1, 1.005],
    [0.3, 0.1, -1, 0.2], [7.5, 1, -1, 6.5], [9998, 1, 1, 9999],
    [0, 0.001, -1, -0.001], [1.2e-7, 1e-9, 1, 1.21e-7],
  ]) {
    assert.equal(stepCartQuantity(value, step, direction), expected, `${value} / ${step} / ${direction}`);
  }
  for (const [value, step] of [[0.1, 0.001], [0.00000222, 0.001], [7.5, 0.5], [9998, 1]]) {
    assert.equal(stepCartQuantity(stepCartQuantity(value, step, 1), step, -1), value);
  }
  assert.equal(correctOrderQuantity(String(stepCartQuantity(9999, 1, 1)), {maximum: 9999}).value, "9999");
  assert.equal(correctOrderQuantity(String(stepCartQuantity(1, 1, -1)), {minimum: 1, whole: true}).value, "1");
});

test("Russian display and editable formatting round-trip tiny and large quantities without scientific notation", () => {
  assert.equal(formatCartQuantity(1234567.89), "1\u202f234\u202f567,89");
  assert.equal(formatEditableCartQuantity(1234567.89), "1234567,89");
  assert.equal(formatEditableCartQuantity(0.00000222), "0,00000222");
  for (const value of [0, 1, 12.5, 9999, 1234567.8901, 0.00000222, 1e-25, Number.MIN_VALUE, 1e21]) {
    const display = formatCartQuantity(value);
    const editable = formatEditableCartQuantity(value);
    assert.doesNotMatch(display, /[eE]/u);
    assert.doesNotMatch(editable, /[eE\s]/u);
    assert.equal(parseOrderQuantity(normalizeCartQuantityText(display)), value, display);
    assert.equal(parseOrderQuantity(editable), value, editable);
  }
  for (const raw of ["0", "00", "0,000"]) assert.equal(parseOrderQuantity(raw), 0);
  for (const raw of ["-0", "-0,00", "9".repeat(400), `0.${"0".repeat(400)}1`]) {
    assert.equal(parseOrderQuantity(raw), null, raw.slice(0, 30));
  }
});

test("a recurring metre boundary retains 999 tonnes exactly and decimal rounding cannot cross it", () => {
  const product = getProductVariantById("rebar-a500c-10-coil");
  assert.ok(product);
  assert.equal(product.weightPerMeterKg, 0.617);
  const options = getMeasurementQuantityOptions(product, "meter");
  assert.equal(options.maximum, 999000 / 0.617);
  assert.equal(options.decimalPlaces, 2);
  assert.equal(getMeasurementQuantityOptions(product, "ton").maximum, 999);
  const exactBoundary = correctOrderQuantity(formatCatalogNumber(options.maximum), options);
  assert.equal(parseOrderQuantity(exactBoundary.value), options.maximum);
  assert.equal(exactBoundary.message, undefined);

  // Ordinary rounding to two decimals would exceed the converted mass ceiling here.
  assert.ok(1619124.797 < options.maximum);
  const rounded = correctOrderQuantity("1619124.797", options);
  const meters = parseOrderQuantity(rounded.value);
  assert.equal(meters, options.maximum);
  assert.ok(meters !== null && meters < 1619124.8);
  assert.ok(rounded.message);
  const tons = metersToTons(meters, product.weightPerMeterKg!);
  assert.ok(tons !== null && Math.abs(tons - 999) < 1e-10);
});
