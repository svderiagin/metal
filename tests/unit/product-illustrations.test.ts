import assert from "node:assert/strict";
import {existsSync} from "node:fs";
import {join} from "node:path";
import test from "node:test";
import sharp from "sharp";
import illustrations from "../../data/product-illustrations.json";
import {getAllProductVariants} from "../../lib/catalog";
import {productIllustrationFacts} from "../../lib/productIllustrationFacts";
import {getProductIllustration, productIllustrationSignature} from "../../lib/productPreviewImage";

const approvedCategories = new Set(["rozmet-cat-shveller", "rozmet-cat-ugolok", "rozmet-cat-kvadrat", "rozmet-cat-listovoy-prokat"]);
const products = getAllProductVariants();
const generatedProducts = products.filter(product => !approvedCategories.has(product.categoryId));
const generated: Partial<Record<string, {imageUrl: string; photoUrl: string; signature: string}>> = illustrations;

test("technical captions do not repeat values or units", () => {
  for (const item of generatedProducts) {
    const facts = productIllustrationFacts(item);
    assert.equal(new Set(facts.map(fact => fact.name)).size, facts.length, item.id);
    for (const aliases of [/длина/iu, /масса|вес/iu, /сечение|размер по каталогу|размеры по обозначению|диаметр по каталогу/iu]) {
      assert.ok(facts.filter(fact => aliases.test(fact.name)).length <= 1, `${item.id}: ${aliases}`);
    }
    for (const {value} of facts) assert.doesNotMatch(value, /(?:м\s+м|мм\s+мм|кг\/м\s+м)$/u, item.id);
  }
});

test("approved channel, angle, square and sheet artwork keeps its original product URLs", () => {
  for (const product of products.filter(item => approvedCategories.has(item.categoryId))) {
    assert.equal(generated[product.id], undefined, product.id);
    assert.equal(getProductIllustration(product), undefined, product.id);
    assert.ok(existsSync(join("public", product.imageUrls[0])), product.id);
  }
});

test("every illustration belongs to the exact SKU and is a full-size production image", async () => {
  assert.deepEqual(new Set(Object.keys(generated)), new Set(generatedProducts.map(product => product.id)));
  await Promise.all(generatedProducts.map(async product => {
    const image = generated[product.id]!;
    assert.equal(image.signature, productIllustrationSignature(product), product.id);
    const suppliedVgp = product.id === "local-984";
    const electrowelded = ["cat-trk-sub-2", "cat-trk-sub-4"].includes(product.subcategoryId);
    const pipeFolder = product.subcategoryId === "cat-trk-sub-4" ? "elektrosvarnaya_ocinkovannaya" : "elektrosvarnaya";
    assert.equal(image.imageUrl, suppliedVgp
      ? "/images/catalog/truba-kruglaya/vgp_ocinkovannaya/truba_vgp_ocinkovannaya_2400_1800_marked.jpg"
      : electrowelded ? `/images/catalog/truba-kruglaya/${pipeFolder}/${product.id}.jpg`
      : `/images/catalog/product-illustrations/${product.id}.webp`, product.id);
    assert.deepEqual(getProductIllustration(product), image, product.id);
    assert.equal(getProductIllustration({...product, name: `${product.name} — изменённая позиция`}), undefined, product.id);
    if (product.categoryId === "cat-bal") {
      assert.equal(getProductIllustration({...product, standard: "другой стандарт сортамента"}), undefined, product.id);
    }
    assert.match(image.photoUrl, /^\/images\/catalog\//u, product.id);
    assert.notEqual(image.photoUrl, image.imageUrl, product.id);
    assert.ok(existsSync(join("public", image.photoUrl)), product.id);
    const {format, width, height} = await sharp(join("public", image.imageUrl)).metadata();
    assert.deepEqual([format, width, height], [suppliedVgp || electrowelded ? "jpeg" : "webp", 2400, 1800], product.id);
  }));
});
