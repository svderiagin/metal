import {test} from "node:test";
import assert from "node:assert/strict";
import {createRequire} from "node:module";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {coverGalleryImages, coverGalleryIndex} from "../../lib/catalogCoverGallery";
import {getCatalogCoverImages} from "../../lib/catalogCoverImages";

test("cover stays first; additional photos are ordered, deduplicated and not mutated", () => {
  const additional = Object.freeze([" /second.jpg ", "/cover.jpg", "", "/third.jpg", "/second.jpg"]);
  assert.deepEqual(coverGalleryImages("/cover.jpg", additional), ["/cover.jpg", "/second.jpg", "/third.jpg"]);
  assert.equal(additional[0], " /second.jpg ");
  assert.deepEqual(coverGalleryImages(" "), []);
  assert.deepEqual(getCatalogCoverImages("unconfigured-category", "/cover.jpg"), ["/cover.jpg"]);
});

test("gallery cycles in either direction and handles a single or missing photo", () => {
  assert.equal(coverGalleryIndex(2, 1, 3), 0);
  assert.equal(coverGalleryIndex(0, -1, 3), 2);
  assert.equal(coverGalleryIndex(1, 1, 3), 2);
  assert.equal(coverGalleryIndex(0, -1, 1), 0);
  assert.equal(coverGalleryIndex(0, 1, 0), 0);
});

test("one-photo cover has no inactive navigation; supplied photos enable both controls", () => {
  // Next normally compiles CSS modules before the gallery reaches React.
  const load = createRequire(import.meta.url);
  const cssLoader = load.extensions[".css"];
  load.extensions[".css"] = module => { module.exports = {}; };
  let CatalogCoverGallery: typeof import("../../components/catalog/CatalogCoverGallery").CatalogCoverGallery;
  try {
    ({CatalogCoverGallery} = load("../../components/catalog/CatalogCoverGallery"));
  } finally {
    if (cssLoader) load.extensions[".css"] = cssLoader;
    else delete load.extensions[".css"];
  }
  const render = (images: string[]) => renderToStaticMarkup(createElement(CatalogCoverGallery, {images, name: "Категория"}));
  const single = render(["/cover.jpg", "/cover.jpg"]);
  assert.doesNotMatch(single, /Следующее фото|Предыдущее фото/);
  const multiple = render(["/cover.jpg", "/second.jpg"]);
  assert.match(multiple, /Следующее фото/);
  assert.match(multiple, /Предыдущее фото/);
  assert.match(multiple, /aria-live="polite"/);
  assert.equal(render([]), "");
});
