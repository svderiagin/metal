import type {Category} from "@/types/category";
import type {ProductType, ProductVariant} from "@/types/product";
import {normalizeText, russianStem, textWords} from "./russian";
import {ALIASES_BY_STEM, expandCompoundQuery, STOP_WORDS} from "./terminology";
import {buildTechnicalDocument, parseTechnicalQuery, technicalMatch} from "./technical";
import {beamKind} from "@/lib/beam";

interface Field {words: Set<string>; stems: Set<string>; weight: number}
interface Document {product: ProductVariant; name: string; fields: Field[]; technical: ReturnType<typeof buildTechnicalDocument>}
interface Term {word: string; stem: string; prefix: boolean; corrected?: string}
export interface SearchHit {product: ProductVariant; score: number}
export interface SearchOptions {categoryId?: string; inStock?: boolean; material?: string; standard?: string; offset?: number; limit?: number}
export interface SearchResult {hits: SearchHit[]; total: number; correctedQuery?: string}

function field(text: string, weight: number): Field {
  const words = new Set(textWords(text).filter(w => !STOP_WORDS.has(w)));
  return {words, stems: new Set([...words].map(russianStem)), weight};
}

function semanticTerms(product: ProductVariant, technical: ReturnType<typeof buildTechnicalDocument>): string {
  const words = ["металлический металл"];
  const text = normalizeText([product.name, product.material, ...product.attributes.filter(a => a.key === "material").map(a => a.value)].join(" "));
  if (product.categoryId !== "cat-cve" && !/алюмин|медн|латун/.test(text)) words.push("стальной сталь");
  if (product.categoryId === "cat-arm") words.push("строительная");
  if (product.categoryId === "cat-bal") words.push("двутавровая двутавр", beamKind(product));
  if (product.categoryId === "cat-trp") {
    words.push("труба профильная");
    const shape = technical.dimensions.find(d => d.length >= 2);
    if (shape) words.push(shape[0] === shape[1] ? "квадратная" : "прямоугольная");
  }
  if (product.form === "bar") words.push("пруток");
  if (product.form === "coil") words.push("бунт бухта");
  return words.join(" ");
}

/** Bounded optimal-string-alignment Damerau distance; alphabetic words only. */
function editDistance(a: string, b: string, maximum: number): number {
  if (Math.abs(a.length - b.length) > maximum) return maximum + 1;
  const rows: number[][] = [Array.from({length: b.length + 1}, (_, i) => i)];
  for (let i = 1; i <= a.length; i++) {
    const row = [i];let smallest = i;
    for (let j = 1; j <= b.length; j++) {
      let value = Math.min(rows[i - 1][j] + 1, row[j - 1] + 1, rows[i - 1][j - 1] + Number(a[i - 1] !== b[j - 1]));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) value = Math.min(value, rows[i - 2][j - 2] + 1);
      row[j] = value;smallest = Math.min(smallest, value);
    }
    if (smallest > maximum) return maximum + 1;
    rows.push(row);
  }
  return rows[a.length][b.length];
}

