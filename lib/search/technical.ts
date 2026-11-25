import type {ProductVariant} from "@/types/product";
import {normalizeText} from "./russian";
import {beamProfile, beamSeries, type BeamSeries} from "@/lib/beam";
import {isMetalMeshVariant, metalMeshFormat, metalMeshSpecification} from "@/lib/metalMesh";
import {getSheetParameters} from "@/lib/sheetPresentation";
import {isMeasuredElectroweldedVariant} from "@/lib/pipeFamily";
import {a240SubcategoryId, a40025g2sSubcategoryId} from "@/lib/rebar";
import {getVariantAttribute} from "@/lib/variantPresentation";

const number = "\\d+(?:\\.\\d+)?";
const dimensionPattern = new RegExp(`(?<![а-яa-z\\d.])${number}(?:x${number})+(?![а-яa-z\\d.])`, "g");
const dimensionUnit = "мм|mm|м|m";
const measuredNumber = `${number}(?:\\s*(?:${dimensionUnit}))?`;
const queryDimensionPattern = new RegExp(`(?<![а-яa-z\\d.])${measuredNumber}(?:\\s*[xх×*]\\s*${measuredNumber})+(?![а-яa-z\\d.])`, "g");
const dimensionPartPattern = new RegExp(`(${number})(?:\\s*(${dimensionUnit}))?`, "g");
const ralPattern = /(?<![а-яa-z\d])ral\s*(\d{4})(?![а-яa-z\d])/g;
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
interface DimensionPart {value: string; unit?: "mm" | "m"}
function parseDimensionParts(chain: string): DimensionPart[] {
  return [...chain.matchAll(dimensionPartPattern)].map(([, value, unit]) => ({
    value: canonicalNumber(value), unit: unit ? unit.length === 1 ? "m" : "mm" : undefined,
  }));
}

export interface TechnicalDocument {
  dimensions: string[][];
  sheet: ReturnType<typeof getSheetParameters>;
  electroweldedDimensions?: [string, string, string];
  meshDimensions?: DimensionPart[][];
  primary: Set<string>;
  numbers: Set<string>;
  grades: Set<string>;
  standards: Set<string>;
}
export interface TechnicalQuery {dimensions: DimensionPart[][]; numbers: string[]; grades: string[]; standards: string[]; nominalBore?: string; diameter?: string; thickness?: string; beamSeries?: BeamSeries; wordsText: string; invalid: boolean}

