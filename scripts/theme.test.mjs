import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function browser({saved, dark = false, blocked = false} = {}) {
  const values = new Map(saved === undefined ? [] : [['rvb-theme', saved]]);
  const events = new Map(), mediaEvents = new Set();
  const media = {matches: dark, addEventListener: (_, fn) => mediaEvents.add(fn), removeEventListener: (_, fn) => mediaEvents.delete(fn)};
  const document = {documentElement: {dataset: {}}};
  const window = {
    matchMedia: () => media,
    localStorage: {
      getItem(key) { if (blocked) throw Error('Storage blocked'); return values.get(key) ?? null; },
      setItem(key, value) { if (blocked) throw Error('Storage blocked'); values.set(key, value); },
      removeItem(key) { if (blocked) throw Error('Storage blocked'); values.delete(key); },
    },
    addEventListener(name, fn) { if (!events.has(name)) events.set(name, new Set()); events.get(name).add(fn); },
    removeEventListener(name, fn) { events.get(name)?.delete(fn); },
    dispatchEvent(event) { for (const fn of events.get(event.type) ?? []) fn(event); },
  };
  const testModule = {exports: {}};
  const context = vm.createContext({window, document, localStorage: window.localStorage, matchMedia: window.matchMedia, module: testModule, exports: testModule.exports, Event});
  const source = ts.transpileModule(fs.readFileSync('lib/theme.ts', 'utf8'), {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020}}).outputText;
  vm.runInContext(source, context);
  const api = testModule.exports;
  vm.runInContext(api.themeInitScript, context);
  return {api, document, values, window, media, changeSystem(dark) {media.matches = dark; for (const fn of mediaEvents) fn();}};
}

test('first paint honors an explicit saved theme over the operating system', () => {
  assert.equal(browser({saved: 'light', dark: true}).document.documentElement.dataset.theme, 'light');
  assert.equal(browser({saved: 'dark', dark: false}).document.documentElement.dataset.theme, 'dark');
});

test('missing, invalid and blocked preferences follow the operating system before hydration', () => {
  for (const saved of [undefined, 'system', 'invalid']) {
    assert.equal(browser({saved, dark: true}).document.documentElement.dataset.theme, 'dark');
    assert.equal(browser({saved, dark: false}).document.documentElement.dataset.theme, 'light');
  }
  assert.equal(browser({blocked: true, dark: true}).document.documentElement.dataset.theme, 'dark');
});

test('manual selection persists, survives initialization and can return to system mode', () => {
  const b = browser();
  let changes = 0;
  const stop = b.api.subscribeToTheme(() => changes++);
  b.api.setThemePreference('dark');
  assert.equal(b.values.get('rvb-theme'), 'dark');
  assert.equal(b.document.documentElement.dataset.theme, 'dark');
  assert.equal(browser({saved: b.values.get('rvb-theme')}).document.documentElement.dataset.theme, 'dark');
  b.changeSystem(true);
  b.api.setThemePreference('light');
  assert.equal(b.document.documentElement.dataset.theme, 'light');
  b.api.setThemePreference('system');
  assert.equal(b.values.has('rvb-theme'), false);
  assert.equal(b.document.documentElement.dataset.theme, 'dark');
  b.changeSystem(false);
  assert.equal(b.document.documentElement.dataset.theme, 'light');
  assert.ok(changes > 1);
  stop();
  b.changeSystem(true);
  assert.equal(b.document.documentElement.dataset.theme, 'light', 'listeners are removed on unmount');
});

test('other tabs update the theme; unrelated storage changes are ignored', () => {
  const b = browser();
  b.api.subscribeToTheme(() => {});
  b.values.set('rvb-theme', 'dark');
  b.window.dispatchEvent({type: 'storage', key: 'cart'});
  assert.equal(b.document.documentElement.dataset.theme, 'light');
  b.window.dispatchEvent({type: 'storage', key: 'rvb-theme'});
  assert.equal(b.document.documentElement.dataset.theme, 'dark');
  b.values.clear();
  b.window.dispatchEvent({type: 'storage', key: null});
  assert.equal(b.document.documentElement.dataset.theme, 'light');
});

test('switching still works for the current session when storage is unavailable', () => {
  const b = browser({blocked: true});
  b.api.subscribeToTheme(() => {});
  b.api.setThemePreference('dark');
  assert.equal(b.api.getThemePreference(), 'dark');
  assert.equal(b.document.documentElement.dataset.theme, 'dark');
  b.api.setThemePreference('light');
  assert.equal(b.document.documentElement.dataset.theme, 'light');
  b.api.setThemePreference('system');
  b.changeSystem(true);
  assert.equal(b.document.documentElement.dataset.theme, 'dark');
});
