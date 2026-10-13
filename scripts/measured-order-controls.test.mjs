import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {readProjectData} from './project-data.mjs';

const {productVariants} = readProjectData('data/products/index.ts');
function setup(id, kind = 'beam') {
  const variant = productVariants.find(p => p.id === id);
  assert.ok(variant, id);
  let cursor = 0;
  const state = [];
  const timers = [];
  const cart = {
    hydrated: true, lines: [],
    addItem(productId, quantity, measurement) {
      const line = cart.lines.find(l => l.productId === productId);
      if (line && !measurement) line.quantity += quantity;
      else cart.lines = [...cart.lines.filter(l => l.productId !== productId), {productId, quantity, measurement}];
    },
    updateQuantity(productId, quantity) {cart.lines.find(l => l.productId === productId).quantity = quantity;},
    removeItem(productId) {cart.lines = cart.lines.filter(l => l.productId !== productId);},
  };
  const jsx = (type, props) => typeof type === 'function' ? type(props) : type === 'quote'
    ? {type: 'link', props: {...props, children: props.label}} : {type, props};
  const imports = {
    react: {
      useState(initial) {const i = cursor++; if (!(i in state)) state[i] = initial; return [state[i], value => {state[i] = value;}];},
      useEffect(effect) {effect();},
    },
    'react/jsx-runtime': {jsx, jsxs: jsx},
    '@/lib/beam': readProjectData('lib/beam.ts'),
    '@/lib/quoteRequest': readProjectData('lib/quoteRequest.ts'),
    '@/lib/orderMeasurement': readProjectData('lib/orderMeasurement.ts'),
    '@/lib/currency': readProjectData('lib/currency.ts'),
    '@/lib/numberFormat': readProjectData('lib/numberFormat.ts'),
    '@/hooks/useCart': {useCart: () => cart},
    '@/components/ui/Button': {Button: 'button'},
    '@/components/ui/Input': {Input: 'input'},
    './QuoteRequestButton': {QuoteRequestButton: 'quote'},
    './CatalogImage': {CatalogImage: 'image'},
    './FilterPanel.module.css': {default: {}}, './RebarTable.module.css': {default: {}},
  };
  const module = {exports: {}};
  const source = ts.transpileModule(fs.readFileSync('components/catalog/MeasuredVariantItem.tsx', 'utf8'), {
    compilerOptions: {module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX},
  }).outputText;
  vm.runInNewContext(source, {module, exports: module.exports, require: name => {assert.ok(name in imports, name); return imports[name];},
    window: {setTimeout(fn) {timers.push(fn); return timers.length;}, clearTimeout() {}},
  });
  function nodes(node) {return !node || typeof node !== 'object' ? [] : [node, ...[node.props?.children].flat().flatMap(nodes)];}
  function render() {
    cursor = 0;
    const tree = nodes(module.exports.MeasuredVariantItem({variant, kind, view: 'table'}));
    return {inputs: tree.filter(n => n.type === 'input').map(n => n.props), action: tree.find(n => ['button', 'link'].includes(n.type)).props};
  }
  return {cart, timers, render, change(index, value) {render().inputs[index].onChange({target: {value}});}};
}

test('beam reference table converts, adds, replaces and deletes a measured order', () => {
  const h = setup('local-122247');
  h.change(0, '100'); assert.equal(h.render().inputs[1].value, '4.42');
  h.render().action.onClick(); assert.equal(h.render().action.children, '✓ В корзине');
  assert.equal(h.cart.lines[0].measurement.weightTons, 4.42);
  h.change(1, '8.84'); assert.equal(h.render().inputs[0].value, '200');
  assert.equal(h.render().action.children, 'Обновить');
  h.render().action.onClick(); assert.equal(h.cart.lines.length, 1);
  assert.equal(h.cart.lines[0].measurement.meters, 200);
  h.change(0, '0'); assert.equal(h.render().action.children, 'Удалить');
  h.render().action.onClick(); assert.equal(h.cart.lines.length, 0);
  assert.equal(h.render().action.children, 'Удалено');
  h.timers.at(-1)(); assert.equal(h.render().action.children, 'В корзину');
});

test('missing mass never fabricates conversion; tonne orders still replace and metre orders request quotes', () => {
  const h = setup('local-65599');
  h.change(1, '2'); assert.equal(h.render().inputs[0].value, '');
  h.render().action.onClick(); assert.equal(h.render().action.children, '✓ В корзине');
  h.change(1, '3'); h.render().action.onClick();
  assert.equal(h.cart.lines.length, 1); assert.equal(h.cart.lines[0].quantity, 3);
  h.change(0, '100');
  assert.equal(h.render().action.children, 'Запросить цену');
  assert.equal(h.render().action.order.meters, 100);
  assert.equal(h.render().action.order.tons, 3);
  h.change(0, '0'); assert.equal(h.render().action.children, 'Удалить');
  assert.equal(h.render().action.disabled, false);
  h.render().action.onClick(); assert.equal(h.cart.lines.length, 0);
});

test('existing generic tonne carts hydrate into measured controls and rebar keeps its precision', () => {
  const h = setup('local-122247');
  h.cart.lines = [{productId: 'local-122247', quantity: 4.42}];
  assert.equal(h.render().inputs[0].value, '100');
  assert.equal(h.render().action.children, '✓ В корзине');
  h.change(0, '200'); h.render().action.onClick();
  assert.equal(h.cart.lines.length, 1);
  assert.equal(h.cart.lines[0].measurement.weightTons, 8.84);
  const rebar = productVariants.find(p => p.categoryId === 'cat-arm' && p.diameterMm === 6 && p.pricePerTon && !p.quoteOnly);
  const r = setup(rebar.id, 'rebar'); r.change(0, '100');
  assert.equal(r.render().inputs[1].value, '0.022');
  r.render().action.onClick();
  assert.ok(Math.abs(r.cart.lines[0].measurement.weightTons - 0.0222) < 1e-12);
});