export function buildTechnicalDocument(product: ProductVariant): TechnicalDocument {
  const specs = product.specifications;
  const gradeText = [product.steelGrade ?? "", ...product.attributes.filter(a => a.key === "grade" || a.key === "class").map(a => a.value), ...specs.filter(s => /марка|класс/i.test(s.name)).map(s => s.value)].join(" ");
  const stdText = [product.standard, product.name, ...specs.filter(s => /стандарт|гост|^технические условия$/i.test(s.name)).map(s => s.value)].join(" ");
  const electrowelded = isMeasuredElectroweldedVariant(product);
  const offerName = electrowelded ? product.sourceProductName ?? "" : "";
  const chains = dimensions(`${product.name} ${offerName}`);
  const sheet = getSheetParameters(product);
  const meshDimensions = isMetalMeshVariant(product)
    ? [product.name, metalMeshSpecification(product, "Размер ячейки"), metalMeshFormat(product)]
      .flatMap(value => normalizeText(value).match(queryDimensionPattern) ?? [])
      .map(parseDimensionParts)
    : undefined;
  let electroweldedDimensions: TechnicalDocument["electroweldedDimensions"];
  if (electrowelded && product.lengthMeters !== undefined) {
    electroweldedDimensions = [String(product.diameterMm), String(product.wallThicknessMm), String(Math.round(product.lengthMeters * 1000))];
    chains.push(electroweldedDimensions);
  }
  for (const spec of specs.filter(s => /профил|размер|сечение/i.test(s.name))) chains.push(...dimensions(spec.value));
  const primary = new Set(chains.map(chain => chain[0]));
  if (product.categoryId === "catalog-cat-shtaketnik") {
    const dimensions = (["width", "wallThickness", "length"] as const)
      .map(key => canonicalNumber(getVariantAttribute(product, key)));
    if (dimensions.every(value => Number(value) > 0)) {
      chains.push(dimensions);
      for (const value of dimensions) primary.add(value);
    }
  }
  if (product.diameterMm !== undefined) primary.add(String(product.diameterMm));
  if (sheet) primary.add(canonicalNumber(sheet.thickness));
  for (const spec of specs) if (/диаметр|размер/i.test(spec.name) || (/толщина/i.test(spec.name) && product.categoryId === "cat-pnf")) {
    const match = normalizeText(spec.value).match(/^\d+(?:\.\d+)?$/); if (match) primary.add(canonicalNumber(match[0]));
  }
  // Editable demo rows have a single size, not a fully specified hollow section.
  for (const attr of product.attributes.filter(a => a.key === "size")) {
    const match = normalizeText(attr.value).match(/^(\d+(?:\.\d+)?)\s*(?:мм)?$/);if (match) primary.add(canonicalNumber(match[1]));
  }
  const grades = new Set([...identifiers(gradeText), ...identifiers(`${product.name} ${offerName}`).filter(t => !/^[\d.]+х[\dх.]+$/.test(t))]);
  const ral = product.ralCode || Array.from(normalizeText(product.name).matchAll(ralPattern))[0]?.[1];
  if (ral) grades.add(canonicalIdentifier(`ral${ral}`));
  if (electrowelded && /^\d{1,2}$/.test(product.steelGrade ?? "")) grades.add(`ст${product.steelGrade}`);
  if (product.categoryId === "cat-bal") {
    const profile = beamProfile(product);
    if (/^\d+(?:[.,]\d+)?[БШКМ]\d*$/.test(profile)) grades.add(canonicalIdentifier(profile));
  }
  // Ст3сп/пс explicitly lists two variants; the second suffix inherits the written grade root.
  for (const m of normalizeText(gradeText + " " + product.name).matchAll(/(ст\d+)(сп|пс|кп)\s*\/\s*(сп|пс|кп)/g)) grades.add(m[1] + m[3]);
  const standardSet = new Set(standards(stdText));
  if (product.categoryId === "cat-arm") {
    if (standardSet.has("34028")) standardSet.add("34028-2016");
    if (standardSet.has("5781")) standardSet.add("5781-82");
  }
  if (product.subcategoryId === a40025g2sSubcategoryId) {
    grades.add("а400");
    grades.add("а3");
  }
  if (product.subcategoryId === a240SubcategoryId && grades.has("а240с")) {
    grades.add("а240");
    grades.add("а1");
  }
  if (product.categoryId === "cat-bal") {
    for (const match of normalizeText(product.standard).matchAll(/;\s*(\d+(?:\.\d+)*(?:-\d+)?)/g)) standardSet.add(match[1]);
  }
  const numbers = new Set([...primary, ...chains.flat(), ...[...standardSet].flatMap(s => [s, s.split("-")[0]])]);
  if (ral) numbers.add(ral);
  return {dimensions: chains, sheet, electroweldedDimensions, meshDimensions, primary, numbers, grades, standards: standardSet};
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
  text = text.replace(/гост\s*(?:р\s*)?(\d+(?:\.\d+)*(?:-\d+)?)/g, (_, value: string) => {query.standards.push(value);return " ";});
  text = text.replace(ralPattern, (_, value: string) => {
    query.grades.push(canonicalIdentifier(`ral${value}`));
    return " ";
  });
  text = text.replace(/(^|[^а-яa-z])ду\s*(\d+(?:\.\d+)?)/g, (_, prefix: string, value: string) => {query.nominalBore = canonicalNumber(value);return prefix + value;});
  text = text.replace(queryDimensionPattern, chain => {
    query.dimensions.push(parseDimensionParts(chain));
    return " ";
  });
  text = text.replace(/(?:[øØ⌀ф]\s*|диаметр(?:ом)?\s*)(\d+(?:\.\d+)?)/g, (_, value: string) => {query.diameter = canonicalNumber(value);return " ";});
  text = text.replace(/толщин(?:а|ой|у)\s*(\d+(?:\.\d+)?)/g, (_, value: string) => {query.thickness = canonicalNumber(value);return " ";});
  text = text.replace(/(^|[^а-яa-z\d])(?:сталь\s+|ст\.\s*|ст\s+)(\d{1,2}(?:сп|пс|кп)?)(?![а-яa-z\d.])/g, "$1ст$2");
  // A standalone spaced sequence is an ordered section, never a bag of fuzzy numbers.
  text = text.replace(/(?:^|\s)(\d+(?:\.\d+)?(?:\s+\d+(?:\.\d+)?){1,3})(?=\s|$)/g, (_, chain: string) => {
    query.dimensions.push(chain.trim().split(/\s+/).map(value => ({value: canonicalNumber(value)})));
    return " ";
  });
  text = text.replace(/[а-яa-z\d]+(?:\.[\d]+)?/g, token => {
    if (/\d/.test(token) && /[а-яa-z]/.test(token)) {query.grades.push(canonicalIdentifier(token));return " ";}
    if (/^\d+(?:\.\d+)?$/.test(token)) {query.numbers.push(canonicalNumber(token));return " ";}
    return token;
  });
  query.invalid = /\d/.test(text); // Do not silently drop unrecognised numeric notation.
  query.wordsText = text;
  return query;
}

