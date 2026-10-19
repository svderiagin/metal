import type {ProductVariant} from "@/types/product";
import {normalizeText} from "./russian";
import {beamProfile, beamSeries, type BeamSeries} from "@/lib/beam";

const number = "\\d+(?:\\.\\d+)?";
const dimensionPattern = new RegExp(`(?<![а-яa-z\\d.])${number}(?:x${number})+(?![а-яa-z\\d.])`, "g");
export const canonicalNumber = (value: string) => String(Number(value.replace(",", ".").replace(/\s/g, "")));
export function canonicalIdentifier(value: string): string {
  const text = normalizeText(value);
  // Homoglyph mapping is limited to identifiers, never ordinary Russian words.
  return text.replace(/[acbhekmoptxy]/g, c => ({a:"а",c:"с",b:"в",h:"н",e:"е",k:"к",m:"м",o:"о",p:"р",t:"т",x:"х",y:"у"}[c] ?? c));
}
function identifiers(text: string): string[] {
  return (normalizeText(text).match(/[а-яa-z\d]+/g) ?? []).filter(t => /\d/.test(t) && /[а-яa-z]/.test(t)).map(canonicalIdentifier);
}
function dimensions(text: string): string[][] {
  return (normalizeText(text).match(dimensionPattern) ?? []).map(chain => chain.split("x").map(canonicalNumber));
}
function standards(text: string): string[] {
  return [...normalizeText(text).matchAll(/гост\s*(?:р\s*)?(\d+(?:\.\d+)*(?:-\d+)?)/g)].map(m => m[1]);
}
export interface TechnicalDocument {dimensions: string[][]; primary: Set<string>; numbers: Set<string>; grades: Set<string>; standards: Set<string>; sku: string}
export interface TechnicalQuery {dimensions: string[][]; numbers: string[]; grades: string[]; standards: string[]; nominalBore?: string; diameter?: string; thickness?: string; sku?: string; beamSeries?: BeamSeries; wordsText: string; invalid: boolean}

export function buildTechnicalDocument(product: ProductVariant): TechnicalDocument {
  const specs = product.specifications;
  const gradeText = [product.steelGrade ?? "", ...product.attributes.filter(a => a.key === "grade" || a.key === "class").map(a => a.value), ...specs.filter(s => /марка|класс/i.test(s.name)).map(s => s.value)].join(" ");
  const stdText = [product.standard, product.name, ...specs.filter(s => /стандарт|гост/i.test(s.name)).map(s => s.value)].join(" ");
  const chains = dimensions(product.name);
  for (const spec of specs.filter(s => /профил|размер|сечение/i.test(s.name))) chains.push(...dimensions(spec.value));
  const primary = new Set(chains.map(chain => chain[0]));
  if (product.diameterMm !== undefined) primary.add(String(product.diameterMm));
  for (const spec of specs) if (/диаметр|размер/i.test(spec.name) || (/толщина/i.test(spec.name) && product.categoryId === "cat-pnf")) {
    const match = normalizeText(spec.value).match(/^\d+(?:\.\d+)?$/); if (match) primary.add(canonicalNumber(match[0]));
  }
  // Editable demo rows have a single size, not a fully specified hollow section.
  for (const attr of product.attributes.filter(a => a.key === "size")) {
    const match = normalizeText(attr.value).match(/^(\d+(?:\.\d+)?)\s*(?:мм)?$/);if (match) primary.add(canonicalNumber(match[1]));
  }
  const grades = new Set([...identifiers(gradeText), ...identifiers(product.name).filter(t => !/^[\d.]+х[\dх.]+$/.test(t))]);
  if (product.categoryId === "cat-bal") {
    const profile = beamProfile(product);
    if (/^\d+(?:[.,]\d+)?[БШКМ]\d*$/.test(profile)) grades.add(canonicalIdentifier(profile));
  }
  // Ст3сп/пс explicitly lists two variants; the second suffix inherits the written grade root.
  for (const m of normalizeText(gradeText + " " + product.name).matchAll(/(ст\d+)(сп|пс|кп)\s*\/\s*(сп|пс|кп)/g)) grades.add(m[1] + m[3]);
  const standardSet = new Set(standards(stdText));
  if (product.categoryId === "cat-bal") {
    for (const match of normalizeText(product.standard).matchAll(/;\s*(\d+(?:\.\d+)*(?:-\d+)?)/g)) standardSet.add(match[1]);
  }
  const numbers = new Set([...primary, ...chains.flat(), ...[...standardSet].flatMap(s => [s, s.split("-")[0]])]);
  return {dimensions: chains, primary, numbers, grades, standards: standardSet, sku: normalizeText(product.sku)};
}

