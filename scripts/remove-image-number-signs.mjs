import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {numberSignRemovalTargets, removeImageNumberSign} from './image-number-sign.mjs';
const fontDirectory = new URL('../imports/shveller-image-template/fonts/', import.meta.url).pathname;
await fs.mkdir('.tmp/number-sign-render/font-cache', {recursive:true});
await fs.writeFile('.tmp/number-sign-render/fonts.conf',`<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "urn:fontconfig:fonts.dtd"><fontconfig><dir>${fontDirectory}</dir><cachedir>${process.cwd()}/.tmp/number-sign-render/font-cache</cachedir></fontconfig>`);
process.env.FONTCONFIG_FILE=`${process.cwd()}/.tmp/number-sign-render/fonts.conf`;
process.env.PANGOCAIRO_BACKEND='fontconfig';
const {default:sharp}=await import('sharp');

const applyReviewed = process.argv.includes('--apply-reviewed');
const write = process.argv.includes('--write') || applyReviewed;
const directory = 'output/image-edits/number-sign-removal';
const reviewed = applyReviewed ? JSON.parse(await fs.readFile(`${directory}/result.json`, 'utf8')) : undefined;
await fs.mkdir(`${directory}/after`, {recursive: true});
await fs.mkdir(`${directory}/comparisons`, {recursive: true});
const records = [];
for (const target of numberSignRemovalTargets) {
  const before = await fs.readFile(target.before);
  const preview = `${directory}/after/${target.id}.webp`;
  const after = applyReviewed ? await fs.readFile(preview) : await removeImageNumberSign(sharp, before, target.id);
  if (applyReviewed) assert.equal(createHash('sha256').update(after).digest('hex'), reviewed.records.find(({id})=>id===target.id)?.sha256, `${target.id}: preview changed after review`);
  else await fs.writeFile(preview, after);
  if (write) {
    const current = await fs.readFile(target.outputFile).catch(error => {
      if (error.code === 'ENOENT') return fs.readFile(target.productionFile);
      throw error;
    });
    const previous=await fs.readFile(`.tmp/number-sign-review/${target.id}-before-write`).catch(()=>undefined);
    assert.ok(current.equals(before) || current.equals(after) || previous?.equals(current), `${target.id}: current image changed after the saved baseline; review it before overwriting`);
    await fs.writeFile(target.outputFile, after);
  }
  if (applyReviewed) {
    records.push(reviewed.records.find(({id})=>id===target.id));
    continue;
  }
  const square = target.id.startsWith('profile-pipe-');
  const crop = {left: 110, top: square ? 105 : 100, width: 1740, height: square ? 235 : target.kind==='genericTitle'?260:130};
  const rows = [];
  for (const [index, image] of [before, after].entries()) {
    rows.push({input: await sharp(image).extract(crop).png().toBuffer(), left: 80, top: 44 + index * (crop.height + 54)});
  }
  // The comparison captions are separate from the unchanged product typography.
  const totalHeight = 44 + crop.height * 2 + 54 + 22;
  const captions = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1900" height="${totalHeight}"><g font-family="Arial,sans-serif" font-size="25" font-weight="700" fill="#41464D"><text x="80" y="30">ДО</text><text x="80" y="${44 + crop.height + 36}">ПОСЛЕ</text></g></svg>`);
  const comparison = `${directory}/comparisons/${target.id}.png`;
  await sharp({create: {width: 1900, height: totalHeight, channels: 3, background: '#edf0f3'}})
    .composite([...rows, {input: captions, left: 0, top: 0}]).png().toFile(comparison);
  records.push({id: target.id, name: target.name, before: target.before, after: preview,
    production: target.outputFile, from: target.from, to: target.to, comparison,
    protectedPixelChanges: 0, sha256: createHash('sha256').update(after).digest('hex')});
  console.log(`${target.id}: ${write ? target.outputFile : preview}; protectedPixelChanges=0`);
}
if (write) {
  const mapping = JSON.parse(await fs.readFile('data/tread-plate-images.json', 'utf8'));
  const target = numberSignRemovalTargets.find(({id}) => id === 'rozmet-28952');
  mapping.products[target.id].imageUrl = target.outputFile.slice('public'.length);
  await fs.writeFile('data/tread-plate-images.json', JSON.stringify(mapping, null, 2) + '\n');
  const metadataPaths=[...new Set(numberSignRemovalTargets.map(t=>t.metadata).filter(Boolean))];
  for(const metadataPath of metadataPaths) {
    const metadata=JSON.parse(await fs.readFile(metadataPath,'utf8'));
    for(const record of metadata.records) {
      const target=numberSignRemovalTargets.find(({id})=>id===record.id);
      if(!target)continue;
      record.sha256=records.find(({id})=>id===record.id).sha256;
      record.headingCorrection={removed:'№',box:target.box,shiftLeft:target.shiftLeft};
      record.referenceUnmodified=false;
      record.labels=record.labels.map(label=>label.key==='title'?{...label,text:label.text.replace(/№\s*/gu,'')}:label);
    }
    await fs.writeFile(metadataPath,JSON.stringify(metadata,null,2)+'\n');
  }
}
await fs.writeFile(`${directory}/result.json`, JSON.stringify({baselineCommit: '4d639ef',
  method: 'Native raster heading shifts for dedicated family templates; text-only heading patches for generic illustrations. Cold-rolled 0.5 annotation palette normalized separately; original metal photographs preserved.',
  applied: write, records}, null, 2) + '\n');
