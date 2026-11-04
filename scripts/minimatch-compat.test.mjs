import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {ESLint} from 'eslint';

const require = createRequire(import.meta.url);
const match = require('minimatch');

test('legacy ESLint consumers resolve the patched matcher through the local adapter', () => {
  assert.equal(require('minimatch-modern/package.json').version, '11.0.4');
  for (const consumer of ['eslint', '@eslint/config-array', '@eslint/eslintrc', 'eslint-plugin-react', 'eslint-plugin-import', 'eslint-plugin-jsx-a11y']) {
    const consumerRequire = createRequire(require.resolve(consumer));
    assert.equal(consumerRequire('minimatch'), match, consumer);
  }
  const lock = JSON.parse(fs.readFileSync('package-lock.json', 'utf8'));
  for (const [path, entry] of Object.entries(lock.packages)) {
    if (path.endsWith('/minimatch') && !entry.link) assert.equal(entry.version, '11.0.4', path);
  }
});

test('glob behavior preserves paths, braces, extglobs, dotfiles, negation and partial matching', () => {
  for (const [path, pattern, options, expected] of [
    ['components/catalog/Table.tsx', '**/*.{ts,tsx}', {}, true],
    ['components/catalog/Table.tsx', '*.tsx', {matchBase: true}, true],
    ['components/catalog/Table.js', '**/*.tsx', {}, false],
    ['.tmp/probe.js', '**/*.js', {}, false],
    ['.tmp/probe.js', '**/*.js', {dot: true}, true],
    ['Bad_widget', 'Good_*', {noglobstar: true}, false],
    ['Good_widget', 'Good_*', {noglobstar: true}, true],
    ['app/page.tsx', '!**/*.js', {}, true],
    ['!literal', '!literal', {nonegate: true}, true],
    ['example.ts', '*.+(ts|tsx)', {}, true],
    ['src', 'src/**/*.ts', {partial: true}, true],
  ]) assert.equal(match(path, pattern, options), expected, `${path}: ${pattern}`);
  assert.equal(new match.Minimatch('src/**/*.ts').match('src', true), true);
});

test('legacy callable helpers and makeRe test contract delegate to the safe engine', () => {
  assert.deepEqual(['a.ts', 'b.js'].filter(match.filter('*.ts')), ['a.ts']);
  assert.deepEqual(match.match(['a.ts', 'b.js'], '*.ts'), ['a.ts']);
  assert.deepEqual(match.braceExpand('a.{ts,tsx}'), ['a.ts', 'a.tsx']);
  const insensitive = match.defaults({nocase: true});
  assert.equal(insensitive('A.TS', '*.ts'), true);
  assert.equal(insensitive('A.TS', '*.ts', {nocase: false}), false);
  assert.equal(new insensitive.Minimatch('*.ts').match('A.TS'), true);
  assert.equal(new (match.Minimatch.defaults({nocase: true}))('*.ts').match('A.TS'), true);
  for (const matcher of [match.makeRe('safe/**'), new match.Minimatch('safe/**').makeRe()]) {
    assert.equal(matcher.test('safe/nested'), true);
    assert.equal(matcher.test('unsafe/nested'), false);
    assert.equal(matcher instanceof RegExp, false);
  }
});

test('ESLint retains configured source coverage and generated/archive ignores', async () => {
  const eslint = new ESLint();
  for (const path of ['app/page.tsx', 'components/catalog/ProductVariantCatalog.tsx', 'tests/unit/api.test.ts']) {
    assert.equal(await eslint.isPathIgnored(path), false, path);
  }
  for (const path of ['.next/probe.js', '.next-test/probe.js', 'output/probe.js', '.tmp/probe.js']) {
    assert.equal(await eslint.isPathIgnored(path), true, path);
  }
  const config = await eslint.calculateConfigForFile('app/page.tsx');
  assert.equal(config.rules['@next/next/no-html-link-for-pages'][0], 2);
  assert.equal(config.rules['@typescript-eslint/no-unused-vars'][0], 1);
});

async function ruleMessages(rule, options, source) {
  const eslint = new ESLint({overrideConfig: {rules: {[rule]: ['error', options]}}});
  const [result] = await eslint.lintText(source, {filePath: 'components/DependencyProbe.tsx'});
  assert.equal(result.fatalErrorCount, 0);
  return result.messages.filter(message => message.ruleId === rule);
}

test('React glob rule executes its legacy callable import and still detects violations', async () => {
  const rule = 'react/jsx-pascal-case', options = {ignore: ['Good_*']};
  assert.equal((await ruleMessages(rule, options, 'export default function Demo() { return <Good_widget/>; }')).length, 0);
  assert.equal((await ruleMessages(rule, options, 'export default function Demo() { return <Bad_widget/>; }')).length, 1);
});

test('accessibility rule recognizes globbed controls and rejects unrelated children', async () => {
  const rule = 'jsx-a11y/label-has-associated-control', options = {controlComponents: ['Custom*'], assert: 'nesting'};
  assert.equal((await ruleMessages(rule, options, 'export default function Demo() { return <label>Name<CustomInput/></label>; }')).length, 0);
  assert.equal((await ruleMessages(rule, options, 'export default function Demo() { return <label>Name<OtherInput/></label>; }')).length, 1);
});

test('import boundary rule uses the makeRe test contract for permitted and forbidden paths', async () => {
  const rule = 'import/no-internal-modules', options = {forbid: ['unsafe/**']};
  assert.equal((await ruleMessages(rule, options, 'import value from "safe/nested"; export default value;')).length, 0);
  assert.equal((await ruleMessages(rule, options, 'import value from "unsafe/nested"; export default value;')).length, 1);
});
