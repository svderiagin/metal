import test from 'node:test';
import assert from 'node:assert/strict';
import {readProjectData} from './project-data.mjs';

const {imageViewGeometry, clampImagePan, imageZoomPan} = readProjectData('lib/imageViewer.ts');

test('landscape and portrait images fit available space without changing aspect ratio', () => {
  const landscape = imageViewGeometry({width: 2400, height: 1800}, {width: 1440, height: 840}, false);
  assert.equal(landscape.width, 1120);
  assert.equal(landscape.height, 840);
  const portrait = imageViewGeometry({width: 800, height: 1600}, {width: 390, height: 780}, false);
  assert.equal(portrait.width, 390);
  assert.equal(portrait.height, 780);
  const panorama = imageViewGeometry({width: 3000, height: 500}, {width: 390, height: 780}, false);
  assert.equal(panorama.width, 390);
  assert.equal(panorama.height, 65);
});

test('1:1 uses native dimensions, and panning cannot expose space beyond either edge', () => {
  const original = imageViewGeometry({width: 2400, height: 1800}, {width: 800, height: 600}, true);
  assert.equal(original.width, 2400);
  assert.equal(original.height, 1800);
  const pan = clampImagePan({x: 4000, y: -4000}, original.limit);
  assert.equal(pan.x, 800);
  assert.equal(pan.y, -600);
  const panorama = imageViewGeometry({width: 3000, height: 500}, {width: 390, height: 780}, true);
  assert.equal(clampImagePan({x: 0, y: 100}, panorama.limit).y, 0);
});

test('click-to-zoom keeps the clicked detail in place and clamps clicks outside the photo', () => {
  const original = imageViewGeometry({width: 2400, height: 1800}, {width: 800, height: 600}, true);
  const pan = imageZoomPan({x: 100, y: 50}, original.fitScale, original.limit);
  assert.equal(pan.x, -200);
  assert.equal(pan.y, -100);
  assert.equal(100 / original.fitScale + pan.x, 100);
  const outside = imageZoomPan({x: 900, y: 900}, original.fitScale, original.limit);
  assert.equal(outside.x, -800);
  assert.equal(outside.y, -600);
});

test('small and not-yet-loaded images never receive artificial enlargement', () => {
  const small = imageViewGeometry({width: 320, height: 200}, {width: 1440, height: 840}, false);
  assert.equal(small.canZoom, false);
  assert.equal(small.width, 320);
  assert.equal(small.height, 200);
  const loading = imageViewGeometry({width: 0, height: 0}, {width: 390, height: 780}, true);
  assert.equal(loading.canZoom, false);
  assert.equal(loading.width, 0);
});
