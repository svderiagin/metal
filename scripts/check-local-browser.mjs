import assert from 'node:assert/strict';
import fs from 'node:fs';
import {readProjectData} from './project-data.mjs';

// Uses a separate tab; all form submissions are intercepted in the browser.
const base = process.env.AUDIT_URL ?? 'http://127.0.0.1:3100';
const cdp = process.env.AUDIT_CDP ?? 'http://127.0.0.1:9224';
const baseline = process.argv.includes('--baseline');
const directory = '.tmp/local-audit';
fs.mkdirSync(directory, {recursive: true});
const target = await (await fetch(cdp + '/json/new?about:blank', {method: 'PUT'})).json();
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise(resolve => socket.addEventListener('open', resolve, {once: true}));
let next = 0;
const pending = new Map();
const errors = [];
const failures = [];
const results = [];
let heroImagesAllowed = 5;
socket.addEventListener('message', event => {
  const message = JSON.parse(event.data);
  if (pending.has(message.id)) {
    const {resolve, reject, timer} = pending.get(message.id);
    pending.delete(message.id);
    clearTimeout(timer);
    if (message.error) reject(Error(JSON.stringify(message.error)));
    else resolve(message.result);
  }
  if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.exception?.description ?? message.params.exceptionDetails.text);
  if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') errors.push(message.params.args.map(a => a.value ?? a.description).join(' '));
  if (message.method === 'Network.responseReceived' && message.params.response.status >= 400) failures.push({url: message.params.response.url, status: message.params.response.status});
  if (message.method === 'Network.loadingFailed' && !message.params.canceled) failures.push({error: message.params.errorText, type: message.params.type});
  if (message.method === 'Fetch.requestPaused') {
    const request = message.params;
    const source = new URL(request.request.url).searchParams.get('url') ?? '';
    const number = Number(source.match(/\/(\d)\.jpg/)?.[1]);
    if (number <= heroImagesAllowed) void call('Fetch.continueRequest', {requestId:request.requestId});
    else void call('Fetch.fulfillRequest', {requestId:request.requestId, responseCode:200, responseHeaders:[{name:'Content-Type',value:'image/jpeg'}], body:Buffer.from('Invalid image: local browser fixture').toString('base64')});
  }
});
function call(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++next;
    const timer = setTimeout(() => {pending.delete(id); reject(Error('CDP timeout: ' + method));}, 20000);
    pending.set(id, {resolve, reject, timer});
    socket.send(JSON.stringify({id, method, params}));
  });
}
async function evaluate(expression) {
  const value = await call('Runtime.evaluate', {expression, returnByValue: true, awaitPromise: true});
  if (value.exceptionDetails) throw Error(value.exceptionDetails.exception?.description ?? value.exceptionDetails.text);
  return value.result.value;
}
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function wait(expression) {
  for (let n = 0; n < 150; n++) {
    if (await evaluate(expression)) return;
    await delay(100);
  }
  throw Error('Not ready: ' + expression);
}
async function go(path) {
  await call('Page.navigate', {url: base + path});
  await wait(`location.pathname === ${JSON.stringify(new URL(base + path).pathname)} && document.readyState === 'complete' && !!document.querySelector('h1')`);
  // Allow client hydration before exercising controlled inputs.
  await delay(400);
}
async function input(selector, value) {
  await evaluate(`(() => {const el = document.querySelector(${JSON.stringify(selector)}); if (!el) throw Error('Missing input'); Object.getOwnPropertyDescriptor(el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype, 'value').set.call(el, ${JSON.stringify(value)}); el.dispatchEvent(new Event('input', {bubbles: true}));})()`);
  await delay(180);
}

