import test from 'node:test';
import assert from 'node:assert/strict';
import {readProjectData} from './project-data.mjs';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const {normalizeRussianPhone, validateQuoteFields, QUOTE_LIMITS} = readProjectData('lib/quoteValidation.ts');
const {parseQuoteRequest} = readProjectData('lib/server/validation.ts');
const valid = () => ({name: 'Анна-Мария', phone: '+79115556677', email: 'anna+metal@example.ru', company: '', message: 'Арматура рифлёная А500С\nДлина: 100 м', consent: true, website: ''});

test('telephone typing and formatted paste use +7 and at most ten national digits', () => {
  for (const [input, expected] of [
    ['', ''], ['+', '+7'], ['7', '+7'], ['8', '+7'], ['9', '+79'],
    ['9115556677', '+79115556677'], ['89115556677', '+79115556677'],
    ['+7 (911) 555-66-77', '+79115556677'], ['+791155566779999', '+79115556677'],
    ['+7911', '+7911'],
  ]) assert.equal(normalizeRussianPhone(input), expected);
});

test('client and server accept the same valid quote and preserve line breaks', () => {
  assert.equal(Object.keys(validateQuoteFields(valid())).length, 0);
  const parsed = parseQuoteRequest({...valid(), name: ' Анна-Мария ', email: 'ANNA@example.ru'});
  assert.ok(parsed);
  assert.equal(parsed.name, 'Анна-Мария');
  assert.equal(parsed.email, 'anna@example.ru');
  assert.equal(parsed.message, valid().message);
});

test('all required fields report their own errors; whitespace is not a name or message', () => {
  const errors = validateQuoteFields({name: ' ', phone: '', email: '', message: '\n ', consent: false});
  assert.deepEqual(Object.keys(errors), ['name', 'phone', 'email', 'message', 'consent']);
  assert.equal(errors.phone, 'Заполните поле');
  assert.equal(validateQuoteFields({...valid(), phone: '+7'}).phone, 'Заполните поле');
  assert.equal(errors.email, 'Заполните поле');
  assert.equal(parseQuoteRequest({}), null);
});

test('length limits are enforced on the server as well as the form', () => {
  for (const field of ['name', 'email', 'company', 'message', 'website']) {
    const payload = {...valid(), [field]: 'а'.repeat(QUOTE_LIMITS[field] + 1)};
    assert.ok(validateQuoteFields(payload)[field], field);
    assert.equal(parseQuoteRequest(payload), null, field);
  }
  assert.ok(parseQuoteRequest({...valid(), message: 'а'.repeat(2000)}));
  assert.equal(parseQuoteRequest({...valid(), message: 'а'.repeat(2001)}), null);
  assert.ok(parseQuoteRequest({...valid(), name: 'а'.repeat(120)}));
});

test('malformed phone, email, name and consent cannot be submitted directly to the server', () => {
  for (const phone of ['9115556677', '89115556677', '+7911555667', '+791155566777', '+7 911 555 66 77', '+7911555667x', '+78115556677', '+70115556677', '+77115556677']) {
    assert.ok(validateQuoteFields({...valid(), phone}).phone, phone);
    assert.equal(parseQuoteRequest({...valid(), phone}), null);
  }
  for (const email of ['a@@b.ru', 'a@b', 'a b@example.ru', 'a..b@example.ru', 'a@-example.ru', 'a@b..ru']) {
    assert.ok(validateQuoteFields({...valid(), email}).email, email);
    assert.equal(parseQuoteRequest({...valid(), email}), null);
  }
  assert.ok(validateQuoteFields({...valid(), name: '12345'}).name);
  assert.ok(validateQuoteFields({...valid(), consent: 'true'}).consent);
  assert.equal(parseQuoteRequest(null), null);
  assert.equal(parseQuoteRequest({...valid(), name: {text: 'Анна'}}), null);
});

test('API returns specific validation errors without sending an invalid quote', async () => {
  const sent = [];
  const testModule = {exports: {}};
  const imports = {
    '@/lib/server/notifications': {notificationService: {sendQuoteRequest: async quote => sent.push(quote)}},
    '@/lib/server/validation': {parseQuoteRequest},
    '@/lib/quoteValidation': {validateQuoteFields},
  };
  const source = ts.transpileModule(fs.readFileSync('app/api/quote/route.ts', 'utf8'), {
    compilerOptions: {module: ts.ModuleKind.CommonJS},
  }).outputText;
  vm.runInNewContext(source, {module: testModule, exports: testModule.exports, Response, require: name => {
    assert.ok(name in imports, name); return imports[name];
  }});
  const submit = body => testModule.exports.POST(new Request('http://localhost/api/quote', {
    method: 'POST', body: JSON.stringify(body), headers: {'content-type': 'application/json'},
  }));
  const rejected = await submit({...valid(), phone: '+7911', message: 'а'.repeat(2001)});
  assert.equal(rejected.status, 400);
  const errors = await rejected.json();
  assert.equal(errors.fieldErrors.phone, 'Неверный формат');
  assert.match(errors.fieldErrors.message, /2000/);
  assert.equal(sent.length, 0);
  const accepted = await submit(valid());
  assert.equal(accepted.status, 200);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].message, valid().message);
});
