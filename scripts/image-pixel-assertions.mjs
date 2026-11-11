import assert from 'node:assert/strict';
import sharp from 'sharp';
import {numberSignRemovalTargets, removeImageNumberSign} from './image-number-sign.mjs';

const width = 2400;
const height = 1800;
const channels = 3;

export async function assertReferencePixels(manifest, referenceVariantId) {
  const reference = await sharp(manifest.reference).removeAlpha().raw().toBuffer();
  if (referenceVariantId) assert.ok(manifest.records.some(({id}) => id === referenceVariantId), referenceVariantId);
  for (const record of manifest.records) {
    const imagePath = `public${record.imageUrl}`;
    const rendered = await sharp(imagePath).removeAlpha().raw().toBuffer({resolveWithObject: true});
    assert.deepEqual([rendered.info.width, rendered.info.height, rendered.info.channels], [width, height, channels], record.id);

    const boxes = record.changedLabels.map(key => manifest.patches[key]);
    const correction = numberSignRemovalTargets.find(target => target.id === record.id);
    const expectedHeading = correction && {removed: '№', box: correction.box, shiftLeft: correction.shiftLeft};
    assert.deepEqual(record.headingCorrection, expectedHeading, record.id);
    if (correction) {
      assert.equal(correction.outputFile, imagePath, record.id);
      boxes.push(correction.box);
    }

    const editable = Buffer.alloc(width * height);
    for (const {left, top, width: boxWidth, height: boxHeight} of boxes) {
      assert.ok(boxWidth > 0 && boxHeight > 0 && left >= 0 && top >= 0 && left + boxWidth <= width && top + boxHeight <= height, record.id);
      for (let y = top; y < top + boxHeight; y++) editable.fill(1, y * width + left, y * width + left + boxWidth);
    }
    let changed = 0;
    for (let pixel = 0; pixel < editable.length; pixel++) {
      if (editable[pixel]) continue;
      const offset = pixel * channels;
      if (reference[offset] !== rendered.data[offset] || reference[offset + 1] !== rendered.data[offset + 1]
        || reference[offset + 2] !== rendered.data[offset + 2]) changed++;
    }
    assert.equal(changed, 0, `${record.id}: pixels changed outside the approved label regions`);

    if (record.id === referenceVariantId) {
      assert.deepEqual(record.changedLabels, [], record.id);
      const correctedReference = await removeImageNumberSign(sharp, manifest.reference, record.id);
      const expected = await sharp(correctedReference).removeAlpha().raw().toBuffer();
      assert.ok(expected.equals(rendered.data), `${record.id}: preserve the approved reference with its heading correction`);
    }
  }
}
