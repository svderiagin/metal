import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {readProjectData} from './project-data.mjs';

test('blur validates only the visited field and clears its error after correction', () => {
  let cursor = 0;
  const state = [];
  class InputElement {constructor(name) {this.name = name;}}
  const imports = {
    react: {
      useId: () => 'quote', useEffect() {},
      useState(initial) {
        const i = cursor++;
        if (!(i in state)) state[i] = initial;
        return [state[i], value => {state[i] = typeof value === 'function' ? value(state[i]) : value;}];
      },
    },
    'react/jsx-runtime': {jsx: (type, props) => ({type, props}), jsxs: (type, props) => ({type, props})},
    'next/link': {default: 'a'},
    '@/components/ui/Button': {Button: 'button'},
    '@/components/ui/Input': {Input: 'input'},
    '@/components/ui/Textarea': {Textarea: 'textarea'},
    '@/lib/quoteValidation': readProjectData('lib/quoteValidation.ts'),
    '@/lib/quoteRequest': readProjectData('lib/quoteRequest.ts'),
    './PhoneInput': {PhoneInput: 'phone'},
    './QuoteRequestContext': {useQuoteRequest: () => null},
    './QuoteRequestForm.module.css': {default: {form: 'form', error: 'error', messageMeta: 'messageMeta', counter: 'counter'}},
  };
  const module = {exports: {}};
  const source = ts.transpileModule(fs.readFileSync('components/forms/QuoteRequestForm.tsx', 'utf8'), {
    compilerOptions: {module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX},
  }).outputText;
  vm.runInNewContext(source, {module, exports: module.exports, HTMLInputElement: InputElement, HTMLTextAreaElement: InputElement,
    FormData: class extends Map {constructor(form) {super(Object.entries(form));}},
    require: name => {assert.ok(name in imports, name); return imports[name];},
  });
  function render() {cursor = 0; return module.exports.QuoteRequestForm();}
  const form = {email: 'broken', name: '', phone: '', message: ''};
  function blur(name) {render().props.onBlur({target: new InputElement(name), currentTarget: form});}
  function nodes(node) {return !node || typeof node !== 'object' ? [] : [node, ...[node.props?.children].flat().flatMap(nodes)];}
  const input = name => nodes(render()).find(node => node.props?.name === name).props;
  assert.equal(input('email')['aria-invalid'], false);
  blur('email');
  assert.equal(input('email')['aria-invalid'], true);
  assert.equal(input('name')['aria-invalid'], false);
  assert.ok(nodes(render()).some(node => node.props?.children === 'Неверный формат. Пример: name@example.ru'));
  form.email = 'user@example.ru';
  render().props.onChange({target: new InputElement('email'), currentTarget: form});
  assert.equal(input('email')['aria-invalid'], false);
  blur('name'); assert.equal(input('name')['aria-invalid'], true);
  form.name = 'Анна'; blur('name'); assert.equal(input('name')['aria-invalid'], false);
  form.phone = '+7911'; blur('phone'); assert.equal(input('phone')['aria-invalid'], true);
  form.phone = '+79115556677'; blur('phone'); assert.equal(input('phone')['aria-invalid'], false);
  blur('message');
  assert.equal(input('message')['aria-invalid'], true);
  const footer = nodes(render()).find(node => node.props?.className === 'messageMeta');
  assert.equal(footer.props.children[0].props.children, 'Заполните поле');
  assert.equal(footer.props.children[1].props.className, 'counter');
});
