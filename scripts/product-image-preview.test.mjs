import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {readProjectData} from './project-data.mjs';

const jsx = (type, props) => ({type, props});
const nodes = node => !node || typeof node !== 'object' ? [] : [node, ...[node.props?.children].flat().flatMap(nodes)];
function load(file, imports, globals = {}) {
  const testModule = {exports: {}};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: {module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX},
  }).outputText, {module: testModule, exports: testModule.exports, require(name) {
    assert.ok(name in imports, name); return imports[name];
  }, ...globals});
  return testModule.exports;
}

function previewHarness(props = {}) {
  let effects, lastOpen, cleanup, stateIndex = 0, refIndex = 0, focusCount = 0, resize;
  const state = [], refs = [];
  const viewport = {clientWidth: 800, clientHeight: 600,
    getBoundingClientRect() {return {left: 0, top: 0, width: this.clientWidth, height: this.clientHeight};}};
  const document = {documentElement: {style: {overflow: 'auto'}}};
  const dialog = {open: false, showModal() {this.open = true;}, close() {this.open = false;}};
  const trigger = {isConnected: true, focus() {focusCount++;}};
  const {ProductImageViewer} = load('components/catalog/ProductImageViewer.tsx', {
    react: {
      useState(initial) {
        const index = stateIndex++;
        if (!(index in state)) state[index] = initial;
        return [state[index], value => {state[index] = typeof value === 'function' ? value(state[index]) : value;}];
      },
      useRef(initial) {
        const index = refIndex++;
        return refs[index] ??= {current: index < 3 ? [dialog, trigger, viewport][index] : initial};
      },
      useEffect(callback) {effects.push(callback);},
    },
    'react/jsx-runtime': {jsx, jsxs: jsx, Fragment: 'fragment'},
    'next/image': {default: 'image'},
    '@/lib/catalog-image': {catalogImageUrl: src => src},
    '@/lib/imageViewer': readProjectData('lib/imageViewer.ts'),
    './DesktopImagePreload': {DesktopImagePreload: 'preload'},
  }, {document, ResizeObserver: class {
    constructor(callback) {resize = callback;}
    observe() {resize();}
    disconnect() {}
  }});
  const render = () => {
    refIndex = 0;
    stateIndex = 0;
    effects = [];
    const tree = nodes(ProductImageViewer({src: '/channel.webp', name: 'Швеллер № 5', ...props}));
    if (lastOpen !== state[0]) {cleanup?.(); cleanup = effects[0](); lastOpen = state[0];}
    return tree;
  };
  return {render, dialog, document, focusCount: () => focusCount,
    resize(width, height) {viewport.clientWidth = width; viewport.clientHeight = height; resize();},
    open(width = 2400, height = 1800) {
      render().find(node => node.props?.['aria-haspopup'] === 'dialog').props.onClick();
      render().find(node => node.type === 'image' && node.props.unoptimized).props.onLoad({currentTarget: {naturalWidth: width, naturalHeight: height}});
      return render();
    },
  };
}

for (const presentation of ['page', 'table', 'card', 'catalog', 'compact']) {
  test(`${presentation} uses the original on demand, fits then zooms 1:1, pans and restores focus`, () => {
    const h = previewHarness({presentation});
    assert.equal(h.render().filter(n => n.type === 'image').length, 1, 'closed dialogs never download originals');
    let tree = h.open();
    const imageControl = () => tree.find(n => n.props?.['aria-label'] === 'Увеличение изображения');
    const imageFrame = () => tree.find(n => n.props?.style?.transform);
    assert.equal(h.dialog.open, true);
    assert.equal(h.document.documentElement.style.overflow, 'hidden');
    assert.equal(imageFrame().props.style.width, 800);
    assert.equal(imageFrame().props.style.height, 600);
    assert.equal(tree.find(n => n.type === 'image' && n.props.unoptimized).props.src, '/channel.webp');
    imageControl().props.onClick({detail: 0});
    tree = h.render();
    assert.equal(imageControl().props['aria-pressed'], true);
    assert.equal(imageFrame().props.style.width, 2400);
    assert.equal(imageFrame().props.style.height, 1800);
    assert.doesNotMatch(imageFrame().props.style.transform, /scale/);
    const pointer = {button: 0, clientX: 10, clientY: 10, pointerId: 1, isPrimary: true, currentTarget: {setPointerCapture() {}}};
    imageControl().props.onPointerDown(pointer);
    imageControl().props.onPointerDown({...pointer, isPrimary: false, pointerId: 2});
    imageControl().props.onPointerMove({buttons: 1, clientX: 5000, clientY: 5000, pointerId: 2});
    tree = h.render();
    assert.match(imageFrame().props.style.transform, /\+ 0px.*\+ 0px/, 'a secondary touch cannot move the image');
    imageControl().props.onPointerMove({buttons: 1, clientX: 35, clientY: 10, pointerId: 1});
    imageControl().props.onClick({detail: 1});
    tree = h.render();
    assert.equal(imageControl().props['aria-pressed'], true, 'dragging must not toggle zoom');
    assert.match(imageFrame().props.style.transform, /\+ 25px/);
    tree.find(n => n.type === 'dialog').props.onKeyDown({key: 'ArrowRight', preventDefault() {}});
    tree = h.render();
    assert.match(imageFrame().props.style.transform, /\+ -15px/);
    h.resize(2200, 1600);
    tree = h.render();
    imageControl().props.onPointerDown(pointer);
    imageControl().props.onPointerMove({buttons: 1, clientX: 5000, clientY: 5000, pointerId: 1});
    tree = h.render();
    assert.match(imageFrame().props.style.transform, /\+ 100px.*\+ 100px/, 'pan stops at the original image edges after resize');
    imageControl().props.onPointerCancel();
    imageControl().props.onClick({detail: 1});
    tree = h.render();
    assert.equal(imageControl().props['aria-pressed'], true, 'cancelled touch gesture must not toggle zoom');
    imageControl().props.onClick({detail: 0});
    tree = h.render();
    assert.equal(imageControl().props['aria-pressed'], false);
    let prevented = false;
    tree.find(n => n.type === 'dialog').props.onCancel({preventDefault() {prevented = true;}});
    h.render();
    assert.equal(prevented, true);
    assert.equal(h.dialog.open, false);
    assert.equal(h.document.documentElement.style.overflow, 'auto');
    assert.equal(h.focusCount(), 1);
    tree = h.open();
    tree.find(n => n.props?.['aria-label'] === 'Увеличение изображения').props.onClick({detail: 0});
    h.render().find(n => n.props?.['aria-label'] === 'Закрыть просмотр').props.onClick();
    h.render();
    assert.equal(h.dialog.open, false, 'close also works at 1:1');
    assert.equal(h.focusCount(), 2);
  });
}

