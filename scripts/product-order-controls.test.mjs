import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

// Render the real component and exercise its event handlers with a cart boundary.
function setup(overrides = {}) {
  let cursor = 0;
  const state = [];
  const timers = [];
  const calls = [];
  const cart = {
    lines: [], hydrated: true,
    addItem(id, quantity) { calls.push('add'); cart.lines.push({productId: id, quantity}); },
    updateQuantity(id, quantity) { calls.push('update'); cart.lines.find(l => l.productId === id).quantity = quantity; },
    removeItem(id) { calls.push('remove'); cart.lines = cart.lines.filter(l => l.productId !== id); },
  };
  const jsx = (type, props) => ({type, props});
  const imports = {
    react: {
      useState(initial) { const i = cursor++; if (!(i in state)) state[i] = initial; return [state[i], value => {state[i] = value;}]; },
      useEffect(effect) { effect(); },
    },
    'react/jsx-runtime': {jsx, jsxs: jsx, Fragment: 'fragment'},
    '@/hooks/useCart': {useCart: () => cart},
    '@/components/ui/Button': {Button: 'button', ButtonLink: 'link'},
    '@/components/ui/Input': {Input: 'input'},
    '@/lib/variantPresentation': {getQuantityUnit: () => 'т'},
    './FilterPanel.module.css': new Proxy({}, {get: (_, key) => key}),
  };
  const module = {exports: {}};
  const source = ts.transpileModule(fs.readFileSync('components/catalog/ProductOrderControls.tsx', 'utf8'), {
    compilerOptions: {module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX},
  }).outputText;
  vm.runInNewContext(source, {module, exports: module.exports, require: name => {
    assert(name in imports, name); return imports[name];
  }, window: {setTimeout: fn => {timers.push(fn); return timers.length;}, clearTimeout() {}}});
  const variant = {id: 'product', name: 'Товар', price: 100, inStock: true, ...overrides};
  function nodes(node) { return !node || typeof node !== 'object' ? [] : [node, ...[node.props?.children].flat().flatMap(nodes)]; }
  function render() {
    cursor = 0;
    const tree = nodes(module.exports.ProductOrderControls({variant, view: 'table'}));
    return {input: tree.find(n => n.type === 'input').props, action: tree.find(n => n.type === 'button' || n.type === 'link').props};
  }
  return {cart, calls, timers, render, change: value => render().input.onChange({target: {value}})};
}

test('add, replace quantity, restore saved state, delete zero and show removed for one second', () => {
  const h = setup();
  assert.equal(h.render().action.children, 'В корзину');
  h.change('2'); h.render().action.onClick();
  assert.equal(h.render().action.children, '✓ В корзине');
  assert.equal(h.render().action.disabled, true);
  h.change('3.5'); assert.equal(h.render().action.children, 'Обновить');
  h.render().action.onClick();
  assert.equal(h.cart.lines.length, 1);
  assert.equal(h.cart.lines[0].quantity, 3.5);
  assert.deepEqual(h.calls, ['add', 'update']);
  h.change(''); assert.equal(h.render().action.disabled, true);
  h.change('0'); assert.equal(h.render().action.children, 'Удалить');
  h.render().action.onClick();
  assert.equal(h.cart.lines.length, 0);
  assert.equal(h.render().action.children, 'Удалено');
  h.timers.at(-1)(); assert.equal(h.render().action.children, 'В корзину');
});

test('saved cart quantity, hydration, stock, quote and invalid input are respected', () => {
  const h = setup(); h.cart.lines = [{productId: 'product', quantity: 7}];
  assert.equal(h.render().input.value, '7');
  assert.equal(h.render().action.children, '✓ В корзине');
  h.change('1000'); assert.equal(h.render().action.disabled, true);
  h.change('2'); h.cart.hydrated = false; assert.equal(h.render().action.disabled, true);
  assert.equal(setup({inStock: false}).render().action.children, 'Под заказ');
  assert.equal(setup({quoteOnly: true}).render().action.children, 'Запросить цену');
  assert.equal(setup({price: null}).render().action.children, 'Запросить цену');
  assert.equal(setup({priceQualifier: 'from'}).render().action.children, 'Запйцуросить цену');
});