export function createCatalogSearchIndex(products: ProductVariant[], types: ProductType[] = [], categories: Category[] = []) {
  const typeById = new Map(types.map(t => [t.id, t]));
  const categoryById = new Map(categories.map(c => [c.id, c]));
  const vocabulary = new Map<string, number>();
  const allStems = new Set<string>();
  const documents: Document[] = products.map(product => {
    const type = typeById.get(product.productTypeId), category = categoryById.get(product.categoryId);
    const technical = buildTechnicalDocument(product);
    const fields = [
      field(product.name + " " + product.sku, 160),
      field([product.material, ...product.attributes.map(a => a.value), ...product.specifications.map(s => s.value)].join(" "), 95),
      // Contextual description text belongs below exact product attributes, not technical constraints.
      field([category?.name ?? "", type?.name ?? ""].join(" "), 65),
      field(semanticTerms(product, technical), 55),
      field([product.shortDescription, product.description, type?.description ?? "", category?.description ?? ""].join(" "), 12),
    ];
    for (const f of fields) for (const stem of f.stems) allStems.add(stem);
    for (const f of fields.slice(0, 4)) for (const word of f.words) if (/^[а-я]{4,}$/.test(word)) vocabulary.set(word, (vocabulary.get(word) ?? 0) + 1);
    return {product, name: normalizeText(product.name), fields, technical};
  });
  const compiled = new Map<string, {terms: Term[]; technical: ReturnType<typeof parseTechnicalQuery>; correctedQuery?: string}>();

  function compile(input: string) {
    const cached = compiled.get(input);if (cached) return cached;
    const expanded = expandCompoundQuery(normalizeText(input));
    const technical = parseTechnicalQuery(expanded);
    const words = textWords(technical.wordsText).filter(w => !STOP_WORDS.has(w));
    let correctedQuery = normalizeText(input);
    const uniqueWords = [...new Set(words)];
    const terms = uniqueWords.map((word, i): Term => {
      const stem = russianStem(word);
      const prefix = i === uniqueWords.length - 1 && word.length >= 3;
      if (allStems.has(stem) || ALIASES_BY_STEM.has(stem) || (prefix && [...vocabulary.keys()].some(w => w.startsWith(word)))) return {word, stem, prefix};
      if (!/^[а-я]{4,}$/.test(word)) return {word, stem, prefix};
      const maximum = word.length >= 8 ? 2 : 1;
      let best = maximum + 1;const candidates: string[] = [];
      for (const candidate of vocabulary.keys()) {
        const distance = editDistance(word, candidate, maximum);
        if (distance < best) {best = distance;candidates.length = 0;}
        if (distance === best && distance <= maximum) candidates.push(candidate);
      }
      // Equal-distance alternatives with different stems are ambiguous: do not guess.
      if (best > maximum || new Set(candidates.map(russianStem)).size !== 1) return {word, stem, prefix};
      candidates.sort((a, b) => (vocabulary.get(b) ?? 0) - (vocabulary.get(a) ?? 0));
      const corrected = candidates[0];
      correctedQuery = correctedQuery.replace(word, corrected);
      return {word, stem: russianStem(corrected), prefix: false, corrected};
    });
    const value = {terms, technical, correctedQuery: correctedQuery !== normalizeText(input) ? correctedQuery : undefined};
    if (compiled.size > 200) compiled.clear();compiled.set(input, value);return value;
  }

  function termScore(term: Term, doc: Document): number {
    let best = 0;
    for (const f of doc.fields) {
      if (f.words.has(term.word)) best = Math.max(best, f.weight);
      if (f.stems.has(term.stem)) best = Math.max(best, f.weight * (term.corrected ? .4 : .94));
      if (term.prefix && [...f.words].some(w => w.startsWith(term.word))) best = Math.max(best, f.weight * .6);
      if (!term.corrected) for (const alias of ALIASES_BY_STEM.get(term.stem) ?? []) {
        if (alias.categoryIds && !alias.categoryIds.includes(doc.product.categoryId)) continue;
        if (alias.alternatives.some(word => f.stems.has(russianStem(word)))) best = Math.max(best, f.weight * alias.weight);
      }
    }
    return best;
  }

  function search(input: string, options: SearchOptions = {}): SearchResult {
    const query = input.trim().slice(0, 250);
    const {terms, technical, correctedQuery} = compile(query);
    const hasTechnical = technical.dimensions.length || technical.numbers.length || technical.grades.length || technical.standards.length || technical.nominalBore || technical.diameter || technical.thickness || technical.sku;
    if (query && !terms.length && !hasTechnical) return {hits: [], total: 0};
    const hits: SearchHit[] = [];
    for (const doc of documents) {
      const p = doc.product;
      if (options.categoryId && options.categoryId !== p.categoryId) continue;
      if (options.inStock && !p.inStock) continue;
      if (options.material && !p.attributes.some(a => a.key === "material" && a.value === options.material)) continue;
      if (options.standard && p.standard !== options.standard) continue;
      const exactName = normalizeText(query) === doc.name || normalizeText(query) === doc.technical.sku;
      if (!exactName && !technicalMatch(technical, doc.technical, p)) continue;
      const scores = terms.map(term => termScore(term, doc));
      if (!exactName && scores.some(score => !score)) continue;
      let score = scores.reduce((sum, s) => sum + s, 0) + (hasTechnical ? 250 : 0);
      if (normalizeText(query) === doc.name || normalizeText(query) === doc.technical.sku) score += 10000;
      else if (query && doc.name.includes(normalizeText(query))) score += 100;
      hits.push({product: p, score});
    }
    hits.sort((a, b) => b.score - a.score || a.product.name.localeCompare(b.product.name, "ru", {numeric: true}) || a.product.id.localeCompare(b.product.id));
    const offset = Math.max(0, options.offset ?? 0), limit = Math.max(0, options.limit ?? hits.length);
    return {hits: hits.slice(offset, offset + limit), total: hits.length, correctedQuery};
  }
  return {search, size: documents.length};
}
