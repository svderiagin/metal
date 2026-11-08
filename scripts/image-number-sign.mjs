import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {coldRolledPalette} from './cold-rolled-palette.mjs';

const specification = JSON.parse(await fs.readFile(new URL('../imports/number-sign-removal/patches.json', import.meta.url), 'utf8'));
export const numberSignRemovalTargets = specification.targets;

// Preserve the existing raster glyphs rather than selecting a new font backend.
// Apply only to reviewed raster headings or generic text-only heading regions.
export async function removeImageNumberSign(sharp, input, productId) {
  const target = numberSignRemovalTargets.find(({id}) => id === productId);
  if (!target) return input;
  const {width, height} = specification;
  if (target.kind === 'genericTitle') {
    const fontPath='imports/shveller-image-template/fonts/Inter-variable.ttf';
    const escaped=value=>value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
    const render=value=>sharp({text:{text:`<span foreground="#41464D" weight="700">${escaped(value)}</span>`,font:'Inter 76',fontfile:fontPath,dpi:72,rgba:true,width:1710,wrap:'word-char'}}).png().toBuffer({resolveWithObject:true});
    const old=await render(target.from),text=await render(target.to);
    assert.ok(old.info.height<=254&&text.info.height<=old.info.height);
    const box={left:116,top:112,width:1740,height:old.info.height+24};
    const original=await sharp(input).removeAlpha().raw().toBuffer();
    const blank=await sharp({create:{width:box.width,height:box.height,channels:3,background:'#fff'}}).png().toBuffer();
    const cleared=await sharp(input).composite([{input:blank,left:box.left,top:box.top}]).png().toBuffer();
    const output=await sharp(cleared).composite([{input:text.data,left:128,top:124}]).webp({lossless:true,effort:4}).toBuffer();
    const pixels=await sharp(output).removeAlpha().raw().toBuffer();
    for(let y=0;y<height;y++) {
      const row=y*width*3,inPatch=y>=box.top&&y<box.top+box.height,end=inPatch?row+box.left*3:row+width*3;
      assert.ok(original.subarray(row,end).equals(pixels.subarray(row,end)),`${productId}: protected pixels changed`);
      if(inPatch){const start=row+(box.left+box.width)*3;assert.ok(original.subarray(start,row+width*3).equals(pixels.subarray(start,row+width*3)),`${productId}: protected pixels changed`);}
    }
    return output;
  }
  const metadata = await sharp(input).metadata();
  assert.deepEqual([metadata.width, metadata.height], [width, height]);
  const patch = await sharp(input).removeAlpha().extract(target.box).raw().toBuffer();
  const hash = createHash('sha256').update(patch).digest('hex');
  assert.equal(hash, target.inputPatchSha256, `${productId}: heading changed; review the number-sign patch before applying it`);
  const original = await sharp(input).removeAlpha().raw().toBuffer();
  const pixels = Buffer.from(original);
  const background = await sharp(target.clean).resize(width, height).removeAlpha().extract(target.box).raw().toBuffer();
  const {box, tailLeft, shiftLeft} = target;
  if (target.background === 'interpolateOriginal') {
    // This supplied reference has a subtly different blank backdrop from the
    // generated background plate. Continue its own empty background instead.
    for(let y=0;y<box.height;y++)for(let x=0;x<box.width;x++)for(let c=0;c<3;c++) {
      const a=original[((box.top*width)+box.left+x)*3+c];
      const b=original[(((box.top+box.height-1)*width)+box.left+x)*3+c];
      background[(y*box.width+x)*3+c]=Math.round(a+(b-a)*y/(box.height-1));
    }
  }
  const tailWidth = box.left + box.width - tailLeft;
  assert.ok(tailLeft - shiftLeft >= box.left);
  for (let y = 0; y < box.height; y++) {
    const row = (box.top + y) * width * 3;
    background.copy(pixels, row + box.left * 3, y * box.width * 3, (y + 1) * box.width * 3);
    if(target.background === 'interpolateOriginal') {
      for(let x=0;x<tailWidth;x++) {
        const source=row+(tailLeft+x)*3,bg=(background[(y*box.width+tailLeft+x-box.left)*3]+background[(y*box.width+tailLeft+x-box.left)*3+1]+background[(y*box.width+tailLeft+x-box.left)*3+2])/3;
        if((original[source]+original[source+1]+original[source+2])/3<bg-6)original.copy(pixels,row+(tailLeft-shiftLeft+x)*3,source,source+3);
      }
    } else original.copy(pixels, row + (tailLeft - shiftLeft) * 3, row + tailLeft * 3, row + (tailLeft + tailWidth) * 3);
  }
  const output = await sharp(pixels, {raw: {width, height, channels: 3}}).webp({lossless: true, effort: 6}).toBuffer();
  const delivered = await sharp(output).removeAlpha().raw().toBuffer();
  assert.ok(delivered.equals(pixels), `${productId}: output must preserve the patched pixels losslessly`);
  for (let y = 0; y < height; y++) {
    const start = y * width * 3;
    const inPatch = y >= box.top && y < box.top + box.height;
    const leftEnd = inPatch ? start + box.left * 3 : start + width * 3;
    assert.ok(original.subarray(start, leftEnd).equals(delivered.subarray(start, leftEnd)), `${productId}: protected pixels changed`);
    if (inPatch) {
      const rightStart = start + (box.left + box.width) * 3;
      assert.ok(original.subarray(rightStart, start + width * 3).equals(delivered.subarray(rightStart, start + width * 3)), `${productId}: protected pixels changed`);
    }
  }
  return productId === 'rozmet-2182' ? (await coldRolledPalette(sharp, output)).image : output;
}
