#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const skillDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const root = path.resolve(skillDir, '../../..');
process.chdir(root);

const {readProjectData} = await import(pathToFileURL(path.join(root, 'scripts/project-data.mjs')));
const {categories} = readProjectData('data/categories.ts');
const {subcategories} = readProjectData('data/subcategories.ts');
const {productVariants} = readProjectData('data/products/index.ts');
const snapshotPath = path.join(root, 'imports/protected-catalog.snapshot.json');
const snapshot = fs.existsSync(snapshotPath) ? JSON.parse(fs.readFileSync(snapshotPath, 'utf8')) : null;
const protectedIds = new Set(snapshot?.categories.map(category => category.id) ?? []);

const categoryIds = new Set(categories.map(category => category.id));
const subcategoryIds = new Set(subcategories.map(subcategory => subcategory.id));
const orphans = {
  subcategories: subcategories.filter(item => !categoryIds.has(item.categoryId)).map(item => item.id),
  products: productVariants.filter(item => !categoryIds.has(item.categoryId) || !subcategoryIds.has(item.subcategoryId)).map(item => item.id),
};
const exact = snapshot ? {
  categories: JSON.stringify(categories.filter(category => protectedIds.has(category.id))) === JSON.stringify(snapshot.categories),
  subcategories: JSON.stringify(subcategories.filter(subcategory => protectedIds.has(subcategory.categoryId))) === JSON.stringify(snapshot.subcategories),
  products: JSON.stringify(productVariants.filter(product => protectedIds.has(product.categoryId))) === JSON.stringify(snapshot.products),
} : null;

console.log(JSON.stringify({
  totals: {categories: categories.length, subcategories: subcategories.length, products: productVariants.length},
  categories: categories.map(category => ({
    id: category.id,
    slug: category.slug,
    subcategories: subcategories.filter(item => item.categoryId === category.id).length,
    products: productVariants.filter(item => item.categoryId === category.id).length,
  })),
  orphans,
  protectedSnapshotExact: exact,
}, null, 2));

if (orphans.subcategories.length || orphans.products.length || (exact && Object.values(exact).includes(false))) {
  process.exitCode = 1;
}