function matchesMillimeters(part: DimensionPart, millimeters: string, inferMeters = false) {
  if (part.unit !== "m" && part.value === millimeters) return true;
  return (part.unit === "m" || !part.unit && inferMeters) && part.value === String(Number(millimeters) / 1000);
}

function dimensionMatches(chain: DimensionPart[], doc: TechnicalDocument, product: ProductVariant) {
  if (doc.sheet && chain.length === 2) {
    const {width, length, thickness} = doc.sheet;
    return (matchesMillimeters(chain[0], width, true) && matchesMillimeters(chain[1], length, true))
      || (matchesMillimeters(chain[0], canonicalNumber(thickness)) && matchesMillimeters(chain[1], width, true));
  }
  if (doc.sheet && chain.length === 3) {
    const {width, length, thickness} = doc.sheet;
    return matchesMillimeters(chain[0], canonicalNumber(thickness))
      && matchesMillimeters(chain[1], width, true)
      && matchesMillimeters(chain[2], length, true);
  }
  const {electroweldedDimensions} = doc;
  if (electroweldedDimensions && chain.length <= 3) {
    return chain.every((part, index) => matchesMillimeters(part, electroweldedDimensions[index], index === 2));
  }
  if (doc.meshDimensions && chain.some(part => part.unit)) {
    // A mesh cell is measured in millimeters, while the sheet or roll can use meters.
    return doc.meshDimensions.some(candidate => chain.every((part, index) => {
      const stored = candidate[index];
      return part.value === stored?.value && (!part.unit || part.unit === (stored.unit ?? candidate.at(-1)?.unit));
    }));
  }
  if (product.categoryId === "cat-trp") {
    return doc.dimensions.some(candidate => chain.every((part, index) => matchesMillimeters(part, candidate[index])));
  }
  return doc.dimensions.some(candidate => chain.every((part, index) => part.value === candidate[index]));
}

export function technicalMatch(query: TechnicalQuery, doc: TechnicalDocument, product: ProductVariant): boolean {
  if (query.beamSeries && beamSeries(product) !== query.beamSeries) return false;
  if (query.invalid) return false;
  if (!query.dimensions.every(chain => dimensionMatches(chain, doc, product))) return false;
  if (!query.numbers.every(n => Number(n) < 500 ? doc.primary.has(n) : doc.numbers.has(n))) return false;
  if (query.nominalBore && !(product.nominalBoreMm === Number(query.nominalBore)
    || product.specifications.some(s => /условный проход|^ду$|^dn$/i.test(s.name) && canonicalNumber(s.value) === query.nominalBore))) return false;
  if (query.diameter && !(product.diameterMm === Number(query.diameter) || product.specifications.some(s => /диаметр/i.test(s.name) && canonicalNumber(s.value) === query.diameter))) return false;
  if (query.thickness && !doc.sheet) {
    const thicknesses = product.specifications.filter(s => /толщина/i.test(s.name)).map(s => canonicalNumber(s.value));
    if (!thicknesses.includes(query.thickness) && !(product.categoryId === "cat-pnf" && doc.primary.has(query.thickness))) return false;
  }
  if (query.thickness && doc.sheet && canonicalNumber(doc.sheet.thickness) !== query.thickness) return false;
  if (!query.standards.every(s => [...doc.standards].some(candidate => candidate === s || (!s.includes("-") && candidate.split("-")[0] === s)))) return false;
  return query.grades.every(g => doc.grades.has(g) || (/^ст\d+$/.test(g) && [...doc.grades].some(candidate => new RegExp(`^${g}(?:сп|пс|кп)$`).test(candidate))));
}
