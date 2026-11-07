import assert from "node:assert/strict";
import test from "node:test";
import {constrainOrderQuantityInput, correctOrderQuantity, parseCatalogNumber, parseOrderQuantity} from "../../lib/catalogNumberInput";

test("catalog decimals accept either separator and correctly grouped digits", () => {
  assert.equal(parseCatalogNumber("1\u202f234,5"), 1234.5);
  assert.equal(parseCatalogNumber(" .5 "), 0.5);
  for (const invalid of ["", "12 34", "1e2", "0x10", "5 кг", "1,234.5", "9".repeat(400)]) {
    assert.equal(parseCatalogNumber(invalid), null, invalid);
  }
});

test("quantity limits apply while typing without destroying an unfinished decimal", () => {
  assert.equal(constrainOrderQuantityInput("0000000", 999).value, "0");
  assert.equal(constrainOrderQuantityInput("0005", 999).value, "5");
  for (const value of ["99999", "1 000", "9".repeat(400), "999,1"]) {
    assert.equal(constrainOrderQuantityInput(value, 999).value, "999");
  }
  for (const value of ["", "0,", "1.0", "1,05", ".", ",", "-000", "1e3", "abc"]) {
    assert.equal(constrainOrderQuantityInput(value, 999).value, value);
  }
  assert.equal(constrainOrderQuantityInput("00,5", 999).value, "0,5");
});

test("order corrections preserve only explicit zero for removal", () => {
  assert.equal(parseOrderQuantity("0,00"), 0);
  for (const invalid of ["-0", "-1", "-", "0." + "0".repeat(400) + "1"]) {
    assert.equal(parseOrderQuantity(invalid), null, invalid);
    assert.equal(correctOrderQuantity(invalid, {whole: true, maximum: 999}).value, "");
  }
  assert.deepEqual(correctOrderQuantity("", {whole: true}), {value: ""});
  assert.equal(correctOrderQuantity("0,5", {whole: true}).value, "1");
  assert.equal(correctOrderQuantity("1 000", {whole: true, maximum: 999}).value, "999");
  assert.equal(correctOrderQuantity("0,003", {decimalPlaces: 2}).value, "");
  assert.equal(correctOrderQuantity("1,236", {decimalPlaces: 2}).value, "1.24");
  assert.equal(correctOrderQuantity("1,005", {decimalPlaces: 2}).value, "1.01");
  assert.equal(correctOrderQuantity("0,000001", {maximum: 999}).value, "0.000001");
});
