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

function checkPreview({presentation, expanded = false}) {
  let open = false, zoomed = false, effects, cleanup, lastOpen, reference = 0, stateIndex = 0, focusCount = 0;
  const extraRefs = [];
  let pan = {x: 0, y: 0};
  const viewport = {clientWidth: 800, clientHeight: 600,
    getBoundingClientRect() {return {left: 0, top: 0, width: 800, height: 600};}};
  const document = {documentElement: {style: {overflow: 'auto'}}};
  const dialog = {open: false, showModal() {this.open = true;}, close() {this.open = false;}};
  const trigger = {isConnected: true, focus() {focusCount++;}};
  const {ProductImageViewer} = load('components/catalog/ProductImageViewer.tsx', {
    react: {
      useState() {
        const index = stateIndex++;
        return index === 0 ? [open, value => {open = value;}]
          : index === 1 ? [zoomed, value => {zoomed = typeof value === 'function' ? value(zoomed) : value;}]
            : [pan, value => {pan = typeof value === 'function' ? value(pan) : value;}];
      },
      useRef(initial) {
        const index = reference++;
        if (index < 3) return {current: [dialog, trigger, viewport][index]};
        return extraRefs[index] ??= {current: initial};
      },
      useEffect(callback) {effects.push(callback);},
    },
    'react/jsx-runtime': {jsx, jsxs: jsx, Fragment: 'fragment'},
    'next/image': {default: 'image'},
    '@/lib/catalog-image': {catalogImageUrl: src => src},
    './DesktopImagePreload': {DesktopImagePreload: 'preload'},
  }, {document});
  const render = () => {
    reference = 0;
    stateIndex = 0;
    effects = [];
    const tree = nodes(ProductImageViewer({src: '/channel.webp', name: 'Швеллер № 5', presentation, expanded, caption: 'Короткое описание'}));
    if (lastOpen !== open) {cleanup?.(); cleanup = effects[0](); lastOpen = open;}
    return tree;
  };
  let tree = render();
  assert.equal(tree.some(node => node.type === 'a' || node.type === 'preload'), false);
  assert.equal(tree.filter(node => node.type === 'image').length, 1);
  tree.find(node => node.props?.['aria-haspopup'] === 'dialog').props.onClick();
  tree = render();
  assert.equal(dialog.open, true);
  assert.equal(document.documentElement.style.overflow, 'hidden');
  assert.equal(tree.some(node => node.props?.children === 'Короткое описание'), !expanded);
  if (expanded) {
    const imageControl = () => tree.find(node => node.props?.['aria-label'] === 'Увеличение изображения');
    assert.equal(imageControl().props['aria-pressed'], false);
    imageControl().props.onClick({detail: 0});
    tree = render();
    assert.equal(imageControl().props['aria-pressed'], true);
    assert.match(tree.find(node => node.props?.style?.transform)?.props.style.transform, /scale\(2\)/);
    assert.equal(dialog.open, true);
    imageControl().props.onPointerDown({button: 0, clientX: 10, clientY: 10, pointerType: 'mouse', pointerId: 1, currentTarget: {setPointerCapture() {}}});
    imageControl().props.onPointerMove({buttons: 1, clientX: 35, clientY: 10, pointerType: 'mouse'});
    imageControl().props.onClick({detail: 1});
    tree = render();
    assert.equal(imageControl().props['aria-pressed'], true, 'panning must not toggle zoom');
    assert.equal(pan.x, 25, 'dragging moves the enlarged image');
    imageControl().props.onKeyDown({key: 'ArrowRight', preventDefault() {}});
    assert.equal(pan.x, -15, 'arrow keys move the image without scrolling');
    imageControl().props.onPointerCancel();
    imageControl().props.onClick({detail: 1});
    tree = render();
    assert.equal(imageControl().props['aria-pressed'], true, 'cancelled touch gesture must not toggle zoom');
    imageControl().props.onClick({detail: 0});
    tree = render();
    assert.equal(imageControl().props['aria-pressed'], false);
  }
  let prevented = false;
  tree.find(node => node.type === 'dialog').props.onCancel({preventDefault() {prevented = true;}});
  render();
  assert.equal(prevented, true);
  assert.equal(dialog.open, false);
  assert.equal(document.documentElement.style.overflow, 'auto');
  assert.equal(focusCount, 1);
  render().find(node => node.props?.['aria-haspopup'] === 'dialog').props.onClick();
  const reopened = render();
  if (expanded) {
    assert.equal(reopened.some(node => node.type === 'details' || node.props?.['aria-label'] === 'Закрыть просмотр'), false);
    const modal = reopened.find(node => node.type === 'dialog');
    modal.props.onClick({target: modal, currentTarget: modal});
  } else reopened.find(node => node.props?.['aria-label'] === 'Закрыть просмотр').props.onClick();
  render();
  assert.equal(dialog.open, false);
  assert.equal(focusCount, 2);
}

for (const [label, props] of [
  ['table preview', {presentation: 'table'}],
  ['expanded table preview', {presentation: 'table', expanded: true}],
  ['expanded mobile card preview', {presentation: 'card', expanded: true}],
]) {
  test(`${label} opens without navigation, Escape and close restore focus and scroll`, () => checkPreview(props));
}

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
