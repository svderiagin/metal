import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {readProjectData} from './project-data.mjs';

// Render the real component and exercise its event handlers with a cart boundary.
function setup(overrides = {}, componentProps = {}) {
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
  const jsx = (type, props) => typeof type === 'function' ? type(props) : type === 'quote'
    ? {type: 'link', props: {...props, children: props.label ?? 'Запросить цену'}}
    : {type, props};
  const imports = {
    react: {
      useState(initial) { const i = cursor++; if (!(i in state)) state[i] = initial; return [state[i], value => {state[i] = value;}]; },
      useEffect(effect) { effect(); },
    },
    // Keep the legacy local state slots; shared drafts are exercised in browser tests.
    './OrderDraftProvider': {
      useOrderDraft(...args) {
        const [draft, setDraft] = imports.react.useState(null);
        const [message, setMessage] = imports.react.useState(args[2]);
        return {draft, setDraft, message, setMessage};
      },
    },
    'react/jsx-runtime': {jsx, jsxs: jsx, Fragment: 'fragment'},
    '@/hooks/useCart': {useCart: () => cart},
    '@/components/ui/Button': {Button: 'button', ButtonLink: 'link'},
    '@/components/ui/Input': {Input: 'input'},
    '@/components/ui/Icon': {Icon: () => null},
    '@/lib/variantPresentation': {getQuantityUnit: () => 'т', requiresWholeRozmetQuantity: () => false},
    './QuoteRequestButton': {QuoteRequestButton: 'quote'},
    '@/lib/quoteRequest': readProjectData('lib/quoteRequest.ts'),
    '@/lib/orderMeasurement': readProjectData('lib/orderMeasurement.ts'),
    '@/lib/catalogNumberInput': readProjectData('lib/catalogNumberInput.ts'),
    '@/lib/catalogOffer': readProjectData('lib/catalogOffer.ts'),
    '@/lib/currency': readProjectData('lib/currency.ts'),
    './CatalogVariantLayout': {
      CatalogVariantOrder: ({quantity, action, total, status}) => jsx('order', {children: [quantity, total, action, status]}),
      CatalogVariantQuantity: ({unit, children}) => jsx('quantity', {children: [children, jsx('unit', {children: unit})]}),
    },
    './FilterPanel.module.css': new Proxy({}, {get: (_, key) => key}),
    './RebarTable.module.css': new Proxy({}, {get: (_, key) => key}),
  };
  const testModule = {exports: {}};
  const source = ts.transpileModule(fs.readFileSync('components/catalog/ProductOrderControls.tsx', 'utf8'), {
    compilerOptions: {module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX},
  }).outputText;
  vm.runInNewContext(source, {module: testModule, exports: testModule.exports, require: name => {
    assert(name in imports, name); return imports[name];
  }, window: {setTimeout: fn => {timers.push(fn); return timers.length;}, clearTimeout() {}}});
  const variant = {id: 'product', name: 'Товар', price: 100, inStock: true, ...overrides};
  function nodes(node) { return !node || typeof node !== 'object' ? [] : [node, ...[node.props?.children].flat().flatMap(nodes)]; }
  function render() {
    cursor = 0;
    const tree = nodes(testModule.exports.ProductOrderControls({variant, view: 'table', ...componentProps}));
    const action = tree.find(n => n.type === 'button' || n.type === 'link').props;
    const actionText = [action.children, ...nodes(action.children).map(node => node.props.children)]
      .filter(value => typeof value === 'string').join('');
    return {tree, input: tree.find(n => n.type === 'input').props, action, actionText};
  }
  return {cart, calls, timers, render, change: value => render().input.onChange({target: {value}})};
}

test('add, replace quantity, restore saved state, delete zero and show removed for one second', () => {
  const h = setup();
  assert.equal(h.render().actionText, 'В корзину');
  h.change('2'); h.render().action.onClick();
  assert.equal(h.render().actionText, 'В корзине');
  assert.equal(h.render().action.disabled, true);
  h.change('3.5'); assert.equal(h.render().actionText, 'Обновить');
  h.render().action.onClick();
  assert.equal(h.cart.lines.length, 1);
  assert.equal(h.cart.lines[0].quantity, 3.5);
  assert.deepEqual(h.calls, ['add', 'update']);
  h.change(''); h.render().input.onBlur();
  assert.equal(h.render().input.value, '3.5');
  assert.equal(h.render().actionText, 'В корзине');
  assert.equal(h.render().action.disabled, true);
  assert.deepEqual(h.calls, ['add', 'update']);
  h.change('0'); assert.equal(h.render().actionText, 'Удалить');
  h.render().action.onClick();
  assert.equal(h.cart.lines.length, 0);
  assert.equal(h.render().actionText, 'Удалено');
  h.timers.at(-1)(); assert.equal(h.render().actionText, 'В корзину');
});

test('saved cart quantity, hydration, stock, quote and invalid input are respected', () => {
  const h = setup(); h.cart.lines = [{productId: 'product', quantity: 7}];
  assert.equal(h.render().input.value, '7');
  assert.equal(h.render().actionText, 'В корзине');
  h.change('1000'); assert.equal(h.render().input.value, '999');
  assert.equal(h.render().actionText, 'Обновить');
  assert.equal(h.cart.lines[0].quantity, 7);
  h.change('2'); h.cart.hydrated = false; assert.equal(h.render().action.disabled, true);
  assert.equal(setup({inStock: false}).render().actionText, 'Под заказ');
  assert.equal(setup({quoteOnly: true}).render().actionText, 'Запросить цену');
  assert.equal(setup({price: null}).render().actionText, 'Запросить цену');
  assert.equal(setup({priceQualifier: 'from'}).render().actionText, 'Запросить цену');
});

test('quote button receives only explicitly entered or saved order quantities', () => {
  const h = setup({quoteOnly: true});
  assert.equal(h.render().action.order.quantity, null);
  h.change('2.5');
  assert.equal(h.render().action.order.quantity, 2.5);
  assert.equal(h.render().action.order.unit, 'т');
  assert.equal(h.render().action.order.product, 'Товар');
  h.change('');
  assert.equal(h.render().action.order.quantity, null);
});

test('on-order action is a quote link carrying quantity and calculable weight', () => {
  const h = setup({inStock: false, availability: 'ON_ORDER', unit: 'ton'});
  assert.equal(h.render().actionText, 'Под заказ');
  assert.equal(h.render().action.disabled, undefined);
  assert.equal(h.render().action.order.quantity, 1);
  h.change('2.5');
  assert.equal(h.render().action.order.quantity, 2.5);
  assert.equal(h.render().action.order.tons, 2.5);
  assert.deepEqual(h.calls, []);
  const imported = setup({inStock: false, imported: true, availability: 'ON_ORDER'});
  assert.equal(imported.render().actionText, 'Под заказ');
  const measured = setup({inStock: false, unit: 'meter', weight: {value: 0.888, unit: 'кг/м'}});
  measured.change('100');
  assert.equal(measured.render().action.order.tons, 0.0888);
  h.cart.lines = [{productId: 'product', quantity: 2.5}];
  h.change('0'); assert.equal(h.render().actionText, 'Удалить');
  h.render().action.onClick(); assert.equal(h.render().actionText, 'Удалено');
});

test('reference table quantity matches the centered rebar input format', () => {
  const rendered = setup({}, {showUnit: false}).render();
  assert.equal(rendered.input.inputMode, 'decimal');
  assert.equal(rendered.input.placeholder, '0');
  assert.match(rendered.input.className, /text-center/);
  assert.equal(rendered.tree.some(node => node.props?.children === 'т'), false);
});
