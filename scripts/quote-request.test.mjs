import test from 'node:test';
import assert from 'node:assert/strict';
import {readProjectData} from './project-data.mjs';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const {buildQuoteMessage, formatQuoteProductName} = readProjectData('lib/quoteRequest.ts');

test('rebar quote names express bar length in metres and diameter in millimetres', () => {
  assert.equal(formatQuoteProductName({name: 'Арматура 6х6000 А1 ГОСТ 34028', diameterMm: 6, lengthMeters: 6}), 'Арматура 6 мм, длина 6 м А1 ГОСТ 34028');
  assert.equal(formatQuoteProductName({name: 'Арматура 12x11700 А500С', diameterMm: 12, lengthMeters: 11.7}), 'Арматура 12 мм, длина 11,7 м А500С');
  assert.equal(formatQuoteProductName({name: 'Лист 6х6000'}), 'Лист 6х6000');
  assert.equal(formatQuoteProductName({name: 'Арматура 6 мм в бунтах', diameterMm: 6}), 'Арматура 6 мм в бунтах');
  assert.equal(formatQuoteProductName({name: 'Балка 25Ш1х12000 ГОСТ 35087', lengthMeters: 12}), 'Балка 25Ш1, длина 12 м ГОСТ 35087');
});

test('quote request includes product and either or both measurements', () => {
  const product = 'Арматура А500С 12 мм';
  assert.equal(buildQuoteMessage({product}), `Прошу рассчитать поставку:\nНаименование: ${product}`);
  assert.equal(buildQuoteMessage({product, meters: 100}), `Прошу рассчитать поставку:\nНаименование: ${product}\nОбщая длина: 100 м`);
  assert.equal(buildQuoteMessage({product, tons: 0.5}), `Прошу рассчитать поставку:\nНаименование: ${product}\nВес: 0,5 т`);
  assert.equal(buildQuoteMessage({product, meters: 100, tons: 0.0888}), `Прошу рассчитать поставку:\nНаименование: ${product}\nОбщая длина: 100 м\nВес: 0,089 т`);
  assert.ok(buildQuoteMessage({product, meters: 1, tons: 0.000222}).includes('Вес: 0,000222 т'));
});

test('quote request excludes empty, zero and invalid quantities and preserves generic units', () => {
  const product = 'Лист';
  assert.equal(buildQuoteMessage({product, meters: NaN, tons: 0, quantity: -1, unit: 'лист'}), 'Прошу рассчитать поставку:\nНаименование: Лист');
  assert.equal(buildQuoteMessage({product, quantity: 5, unit: 'лист'}), 'Прошу рассчитать поставку:\nНаименование: Лист\nКоличество: 5 лист');
  assert.equal(buildQuoteMessage({product, meters: null, tons: Infinity}), 'Прошу рассчитать поставку:\nНаименование: Лист');
});

test('quote button targets the local form, scrolls on every click and replaces the requested product', () => {
  const messages = [];
  let scrolls = 0;
  const module = {exports: {}};
  const imports = {
    'react/jsx-runtime': {jsx: (type, props) => ({type, props})},
    '@/components/ui/Button': {ButtonLink: 'link'},
    '@/components/forms/QuoteRequestContext': {useQuoteRequest: () => ({request: message => messages.push(message)})},
    '@/lib/quoteRequest': {buildQuoteMessage},
  };
  const source = ts.transpileModule(fs.readFileSync('components/catalog/QuoteRequestButton.tsx', 'utf8'), {
    compilerOptions: {module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX},
  }).outputText;
  vm.runInNewContext(source, {module, exports: module.exports, require: name => {
    assert.ok(name in imports, name); return imports[name];
  }, document: {getElementById(id) {assert.equal(id, 'request'); return {scrollIntoView() {scrolls++;}};}}});
  const button = (order, label) => module.exports.QuoteRequestButton({order, label, className: ''}).props;
  const first = button({product: 'Арматура', meters: 100, tons: 0.089});
  assert.equal(first.href, '#request');
  let prevented = 0;
  const click = () => ({preventDefault() {prevented++;}});
  first.onClick(click()); first.onClick(click());
  button({product: 'Лист', quantity: 5, unit: 'лист'}).onClick(click());
  assert.equal(scrolls, 3);
  assert.ok(messages[0].includes('Общая длина: 100 м'));
  assert.ok(messages[0].includes('Вес: 0,089 т'));
  assert.equal(messages[2], 'Прошу рассчитать поставку:\nНаименование: Лист\nКоличество: 5 лист');
  first.onClick({ctrlKey: true}); assert.equal(scrolls, 3);
  const onOrder = button({product: 'Арматура под заказ', meters: 100, tons: 0.089}, 'Под заказ');
  assert.equal(onOrder.children, 'Под заказ');
  assert.equal(onOrder.href, '#request');
  onOrder.onClick(click());
  assert.equal(scrolls, 4);
  assert.equal(prevented, 4);
  assert.ok(messages[3].includes('Арматура под заказ\nОбщая длина: 100 м\nВес: 0,089 т'));
});
