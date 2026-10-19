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

test('table preview opens without navigation, Escape and close restore focus and scroll', () => {
  let open = false, effect, cleanup, lastOpen, reference = 0, focusCount = 0;
  const document = {documentElement: {style: {overflow: 'auto'}}};
  const dialog = {open: false, showModal() {this.open = true;}, close() {this.open = false;}};
  const trigger = {isConnected: true, focus() {focusCount++;}};
  const {ProductImageViewer} = load('components/catalog/ProductImageViewer.tsx', {
    react: {
      useState() {return [open, value => {open = value;}];},
      useRef() {return {current: reference++ === 0 ? dialog : trigger};},
      useEffect(callback) {effect = callback;},
    },
    'react/jsx-runtime': {jsx, jsxs: jsx, Fragment: 'fragment'},
    'next/image': {default: 'image'},
    '@/lib/catalog-image': {catalogImageUrl: src => src},
    './DesktopImagePreload': {DesktopImagePreload: 'preload'},
  }, {document});
  const render = () => {
    reference = 0;
    const tree = nodes(ProductImageViewer({src: '/channel.webp', name: 'Швеллер № 5', presentation: 'table', caption: 'Короткое описание'}));
    if (lastOpen !== open) {cleanup?.(); cleanup = effect(); lastOpen = open;}
    return tree;
  };
  let tree = render();
  assert.equal(tree.some(node => node.type === 'a' || node.type === 'preload'), false);
  assert.equal(tree.filter(node => node.type === 'image').length, 1);
  tree.find(node => node.props?.['aria-haspopup'] === 'dialog').props.onClick();
  tree = render();
  assert.equal(dialog.open, true);
  assert.equal(document.documentElement.style.overflow, 'hidden');
  assert.ok(tree.some(node => node.props?.children === 'Короткое описание'));
  let prevented = false;
  tree.find(node => node.type === 'dialog').props.onCancel({preventDefault() {prevented = true;}});
  render();
  assert.equal(prevented, true);
  assert.equal(dialog.open, false);
  assert.equal(document.documentElement.style.overflow, 'auto');
  assert.equal(focusCount, 1);
  render().find(node => node.props?.['aria-haspopup'] === 'dialog').props.onClick();
  render().find(node => node.props?.['aria-label'] === 'Закрыть просмотр').props.onClick();
  render();
  assert.equal(dialog.open, false);
  assert.equal(focusCount, 2);
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
    const caption = JSON.stringify(preview.props.caption);
    assert.match(caption, /ГОСТ 8240-97/);
    assert.doesNotMatch(caption, /Параметры:|Толщина|Высота|Характеристики|4,84|Условия оплаты/);
    assert.ok(caption.includes('соответствие конкретной партии'));
  }
});