export function parseTechnicalQuery(input: string): TechnicalQuery {
  let text = normalizeText(input).replace(/(\d)мм(?=$|[^а-яa-z])/g, "$1 мм");
  const query: TechnicalQuery = {dimensions: [], numbers: [], grades: [], standards: [], wordsText: "", invalid: false};
  text = text.replace(/(балк[а-я]*|двутавр[а-я]*)\s+([бшкм])(?=\s|$)/g, (_, noun: string, series: string) => {
    query.beamSeries = series.toUpperCase() as BeamSeries;
    return noun;
  });
  // A named beam family is a profile constraint even when descriptions mention other families.
  if (!query.beamSeries && /(?:^|\s)(?:балк[а-я]*|двутавр[а-я]*)(?=\s|$)/.test(text)) {
    const family = text.match(/(?:^|\s)(нормальн|широкополочн|колонн|монорельсов)[а-я]*(?=\s|$)/);
    if (family) {
      const namedSeries: Record<string, BeamSeries> = {нормальн: "Б", широкополочн: "Ш", колонн: "К", монорельсов: "М"};
      query.beamSeries = namedSeries[family[1]];
    }
  }
  text = text.replace(/(?:ms|мп)-\d+/g, sku => {query.sku = sku; return " ";});
  text = text.replace(/гост\s*(?:р\s*)?(\d+(?:\.\d+)*(?:-\d+)?)/g, (_, value: string) => {query.standards.push(value);return " ";});
  text = text.replace(/(^|[^а-яa-z])ду\s*(\d+(?:\.\d+)?)/g, (_, prefix: string, value: string) => {query.nominalBore = canonicalNumber(value);return prefix + value;});
  text = text.replace(/(?:[øØ⌀ф]\s*|диаметр(?:ом)?\s*)(\d+(?:\.\d+)?)/g, (_, value: string) => {query.diameter = canonicalNumber(value);return " ";});
  text = text.replace(/толщин(?:а|ой|у)\s*(\d+(?:\.\d+)?)/g, (_, value: string) => {query.thickness = canonicalNumber(value);return " ";});
  text = text.replace(dimensionPattern, chain => {query.dimensions.push(chain.split("x").map(canonicalNumber));return " ";});
  // A standalone spaced sequence is an ordered section, never a bag of fuzzy numbers.
  text = text.replace(/(?:^|\s)(\d+(?:\.\d+)?(?:\s+\d+(?:\.\d+)?){1,3})(?=\s|$)/g, (_, chain: string) => {query.dimensions.push(chain.trim().split(/\s+/).map(canonicalNumber));return " ";});
  text = text.replace(/[а-яa-z\d]+(?:\.[\d]+)?/g, token => {
    if (/\d/.test(token) && /[а-яa-z]/.test(token)) {query.grades.push(canonicalIdentifier(token));return " ";}
    if (/^\d+(?:\.\d+)?$/.test(token)) {query.numbers.push(canonicalNumber(token));return " ";}
    return token;
  });
  query.invalid = /\d/.test(text); // Do not silently drop unrecognised numeric notation.
  query.wordsText = text;
  return query;
}

export function technicalMatch(query: TechnicalQuery, doc: TechnicalDocument, product: ProductVariant): boolean {
  if (query.beamSeries && beamSeries(product) !== query.beamSeries) return false;
  if (query.invalid || (query.sku && query.sku !== doc.sku)) return false;
  if (!query.dimensions.every(chain => doc.dimensions.some(candidate => chain.every((part, i) => part === candidate[i])))) return false;
  if (!query.numbers.every(n => Number(n) < 500 ? doc.primary.has(n) : doc.numbers.has(n))) return false;
  if (query.nominalBore && !(product.nominalBoreMm === Number(query.nominalBore)
    || product.specifications.some(s => /условный проход|^ду$|^dn$/i.test(s.name) && canonicalNumber(s.value) === query.nominalBore))) return false;
  if (query.diameter && !(product.diameterMm === Number(query.diameter) || product.specifications.some(s => /диаметр/i.test(s.name) && canonicalNumber(s.value) === query.diameter))) return false;
  if (query.thickness) {
    const thicknesses = product.specifications.filter(s => /толщина/i.test(s.name)).map(s => canonicalNumber(s.value));
    if (!thicknesses.includes(query.thickness) && !(product.categoryId === "cat-pnf" && doc.primary.has(query.thickness))) return false;
  }
  if (!query.standards.every(s => [...doc.standards].some(candidate => candidate === s || (!s.includes("-") && candidate.split("-")[0] === s)))) return false;
  return query.grades.every(g => doc.grades.has(g) || (/^ст\d+$/.test(g) && [...doc.grades].some(candidate => new RegExp(`^${g}(?:сп|пс|кп)$`).test(candidate))));
}
