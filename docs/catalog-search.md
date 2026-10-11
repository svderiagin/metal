# Catalog search

All 688 catalog variants share `lib/search/`: Russian Snowball stemming, scoped directional terminology aliases, structured technical parsing, bounded Damerau spelling correction and weighted relevance. No dependencies or search service were added. The algorithm specification is https://snowballstem.org/algorithms/russian/stemmer.html.

An index is built once per mounted catalog dataset. Normalized fields and vocabulary are precomputed; compiled queries are cached. React deferred values keep typing responsive. Names have the highest text weight, followed by attributes, category/family names, inferred product terminology and descriptions. Exact names/SKUs receive a large ranking bonus. All significant terms must match. Explicit user sorting still takes precedence over relevance.

Technical dimensions use ordered exact prefixes: `40х40` accepts any documented wall thickness, while `40х40х2` requires wall thickness 2. Latin x, Cyrillic х, ×, decimal commas and spaced dimensions normalize consistently. Grades and ГОСТ designations never receive fuzzy correction. Missing technical evidence excludes a product. Exact complete product names are recognized directly, including complex electrode designations and package weights.

The header submits to the existing `/catalog?q=` URL. The catalog searches while typing, shows ranked variant links and family cards, offers spelling suggestions, and loads additional results in batches. Category and variant tables use the same index with existing filters and pagination. Search submission preserves other URL parameters. Native inputs/buttons/links support keyboard access, and result announcements use an ARIA live region.

Examples: `профильных труб`, `строительную арматуру`, `металлические уголки`, `двутавр`, `проф труба`, `40 40 2`, `арматура Ø12`, `09Г2С`, `профилная труба`, `арматруа`, `швелер`.

Validation:

- `npm run search:check`: morphology, synonyms, technical constraints, corrections, partial input, every real product name, filters/pagination and full-catalog timing.
- `node scripts/check-search-browser.mjs`: requires the local site on port 3000 and Chrome CDP on 9223; checks desktop/mobile live queries, typing focus, category empty states and variant tables. Results go to `imports/search-browser-verification.json`.
- `npm run catalog:check`, `node --test scripts/images.test.mjs`, application ESLint (excluding downloaded `brokinvest.ru/**`) and `npm run build`.

Measured index construction: approximately 65 ms. Repeated full-catalog queries: approximately 4 ms each on the development machine; timings vary by device.

Limitations: stemming is not a full grammatical analyzer; irregular domain forms use explicit aliases. Spelling corrections are conservative and declined when equally plausible stems compete. Unknown units, complex packaging notation and incomplete specifications may require a simpler query or the exact full product name. Only the final word supports prefix completion. No transliteration or wrong-keyboard-layout correction is attempted. The editable terminology dictionary is `lib/search/terminology.ts`.
