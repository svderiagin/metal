import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import {productVariants} from "../data/products/index.ts";
import {productIllustrationFacts} from "../lib/productIllustrationFacts.ts";
import {productIllustrationSignature} from "../lib/productPreviewImage.ts";

const temp = path.resolve(".tmp/product-illustrations");
const fontPath = path.resolve("imports/shveller-image-template/fonts/Inter-variable.ttf");
const fontConfiguration = path.join(temp, "fonts.conf");
await fs.mkdir(temp, {recursive: true});
await fs.mkdir(path.join(temp, "font-cache"), {recursive: true});
await fs.writeFile(fontConfiguration,
  `<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "urn:fontconfig:fonts.dtd"><fontconfig><dir>${path.dirname(fontPath)}</dir><cachedir>${path.join(temp, "font-cache")}</cachedir></fontconfig>`);
process.env.FONTCONFIG_FILE = fontConfiguration;
process.env.PANGOCAIRO_BACKEND = "fontconfig";
const {default: sharp} = await import("sharp");
sharp.concurrency(2);

const sources = JSON.parse(await fs.readFile("data/product-illustration-sources.json", "utf8"));
const protectedCategories = new Set([
  "rozmet-cat-shveller", "rozmet-cat-ugolok", "rozmet-cat-kvadrat", "rozmet-cat-listovoy-prokat",
]);
// Owner-approved square-pipe template has a separate lossless label renderer.
const protectedProductTypes = new Set(["type-cat-trp-sub-1"]);
const width = 2400;
const height = 1800;
const textColor = "#41464D";
const lineColor = "#59636F";
const white = "#ffffff";
const production = "public/images/catalog/product-illustrations";
const write = process.argv.includes("--write");
const samples = process.argv.slice(2).filter(argument => !argument.startsWith("--"));

const products = productVariants.filter(product => !protectedCategories.has(product.categoryId)
  && !protectedProductTypes.has(product.productTypeId)
  && (!samples.length || samples.includes(product.id)));
assert(products.length > 0, "No matching products to illustrate");
const output = await fs.mkdtemp(path.join(temp, "render-"));
const cachedPhotos = new Map();
const cachedText = new Map();

