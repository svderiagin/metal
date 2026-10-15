/** Russian Snowball algorithm, including RV/R2 restrictions and longest suffix rules.
 * Specification: https://snowballstem.org/algorithms/russian/stemmer.html
 * Technical identifiers bypass this function entirely.
 */
const vowel = /[аеиоуыэюя]/;
const endings = (value: string) => value.split(" ").sort((a, b) => b.length - a.length);
const perfective = endings("ив ивши ившись ыв ывши ывшись");
const perfectiveConditional = endings("в вши вшись");
const adjective = endings("ее ие ые ое ими ыми ей ий ый ой ем им ым ом его ого ему ому их ых ую юю ая яя ою ею");
const participle = endings("ивш ывш ующ");
const participleConditional = endings("ем нн вш ющ щ");
const verb = endings("ила ыла ена ейте уйте ите или ыли ей уй ил ыл им ым ен ило ыло ено ят ует уют ит ыт ены ить ыть ишь ую ю");
const verbConditional = endings("ла на ете йте ли й л ем н ло но ет ют ны ть ешь нно");
const noun = endings("а ев ов ие ье е иями ями ами еи ии и ией ей ой ий й иям ям ием ем ам ом о у ах иях ях ы ь ию ью ю ия ья я");
const cache = new Map<string, string>();

export function russianStem(input: string): string {
  const word = input.toLowerCase().replace(/ё/g, "е");
  if (!/^[а-я]+$/.test(word)) return word;
  const cached = cache.get(word);
  if (cached !== undefined) return cached;
  const rv = word.search(vowel) + 1;
  if (!rv) return word;
  function nextRegion(start: number) {
    for (let i = start + 1; i < word.length; i++) if (vowel.test(word[i - 1]) && !vowel.test(word[i])) return i + 1;
    return word.length;
  }
  const r2 = nextRegion(nextRegion(0));
  let tail = word.slice(rv);
  function remove(suffixes: string[], conditional: string[] = []) {
    // Search the whole class before checking its condition, as specified by Snowball.
    const suffix = [...suffixes, ...conditional].sort((a, b) => b.length - a.length).find(s => tail.endsWith(s));
    if (!suffix || (conditional.includes(suffix) && !/[ая]/.test(tail[tail.length - suffix.length - 1] ?? ""))) return false;
    tail = tail.slice(0, -suffix.length);
    return true;
  }
  if (!remove(perfective, perfectiveConditional)) {
    remove(["ся", "сь"]);
    if (remove(adjective)) remove(participle, participleConditional);
    else if (!remove(verb, verbConditional)) remove(noun);
  }
  remove(["и"]);
  const derivation = ["ость", "ост"].find(s => tail.endsWith(s));
  if (derivation && rv + tail.length - derivation.length >= r2) tail = tail.slice(0, -derivation.length);
  if (tail.endsWith("нн")) tail = tail.slice(0, -1);
  else if (remove(["ейше", "ейш"])) { if (tail.endsWith("нн")) tail = tail.slice(0, -1); }
  else remove(["ь"]);
  const result = word.slice(0, rv) + tail;
  if (cache.size > 10000) cache.clear();
  cache.set(word, result);
  return result;
}

export function normalizeText(text: string): string {
  return text.normalize("NFKC").toLowerCase().replace(/ё/g, "е")
    .replace(/(\d),(?=\d)/g, "$1.")
    .replace(/(?<=\d)\s*[xх×*]\s*(?=\d)/g, "x")
    .replace(/(^|[^а-яa-z])(?:ду|dn)\s*(?=\d)/g, "$1ду ")
    .replace(/(^|\s)г\s*\/\s*к(?=\s|$)/g, "$1горячекатаный")
    .replace(/(^|\s)х\s*\/\s*к(?=\s|$)/g, "$1холоднокатаный")
    .replace(/(^|\s)э\s*\/\s*с(?=\s|$)/g, "$1электросварной")
    .replace(/\s+/g, " ").trim();
}

export function textWords(text: string): string[] {
  return normalizeText(text).match(/[а-яa-z]+/g) ?? [];
}
