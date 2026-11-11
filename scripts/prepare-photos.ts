import {createHash} from "node:crypto";
import {existsSync} from "node:fs";
import {mkdir, readFile, rename, writeFile} from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import {catalogCoverGalleries} from "../data/catalog-cover-galleries";
import {HERO_SLIDES} from "../data/hero-slides";
import {getAllCategories, getFeaturedProductTypes} from "../lib/catalog";
import type {PreparedPhoto} from "../lib/server/preparedPhotos";

const heroWidths = [384, 480, 640, 750, 828, 1080, 1440, 1920, 2560];
const thumbnailWidths = [96, 128, 192, 256, 320, 384];
const categoryWidths = [320, 384, 480, 640, 750, 828, 1080, 1440];
// Match Next.js 16.4.5's default output quality for q=75.
const avifOptions = {quality: 47, effort: 3};
const webpOptions = {quality: 75};
const recipe = JSON.stringify({avifOptions, webpOptions, versions: sharp.versions, resize: "auto-orient-width-v1"});
const images = new Map<string, Set<number>>();

function schedule(src: string | undefined, widths: number[]) {
  if (!src || !/\.(avif|jpe?g|png|webp)$/i.test(src) || !existsSync(`public${src}`)) return;
  const pending = images.get(src) ?? new Set<number>();
  widths.forEach(width => pending.add(width));
  images.set(src, pending);
}

for (const slide of HERO_SLIDES) schedule(slide.src, heroWidths);
for (const category of getAllCategories()) {
  const cover = catalogCoverGalleries[category.id]?.cover ?? category.imageUrl;
  schedule(category.imageUrl, categoryWidths);
  schedule(cover, [...thumbnailWidths, 480, 640, 750, 828, 1080]);
}
for (const type of getFeaturedProductTypes()) schedule(type.imageUrl, thumbnailWidths);

async function prepare(src: string, requestedWidths: Set<number>): Promise<PreparedPhoto> {
  const input = await readFile(`public${src}`);
  const version = createHash("sha256").update(recipe).update(input).digest("hex").slice(0, 16);
  const metadata = await sharp(input).metadata();
  const nativeWidth = metadata.autoOrient.width;
  const widths = [...new Set([...requestedWidths].map(width => Math.min(width, nativeWidth)))].sort((a, b) => a - b);
  const name = src.slice("/images/".length, -path.extname(src).length);
  const directory = `/images/prepared/${name}`;
  await mkdir(`public${directory}`, {recursive: true});

  const variants = {avif: [] as string[], webp: [] as string[]};
  let fallback = "";
  for (const width of widths) {
    const image = sharp(input).autoOrient().resize({width, withoutEnlargement: true});
    for (const format of ["avif", "webp"] as const) {
      const file = `${directory}/${width}-${version}.${format}`;
      if (!existsSync(`public${file}`)) {
        const encoder = format === "avif" ? image.clone().avif(avifOptions) : image.clone().webp(webpOptions);
        const temporary = `public${file}.${process.pid}.tmp`;
        await writeFile(temporary, await encoder.toBuffer());
        await rename(temporary, `public${file}`);
      }
      const url = file.split("/").map(encodeURIComponent).join("/");
      variants[format].push(`${url} ${width}w`);
      if (format === "webp" && !fallback) fallback = url;
    }
  }
  return {avif: variants.avif.join(", "), webp: variants.webp.join(", "), fallback};
}

async function main() {
  const entries = [...images.entries()];
  const photos: Record<string, PreparedPhoto> = {};
  const batchSize = 4;
  for (let start = 0; start < entries.length; start += batchSize) {
    const batch = entries.slice(start, start + batchSize);
    const prepared = await Promise.all(batch.map(([src, widths]) => prepare(src, widths)));
    batch.forEach(([src], index) => { photos[src] = prepared[index]; });
  }
  await mkdir(".tmp", {recursive: true});
  const temporary = `.tmp/prepared-photos.${process.pid}.tmp`;
  await writeFile(temporary, JSON.stringify(photos));
  await rename(temporary, ".tmp/prepared-photos.json");
  console.log(`Prepared responsive photos for ${entries.length} sources`);
}

void main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