function escaped(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function ink(value, size, weight, maxWidth) {
  const key = JSON.stringify([value, size, weight, maxWidth]);
  if (!cachedText.has(key)) {
    const text = `<span foreground="${textColor}" weight="${weight}">${escaped(value)}</span>`;
    cachedText.set(key, sharp({text: {text, font: `Inter ${size}`, fontfile: fontPath,
      dpi: 72, rgba: true, width: maxWidth, wrap: "word-char"}}).png().toBuffer({resolveWithObject: true}));
  }
  return cachedText.get(key);
}

function productPhoto(url) {
  if (!cachedPhotos.has(url)) {
    cachedPhotos.set(url, sharp(`public${url}`).rotate().trim({background: white, threshold: 16})
      .resize(1230, 1050, {fit: "inside", background: white})
      .flatten({background: white}).png().toBuffer({resolveWithObject: true}));
  }
  return cachedPhotos.get(url);
}

function sectionDiagram(product, facts) {
  const unit = value => `${String(value).replace(".", ",")} мм`;
  const line = (x1, y1, x2, y2, arrow = false) => `<path d="M${x1} ${y1}L${x2} ${y2}"${arrow ? ' marker-start="url(#start)" marker-end="url(#end)"' : ""}/>`;
  const text = (value, x, y) => `<text x="${x}" y="${y}" stroke="none" fill="${textColor}" text-anchor="middle">${escaped(value)}</text>`;
  let shape = "";
  if (product.profileWidthMm && product.profileHeightMm && product.wallThicknessMm) {
    const scale = Math.min(310 / product.profileWidthMm, 203 / product.profileHeightMm);
    const w = product.profileWidthMm * scale;
    const h = product.profileHeightMm * scale;
    const x = 155 + (310 - w) / 2, y = 18 + (203 - h) / 2;
    const thickness = Math.min(26, w / 5, h / 5);
    shape = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="#e9ecef"/>
      <rect x="${x + thickness}" y="${y + thickness}" width="${w - thickness * 2}" height="${h - thickness * 2}" rx="4" fill="white"/>`
      + line(x, y + h, x, 254) + line(x + w, y + h, x + w, 254) + line(x + 5, 247, x + w - 5, 247, true)
      + text(unit(product.profileWidthMm), x + w / 2, 292)
      + line(x + w, y, 494, y) + line(x + w, y + h, 494, y + h)
      + line(488, y + 5, 488, y + h - 5, true) + text(unit(product.profileHeightMm), 584, y + h / 2 + 12);
  } else if (product.diameterMm && ["cat-arm", "cat-trk"].includes(product.categoryId)) {
    const hollow = product.categoryId === "cat-trk";
    shape = '<circle cx="263" cy="114" r="94" fill="#e9ecef"/>'
      + (hollow ? '<circle cx="263" cy="114" r="73" fill="white"/>' : "")
      + line(169, 114, 169, 251) + line(357, 114, 357, 251) + line(174, 244, 352, 244, true)
      + text(`Ø ${unit(product.diameterMm)}`, 263, 288);
  } else if (product.categoryId === "rozmet-cat-polosa") {
    const widthLabel = facts.find(fact => fact.name === "Ширина")?.value;
    const thicknessLabel = facts.find(fact => fact.name === "Толщина")?.value;
    if (widthLabel && thicknessLabel) {
      shape = '<rect x="125" y="105" width="320" height="67" rx="4" fill="#e9ecef"/>'
        + line(125, 173, 125, 244) + line(445, 173, 445, 244) + line(130, 237, 440, 237, true)
        + text(widthLabel, 285, 284)
        + line(445, 105, 498, 105) + line(445, 172, 498, 172)
        + line(490, 110, 490, 167, true) + text(thicknessLabel, 574, 150);
    }
  }
  if (!shape) return;
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="700" height="315">
    <defs>
      <marker id="start" viewBox="0 0 10 10" refX="2" refY="5" markerWidth="5" markerHeight="5" orient="auto">
        <path d="M10 0L0 5L10 10Z" fill="${lineColor}"/>
      </marker>
      <marker id="end" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
        <path d="M0 0L10 5L0 10Z" fill="${lineColor}"/>
      </marker>
    </defs>
    <g stroke="${lineColor}" stroke-width="4" fill="none" font-family="Inter" font-size="38">${shape}</g>
  </svg>`);
}

async function render(product) {
  const source = sources.byProduct[product.id] ?? sources.byType[product.productTypeId] ?? product.imageUrls[0];
  assert(source?.startsWith("/images/catalog/") && !source.endsWith(".svg"), `${product.id}: select a suitable photo`);
  const facts = productIllustrationFacts(product);
  const photo = await productPhoto(source);
  assert(photo.info.width > 1 && photo.info.height > 1, `${product.id}: empty photo`);
  const layers = [{input: photo.data, left: 1030 + Math.round((1230 - photo.info.width) / 2),
    top: 422 + Math.round((1050 - photo.info.height) / 2)}];
  async function place(value, size, weight, maxWidth, left, top) {
    const rendered = await ink(value, size, weight, maxWidth);
    assert(left + rendered.info.width < width && top + rendered.info.height < height, `${product.id}: clipping ${value}`);
    layers.push({input: rendered.data, left, top});
    return rendered.info.height;
  }
  const titleWidth = 1710;
  const largeTitle = await ink(product.name, 76, 700, titleWidth);
  const titleHeight = await place(product.name, largeTitle.info.height <= 254 ? 76 : 63, 700, titleWidth, 128, 124);
  assert(titleHeight <= 254, `${product.id}: oversized heading`);
  const top = Math.max(365, 182 + titleHeight);
  let row = top;
  for (const {name, value} of facts) {
    const labelHeight = await place(name, 45, 500, 855, 128, row);
    const valueHeight = await place(value, 57, 750, 855, 128, row + labelHeight + 12);
    row += labelHeight + valueHeight + 48;
  }
  const diagram = sectionDiagram(product, facts);
  if (diagram && row < 1350) {
    const diagramTop = Math.max(1040, row + 16);
    layers.push({input: diagram, left: 130, top: diagramTop});
    await place("Сечение без масштаба", 32, 500, 855, 128, diagramTop + 320);
  }
  const paintedRoofing = product.categoryId === "cat-pnf" && /RAL\s*\d/iu.test(product.name);
  const photoCaption = paintedRoofing ? "Фото профиля без окраски" : "Фото вида продукции";
  const caption = facts.length ? `${photoCaption}  ·  Размеры по каталогу` : photoCaption;
  await place(caption, 34, 500, 1230, 1030, 1607);
  const file = `${product.id}.webp`;
  assert(/^[a-z\d-]+\.webp$/u.test(file), product.id);
  await sharp({create: {width, height, channels: 3, background: white}})
    .composite(layers).webp({quality: 89, effort: 4}).toFile(path.join(output, file));
  return [product.id, {imageUrl: `/images/catalog/product-illustrations/${file}`,
    photoUrl: source, signature: productIllustrationSignature(product)}];
}

const result = [];
const batch = 4;
for (let start = 0; start < products.length; start += batch) {
  result.push(...await Promise.all(products.slice(start, start + batch).map(render)));
  if (start % 80 === 0) console.log(`Rendered ${result.length}/${products.length}`);
}
if (write) {
  await fs.mkdir(production, {recursive: true});
  for (const [id] of result) await fs.rename(path.join(output, `${id}.webp`), path.join(production, `${id}.webp`));
  // Keep dedicated family illustrations, including square pipes, in both full
  // and targeted generic renders.
  const previous = JSON.parse(await fs.readFile("data/product-illustrations.json", "utf8"));
  const manifest = JSON.stringify({...previous, ...Object.fromEntries(result)}, null, 2) + "\n";
  const temporaryManifest = path.join(output, "product-illustrations.json");
  await fs.writeFile(temporaryManifest, manifest);
  await fs.rename(temporaryManifest, "data/product-illustrations.json");
}
console.log(`${result.length} illustrations: ${write ? production : output}`);