test('small originals stay at native size and failed images leave an accessible close control', () => {
  const h = previewHarness({presentation: 'catalog'});
  let tree = h.open(320, 200);
  const frame = tree.find(n => n.props?.style?.transform);
  assert.equal(frame.props.style.width, 320);
  assert.equal(frame.props.style.height, 200);
  assert.equal(tree.find(n => n.props?.['aria-label'] === 'Увеличение изображения').props.disabled, true);
  tree.find(n => n.type === 'image' && n.props.unoptimized).props.onError();
  tree = h.render();
  assert.ok(tree.find(n => n.props?.role === 'alert'));
  tree.find(n => n.props?.['aria-label'] === 'Закрыть просмотр').props.onClick();
  h.render();
  assert.equal(h.dialog.open, false);
});

test('Tab stays inside the dialog even when the close button is its only enabled control', () => {
  const h = previewHarness();
  const tree = h.open(320, 200);
  const modal = tree.find(n => n.type === 'dialog');
  let focused = 0, prevented = 0;
  const close = {getClientRects: () => [1], focus() {focused++;}};
  h.document.activeElement = close;
  for (const shiftKey of [false, true]) modal.props.onKeyDown({key: 'Tab', shiftKey,
    currentTarget: {querySelectorAll: () => [close]}, preventDefault() {prevented++;}});
  assert.equal(prevented, 2);
  assert.equal(focused, 2);
});

test('ordinary product thumbnails use the shared viewer and explicit navigation links stay links', () => {
  const {CatalogImage} = load('components/catalog/CatalogImage.tsx', {
    'react/jsx-runtime': {jsx, jsxs: jsx, Fragment: 'fragment'},
    'next/image': {default: 'image'},
    'next/link': {default: 'link'},
    '@/lib/catalog-image': {catalogImageUrl: src => src},
    './ProductImageViewer': {ProductImageViewer: 'viewer'},
  });
  for (const compact of [false, true]) {
    const image = CatalogImage({src: '/product.jpg', name: 'Товар', compact});
    assert.equal(image.type, 'viewer');
    assert.equal(image.props.src, '/product.jpg');
    assert.equal(image.props.presentation, compact ? 'compact' : 'catalog');
  }
  assert.equal(CatalogImage({name: 'Нет фото'}), null);
  const link = CatalogImage({src: '/product.jpg', name: 'Товар', href: '/catalog/product'});
  assert.equal(link.type, 'link');
  assert.equal(link.props.href, '/catalog/product');
});

test('channel captions contain brief guidance and reference standard without repeating specifications', () => {
  const {getChannelProductDescription} = readProjectData('lib/channelDescription.ts');
  const {ChannelProductPreview} = load('components/catalog/ChannelProductPreview.tsx', {
    'react/jsx-runtime': {jsx, jsxs: jsx, Fragment: 'fragment'},
    '@/lib/channelDescription': {getChannelProductDescription},
    './ProductImageViewer': {ProductImageViewer: 'viewer'},
  });
  const {productVariants} = readProjectData('data/products/index.ts');
  for (const variant of productVariants.filter(item => item.categoryId === 'rozmet-cat-shveller')) {
    const preview = ChannelProductPreview({variant, compact: true});
    assert.equal(preview.props.presentation, 'table');
    assert.equal(preview.props.framed, variant.id === 'rozmet-2235');
    const caption = JSON.stringify(preview.props.caption);
    assert.match(caption, /ГОСТ 8240-97/);
    assert.match(caption, /\/documents\/gost-8240-97\.pdf/);
    assert.doesNotMatch(caption, /https?:\/\//);
    assert.doesNotMatch(caption, /Параметры:|Толщина|Высота|Характеристики|4,84|Условия оплаты/);
    assert.ok(caption.includes('соответствие конкретной партии'));
  }
});

test('channel standard is stored locally and every channel reference uses it', () => {
  const localStandard = '/documents/gost-8240-97.pdf';
  const documentPath = `public${localStandard}`;
  const bytes = fs.readFileSync(documentPath);
  assert.ok(bytes.length > 100_000);
  assert.equal(bytes.subarray(0, 5).toString(), '%PDF-');

  for (const file of [
    'components/catalog/ChannelProductPreview.tsx',
    'components/catalog/ChannelSpecificationNote.tsx',
  ]) {
    const source = fs.readFileSync(file, 'utf8');
    assert.match(source, new RegExp(localStandard.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.doesNotMatch(source, /metall-energy\.ru|https?:\/\//);
  }
});
