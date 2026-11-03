import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import sharp from 'sharp';

// The owner approved building the reflection from the actual cut face.
// Only the floor below its contact edge changes; no generative editing.
const input = 'output/image-edits/kvadrat-sawn-reference-pose-2400x1800.png';
const output = 'output/image-edits/kvadrat-sawn-reflection-corrected-2400x1800.png';
const {data: original, info} = await sharp(input).removeAlpha().raw().toBuffer({resolveWithObject: true});
const {width, height, channels} = info;
assert.equal(width, 2400); assert.equal(height, 1800); assert.equal(channels, 3);
const softened = await sharp(original, {raw: info}).blur(1.1).raw().toBuffer();
const pixels = Buffer.from(original);
const left = 1018, right = 1500;
const slope = (1258 - 1182) / (right - left);
const contactY = x => 1182 + slope * (x - left);
const faceTopY = x => 778 + (856 - 778) * (x - left) / (right - left);
const clamp = value => Math.max(0, Math.min(1, value));
const smooth = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
function sample(buffer, x, y, channel) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
  const read = (dx, dy) => buffer[((iy + dy) * width + ix + dx) * channels + channel];
  return (1 - fy) * ((1 - fx) * read(0, 0) + fx * read(1, 0))
    + fy * ((1 - fx) * read(0, 1) + fx * read(1, 1));
}
let changedPixels = 0;
for (let y = 1180; y < 1750; y++) {
  for (let x = left - 8; x < right + 8; x++) {
    const depth = y - contactY(x);
    // Retain the real product outline and its existing contact shadow.
    if (depth <= 8) continue;
    const sideMask = smooth((x - (left - 8)) / 18) * smooth(((right + 8) - x) / 18);
    const erase = sideMask * smooth((depth - 8) / 15) * (1 - smooth((depth - 380) / 120));
    if (erase <= 0) continue;
    const sourceX = Math.max(left + 10, Math.min(right - 10, x));
    // Reflect the vertical face about its projected floor-contact line:
    // x' = x, y' = 2 * contactY(x) - y. This reverses the saw-mark slope.
    const sourceY = 2 * contactY(sourceX) - y;
    const inside = smooth((sourceY - faceTopY(sourceX)) / 15);
    const opacity = 0.43 * Math.exp(-depth / 155) * inside;
    const base = [254, 253, 254];
    const index = (y * width + x) * channels;
    let changed = false;
    for (let c = 0; c < channels; c++) {
      const texture = inside > 0 ? sample(softened, sourceX, sourceY, c) : base[c];
      const reflected = base[c] * (1 - opacity) + texture * opacity;
      pixels[index + c] = Math.round(original[index + c] * (1 - erase) + reflected * erase);
      changed ||= pixels[index + c] !== original[index + c];
    }
    if (changed) changedPixels++;
  }
}
// Prove that the complete product and all pixels above its floor plane survive.
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    if (x >= left - 8 && x < right + 8 && y > contactY(x) + 8 && y < 1750) continue;
    const index = (y * width + x) * channels;
    assert.ok(pixels.subarray(index, index + channels).equals(original.subarray(index, index + channels)));
  }
}
await sharp(pixels, {raw: info}).png().toFile(output);
const crop = {left: 990, top: 1090, width: 550, height: 510};
await sharp(pixels, {raw: info}).extract(crop).png().toFile('output/image-edits/kvadrat-reflection-corrected-detail.png');
await fs.writeFile('output/image-edits/kvadrat-reflection-correction.txt',
  `Method: deterministic projected reflection of the existing end-face pixels; no image-generation prompt or AI edits.\nInput: ${input}\nOutput: ${output}\nMapping: x'=x; y'=2*(1182+(1258-1182)/(1500-1018)*(x-1018))-y.\nReflection: Gaussian blur 1.1 px, opacity 0.43*exp(-depth/155), feathered floor mask.\nVerified: all product pixels and all pixels outside the reflection floor region are unchanged.\nChanged floor pixels: ${changedPixels}.\n`);
console.log(JSON.stringify({output, width, height, changedPixels, unchangedProductPixels: true}));
