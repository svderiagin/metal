import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readProjectData} from './project-data.mjs';
import {numberSignRemovalTargets, removeImageNumberSign} from './image-number-sign.mjs';

// Reuse the reviewed text-only patch. Keep the historical №-removal recipe intact.
const directory = 'output/image-edits/flat-steel-names';
const apply = process.argv.includes('--apply-reviewed');
const selectedIds = process.argv.slice(2).filter(value => !value.startsWith('--'));
const fontDirectory = new URL('../imports/shveller-image-template/fonts/', import.meta.url).pathname;
await fs.mkdir('.tmp/flat-steel-font-cache', {recursive: true});
await fs.writeFile('.tmp/flat-steel-fonts.conf', `<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "urn:fontconfig:fonts.dtd"><fontconfig><dir>${fontDirectory}</dir><cachedir>${process.cwd()}/.tmp/flat-steel-font-cache</cachedir></fontconfig>`);
process.env.FONTCONFIG_FILE = `${process.cwd()}/.tmp/flat-steel-fonts.conf`;
process.env.PANGOCAIRO_BACKEND = 'fontconfig';
const {default: sharp} = await import('sharp');
const cache = new Map();
const {productVariants} = readProjectData('data/products/index.ts', cache);
const {flatSteelCategoryId} = readProjectData('lib/flatSteel.ts', cache);
const {productIllustrationSignature} = readProjectData('lib/productPreviewImage.ts', cache);
const products = productVariants.filter(product => product.categoryId === flatSteelCategoryId
  && (!selectedIds.length || selectedIds.includes(product.id)));
assert.ok(products.length, 'No matching steel strip products');
await fs.mkdir(`${directory}/before`, {recursive: true});
await fs.mkdir(`${directory}/after`, {recursive: true});
const manifest = JSON.parse(await fs.readFile('data/product-illustrations.json', 'utf8'));
const reviewed = apply ? JSON.parse(await fs.readFile(`${directory}/result.json`, 'utf8')) : undefined;
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const records = [];
for (const product of products) {
  const target = numberSignRemovalTargets.find(({id}) => id === product.id);
  assert.equal(target?.kind, 'genericTitle');
  const production = target.outputFile;
  const beforeFile = `${directory}/before/${product.id}.webp`;
  const afterFile = `${directory}/after/${product.id}.webp`;
  const current = await fs.readFile(production);
  const signature = productIllustrationSignature(product);
  if (apply) {
    const record = reviewed.records.find(({id}) => id === product.id);
    assert.equal(record?.name, product.name);
    assert.equal(record.signature, signature, `${product.id}: catalog changed after review`);
    const after = await fs.readFile(afterFile);
    assert.equal(hash(after), record.afterSha256, `${product.id}: preview changed after review`);
    assert.ok([record.beforeSha256, record.afterSha256].includes(hash(current)), `${product.id}: production changed after review`);
    await fs.writeFile(production, after);
    manifest[product.id].signature = signature;
  } else {
    await fs.writeFile(beforeFile, current, {flag: 'wx'}).catch(error => {if (error.code !== 'EEXIST') throw error;});
    const before = await fs.readFile(beforeFile);
    target.to = product.name;
    const after = await removeImageNumberSign(sharp, before, product.id);
    await fs.writeFile(afterFile, after);
    records.push({id: product.id, name: product.name, signature, production,
      before: beforeFile, after: afterFile, beforeSha256: hash(before), afterSha256: hash(after), protectedPixelChanges: 0});
  }
  console.log(`${product.id}: ${product.name}${apply ? ' — applied' : ' — preview'}`);
}
if (apply) await fs.writeFile('data/product-illustrations.json', JSON.stringify(manifest, null, 2) + '\n');
else await fs.writeFile(`${directory}/result.json`, JSON.stringify({method: 'Title-only lossless patch; every pixel outside the heading stays exact.', records}, null, 2) + '\n');