async function check(name, fn) {
  try {await fn(); results.push({name, ok: true});}
  catch (error) {results.push({name, ok: false, error: error.message}); if (!baseline) throw error;}
}
const {productVariants} = readProjectData('data/products/index.ts');
const {productTypes} = readProjectData('data/productTypes.ts');
const {CART_STORAGE_KEY} = readProjectData('lib/constants.ts');
const pathFor = product => {
  const type = productTypes.find(type => type.id === product.productTypeId);
  return `/catalog/${type.categorySlug}/${type.subcategorySlug}/${type.slug}`;
};
const rebar = productVariants.find(p => p.categoryId === 'cat-arm' && p.diameterMm === 12 && p.inStock && p.weightPerMeterKg);
const beam = productVariants.find(p => p.categoryId === 'cat-bal' && p.pricePerTon && p.weightPerMeterKg);
const generic = productVariants.find(p => p.categoryId === 'cat-trp' && p.price && !p.quoteOnly);
const wireRod = productVariants.find(p => p.categoryId === 'cat-kat');
const hero = `document.querySelector('section[aria-labelledby="home-hero-title"]')`;
try {
  await call('Page.enable');
  await call('Runtime.enable');
  await call('Network.enable');
  for (const width of [1440, 390]) {
    await call('Emulation.setDeviceMetricsOverride', {width, height: 1000, deviceScaleFactor: 1, mobile: width < 640});
    for (const path of ['/', '/catalog', '/catalog/armatura', '/catalog/balka', '/catalog/katanka', '/catalog/balka/balka-normalnaya', pathFor(rebar), pathFor(beam), pathFor(generic), pathFor(wireRod), '/contacts', '/delivery', '/services', '/about', '/privacy']) {
      await check(`${width} ${path}: layout and visible images`, async () => {
        await go(path);
        const state = await evaluate(`(async () => {const images = [...document.querySelectorAll('img')].filter(i => i.getClientRects().length); await Promise.all(images.map(async i => {i.loading = 'eager'; try {await i.decode();} catch {}})); return {overflow: document.documentElement.scrollWidth > innerWidth, broken: images.filter(i => !i.naturalWidth).map(i => i.currentSrc)};})()`);
        assert.equal(state.overflow, false);
        assert.deepEqual(state.broken, []);
        if (['/', '/catalog', pathFor(beam)].includes(path)) {
          const shot = await call('Page.captureScreenshot', {format: 'png', captureBeyondViewport: false});
          fs.writeFileSync(`${directory}/${baseline ? 'before' : 'after'}-${path === '/' ? 'home' : path === '/catalog' ? 'catalog' : 'beam'}-${width}.png`, Buffer.from(shot.data, 'base64'));
        }
      });
    }
    await check(`${width}: profile pipe families and requested category order`, async () => {
      await go('/catalog/truby-profilnye');
      const state = await evaluate(`({cards:[...document.querySelectorAll('main article h2')].map(el=>el.textContent),categories:[...document.querySelectorAll('aside nav[aria-label="Категории"] > ul > li > a')].slice(0,3).map(el=>el.textContent),subcategories:[...document.querySelectorAll('aside nav[aria-label="Категории"] > ul > li > ul a')].map(el=>el.textContent)})`);
      const expected = ['Труба профильная квадратная','Труба профильная прямоугольная'];
      assert.deepEqual(state.cards, expected);
      assert.deepEqual(state.subcategories, expected);
      assert.deepEqual(state.categories, ['Арматура','Трубы профильные','Труба круглая']);
    });
    await check(`${width}: Russian search, typo and dimensions`, async () => {
      await go('/catalog');
      for (const query of ['профильных труб', 'арматруа', '40x40x4', 'абракадабразавр']) {
        await input('input[name="query"]', query);
        await wait(`document.querySelector('main').innerText.includes(${JSON.stringify(`По запросу «${query}» найдено товаров:`)})`);
        if (query !== 'абракадабразавр') await wait(`document.querySelectorAll('main li a[href*="#variant-"]').length > 0`);
        const links = await evaluate(`[...document.querySelectorAll('main li a[href*="#variant-"]')].map(a => a.textContent)`);
        if (query === 'абракадабразавр') assert.equal(links.length, 0);
        else assert.ok(links.length, query);
        if (query === '40x40x4') assert.ok(links.every(name => /40[хx]40[хx]4(?:[хx]|\D|$)/.test(name)));
      }
    });
    await check(`${width}: generic filter and reset`, async () => {
      await go(pathFor(generic));
      await input('input[placeholder="Название, размер, марка"]', 'абракадабразавр');
      assert.ok(await evaluate(`document.body.innerText.includes('Варианты не найдены')`));
      await evaluate(`[...document.querySelectorAll('button')].find(b => b.textContent.includes('Сбросить')).click()`);
      await wait(`!!document.querySelector('[id^="variant-"]')`);
    });
    await check(`${width}: measured product deep link`, async () => {
      await go(pathFor(beam) + '#variant-' + beam.id);
      const selector = `#variant-${width < 1280 ? 'mobile-' : ''}${beam.id}`;
      await wait(`!!document.querySelector(${JSON.stringify(selector)})`);
      assert.ok(await evaluate(`(() => {const r = document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight;})()`));
    });
    await check(`${width}: image dialog restores keyboard focus`, async () => {
      await go(pathFor(beam));
      await evaluate(`document.querySelector('button[aria-haspopup="dialog"]').focus(); document.querySelector('button[aria-haspopup="dialog"]').click()`);
      await wait(`document.querySelector('dialog')?.open`);
      await call('Input.dispatchKeyEvent', {type:'keyDown', key:'Escape', code:'Escape', windowsVirtualKeyCode:27});
      await call('Input.dispatchKeyEvent', {type:'keyUp', key:'Escape', code:'Escape', windowsVirtualKeyCode:27});
      await wait(`!document.querySelector('dialog')?.open`);
      assert.ok(await evaluate(`document.activeElement?.matches('button[aria-haspopup="dialog"]')`));
    });
    if (width === 390) await check('mobile navigation closes on selection', async () => {
      await go('/');
      await evaluate(`document.querySelector('button[aria-label="Открыть меню"]').click()`);
      await wait(`!!document.querySelector('nav[aria-label="Мобильная навигация"]')`);
      await evaluate(`document.querySelector('nav[aria-label="Мобильная навигация"] a[href="/catalog"]').click()`);
      await wait(`location.pathname === '/catalog' && !document.querySelector('nav[aria-label="Мобильная навигация"]')`);
    });
  }
  await check('generic quantity, replacement, fractional decrement and removal', async () => {
    await go('/cart');
    await evaluate(`localStorage.removeItem(${JSON.stringify(CART_STORAGE_KEY)})`);
    await go(pathFor(generic) + '#variant-' + generic.id);
    const selector = `#variant-mobile-${generic.id}`;
    await input(selector + ' input[type="number"]', '.5');
    await evaluate(`document.querySelector(${JSON.stringify(selector)}).querySelector('button').click()`);
    await wait(`document.querySelector(${JSON.stringify(selector)}).innerText.includes('В корзине')`);
    await go('/cart');
    assert.equal(await evaluate(`document.querySelector('main input[type="number"]').value`), '0.5');
    await input('main input[type="number"]', '1.5');
    await evaluate(`document.querySelector('button[aria-label="Уменьшить количество"]').click()`);
    assert.equal(await evaluate(`document.querySelector('main input[type="number"]').value`), '0.5');
    await evaluate(`[...document.querySelectorAll('main button')].find(b => b.textContent.trim() === 'Удалить').click()`);
    await wait(`document.querySelector('main').innerText.includes('Корзина пуста')`);
  });
  await check('rebar metres and tonnes use exact current mass in cart', async () => {
    await go(pathFor(rebar) + '#variant-' + rebar.id);
    const selector = `#variant-mobile-${rebar.id}`;
    await input(selector + ' input[aria-label^="Длина заказа"]', '100');
    await evaluate(`document.querySelector(${JSON.stringify(selector)}).querySelector('button').click()`);
    await wait(`document.querySelector(${JSON.stringify(selector)}).innerText.includes('В корзине')`);
    await go('/cart');
    const expected = new Intl.NumberFormat('ru-RU', {style:'currency', currency:'RUB', maximumFractionDigits:2}).format(Math.round(100 * rebar.weightPerMeterKg / 1000 * rebar.pricePerTon * 100) / 100).replace(/\s/g,'');
    assert.ok((await evaluate(`document.querySelector('main').innerText`)).replace(/\s/g,'').includes(expected));
  });
  await check('generic sorting, pagination and linked row after active filters', async () => {
    const largestType = productTypes.filter(t => !['cat-arm','cat-bal'].includes(t.categoryId)).sort((a,b) => productVariants.filter(v => v.productTypeId === b.id).length - productVariants.filter(v => v.productTypeId === a.id).length)[0];
    const variants = productVariants.filter(v => v.productTypeId === largestType.id);
    await go(pathFor(variants[0]));
    await evaluate(`const el = [...document.querySelectorAll('label')].find(l => l.textContent.trim().startsWith('Сортировка')).querySelector('select'); el.value = 'price-desc'; el.dispatchEvent(new Event('change', {bubbles:true}))`);
    await delay(200);
    const ids = await evaluate(`[...document.querySelectorAll('article[id^="variant-mobile-"]')].map(el => el.id.replace('variant-mobile-',''))`);
    const prices = ids.map(id => variants.find(v => v.id === id).price);
    const known = prices.filter(p => p !== null);
    assert.deepEqual(known, [...known].sort((a,b) => b-a));
    const first = ids[0];
    await evaluate(`[...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Далее').click()`);
    await delay(150);
    assert.notEqual(await evaluate(`document.querySelector('article[id^="variant-mobile-"]').id`), 'variant-mobile-' + first);
    await input('input[placeholder="Название, размер, марка"]', 'абракадабразавр');
    const linked = variants.at(-1);
    await evaluate(`location.hash = ${JSON.stringify('#variant-' + linked.id)}`);
    await wait(`!!document.getElementById(${JSON.stringify('variant-mobile-' + linked.id)})`);
  });
  await check('fractional cart and current prices; duplicate IDs', async () => {
    await go('/cart');
    await evaluate(`localStorage.setItem(${JSON.stringify(CART_STORAGE_KEY)}, ${JSON.stringify(JSON.stringify([{productId: generic.id, quantity: .5}, {productId: generic.id, quantity: .5}]))})`);
    await go('/cart');
    assert.equal(await evaluate(`document.querySelectorAll('main article').length`), 1);
    const expected = new Intl.NumberFormat('ru-RU', {style: 'currency', currency: 'RUB', maximumFractionDigits: 2}).format(generic.price * .5).replace(/\s/g, '');
    assert.ok((await evaluate(`document.querySelector('main').innerText`)).replace(/\s/g, '').includes(expected));
  });
  await check('unavailable stored product has no broken link; checkout blocked', async () => {
    await evaluate(`localStorage.setItem(${JSON.stringify(CART_STORAGE_KEY)}, '[{"productId":"missing-product","quantity":1}]')`);
    await go('/cart');
    assert.equal(await evaluate(`document.querySelectorAll('main article a[href^="/catalog/"]').length`), 0);
    await go('/checkout');
    assert.equal(await evaluate(`!!document.querySelector('main form')`), false);
  });
  await check('blocked browser storage keeps navigation working', async () => {
    await evaluate(`localStorage.removeItem(${JSON.stringify(CART_STORAGE_KEY)})`);
    const {identifier} = await call('Page.addScriptToEvaluateOnNewDocument', {source: `Storage.prototype.setItem = () => {throw new DOMException('Blocked', 'SecurityError')};`});
    const before = errors.length;
    await go('/catalog');
    await call('Page.removeScriptToEvaluateOnNewDocument', {identifier});
    assert.deepEqual(errors.slice(before), []);
  });
  await check('hero arrows, auto rotation, keyboard and reduced motion', async () => {
    await call('Emulation.setDeviceMetricsOverride', {width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false});
    await call('Input.dispatchMouseEvent', {type: 'mouseMoved', x: 0, y: 0});
    await go('/');
    await wait(`${hero}.querySelectorAll('img').length === 5 && [...${hero}.querySelectorAll('img')].every(i => i.complete && i.naturalWidth)`);
    const active = `${hero}.querySelector('img[data-active="true"]')?.getAttribute('src')`;
    const previous = await evaluate(active);
    await wait(`(${active}) !== ${JSON.stringify(previous)}`);
    await evaluate(`${hero}.querySelector('button[aria-label="Следующая фотография"]').focus()`);
    await call('Input.dispatchKeyEvent', {type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: '\r'});
    await call('Input.dispatchKeyEvent', {type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13});
    const focused = await evaluate(active);
    await delay(2300);
    assert.equal(await evaluate(active), focused, 'focus pauses autoplay');
    await call('Emulation.setEmulatedMedia', {features: [{name: 'prefers-reduced-motion', value: 'reduce'}]});
    await go('/');
    await wait(`${hero}.querySelectorAll('img').length === 5`);
    const reduced = await evaluate(active);
    await delay(2300);
    assert.equal(await evaluate(active), reduced);
    await evaluate(`${hero}.querySelector('button[aria-label="Следующая фотография"]').click()`);
    assert.notEqual(await evaluate(active), reduced);
    await call('Emulation.setEmulatedMedia', {features: []});
  });
  await check('hero skips decoding errors and handles zero, one and three usable images', async () => {
    await call('Network.setCacheDisabled', {cacheDisabled:true});
    await call('Fetch.enable', {patterns:[{urlPattern:'*%2Fimages%2Fhero%2F*',requestStage:'Request'}]});
    for (const count of [0,1,3]) {
      heroImagesAllowed = count;
      await go('/');
      await delay(1800);
      await wait(`${hero}.querySelectorAll('img').length === ${count}`);
      assert.equal(await evaluate(`${hero}.querySelectorAll('button').length`), count > 1 ? 2 : 0);
      assert.ok(await evaluate(`Boolean(${hero}.querySelector('h1') && ${hero}.querySelector('a[href="/catalog"]'))`));
      assert.equal(await evaluate(`document.documentElement.scrollWidth > innerWidth`), false);
    }
    heroImagesAllowed = 5;
    await call('Fetch.disable');
    await call('Network.setCacheDisabled', {cacheDisabled:false});
  });
  await check('contact failure never retains success; no real submission', async () => {
    await go('/contacts');
    await evaluate(`window.__submissions = 0; window.fetch = async () => {window.__submissions++; return Response.json(window.__submissions === 1 ? {ok:true} : {ok:false, error:'Тестовый отказ'}, {status:window.__submissions === 1 ? 200 : 503})}`);
    for (let n = 0; n < 2; n++) {
      for (const [name, value] of Object.entries({name: 'Тест', email: 'audit@example.invalid', message: 'Локальная проверка'})) await input(`[name="${name}"]`, value);
      await evaluate(`document.querySelector('[name="consent"]').checked = true; document.querySelector('main form').requestSubmit()`);
      await delay(150);
    }
    assert.ok(await evaluate(`document.body.innerText.includes('Тестовый отказ')`));
    assert.equal(await evaluate(`document.body.innerText.includes('Сообщение принято.')`), false);
  });
  await check('inquiry uses mocked destination and preserves message on failure', async () => {
    await go(pathFor(beam));
    await evaluate(`[...document.querySelectorAll('a')].find(a => /Запросить цену|Под заказ/.test(a.textContent))?.click()`);
    // Explicit product query also needs to work in the locally embedded form.
    await go(pathFor(beam) + '?product=' + encodeURIComponent(beam.name) + '#request');
    assert.ok((await evaluate(`document.querySelector('textarea[name="message"]').value`)).includes(beam.name));
    await evaluate(`window.fetch = async () => Response.json({ok:false, error:'Тестовый отказ'}, {status:503})`);
    for (const [name, value] of Object.entries({name:'Тест', email:'audit@example.invalid', phone:'+7 900 000-00-00'})) await input(`[name="${name}"]`, value);
    await evaluate(`document.querySelector('[name="consent"]').checked = true; document.querySelector('textarea').form.requestSubmit()`);
    await wait(`document.body.innerText.includes('Тестовый отказ')`);
    assert.equal(await evaluate(`document.body.innerText.includes('Заявка принята.')`), false);
  });
  await check('checkout preserves cart when payment destination rejects a mocked order', async () => {
    await evaluate(`localStorage.setItem(${JSON.stringify(CART_STORAGE_KEY)}, ${JSON.stringify(JSON.stringify([{productId:generic.id,quantity:.5}]))})`);
    await go('/checkout');
    await evaluate(`window.fetch = async url => url === '/api/orders' ? Response.json({ok:true,order:{reference:'MS-000000000001'}},{status:201}) : Response.json({ok:false,error:'Тестовый отказ оплаты'},{status:503})`);
    const fields = await evaluate(`[...document.querySelectorAll('main form label')].filter(l => l.querySelector('input:not([type="checkbox"]):not([type="radio"])')).map((l,i) => ({index:i,label:l.textContent}))`);
    for (const [i, value] of ['Тест', 'audit@example.invalid', '+79000000000', 'Москва, локальный тест'].entries()) {
      assert.ok(fields[i]);
      await evaluate(`(() => {const el=[...document.querySelectorAll('main form input')].filter(el=>!['checkbox','radio'].includes(el.type))[${i}];Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,${JSON.stringify(value)});el.dispatchEvent(new Event('input',{bubbles:true}));})()`);
      await delay(150);
    }
    await evaluate(`document.querySelector('main form input[type="checkbox"]').click(); document.querySelector('main form').requestSubmit()`);
    await wait(`document.querySelector('main').innerText.includes('Тестовый отказ оплаты')`);
    assert.equal(await evaluate(`JSON.parse(localStorage.getItem(${JSON.stringify(CART_STORAGE_KEY)})).length`), 1);
  });
  if (!baseline) {
    assert.deepEqual(errors, []);
    assert.deepEqual(failures, []);
  }
} finally {
  fs.writeFileSync(`${directory}/${baseline ? 'baseline' : 'final'}-browser.json`, JSON.stringify({base, results, errors, failures}, null, 2) + '\n');
  await call('Page.close').catch(() => {});
  socket.close();
  console.log(JSON.stringify({checks: results.length, passed: results.filter(r => r.ok).length, failed: results.filter(r => !r.ok), consoleErrors: errors.length, networkFailures: failures.length}, null, 2));
}
