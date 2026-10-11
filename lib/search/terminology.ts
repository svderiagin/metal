import {russianStem} from "./russian";

export const STOP_WORDS = new Set("и в во на по с со для из от до к у о об при за или купить цена стоимость найти нужен нужна нужны мне мм миллиметр миллиметра миллиметров м метр метров гост размер размеры диаметром диаметр толщиной толщина".split(" "));

export interface SearchAlias {query: string; alternatives: string[]; categoryIds?: string[]; weight: number}
// Directional, scoped expansions. A 'пруток' is not universally equivalent to rebar;
// 'профиль' only expands to pipe terminology inside the profile-pipe category.
export const SEARCH_ALIASES: SearchAlias[] = [
  {query: "уголки", alternatives: ["уголок"], weight: .94},
  {query: "уголок", alternatives: ["уголки"], weight: .94},
  {query: "проф", alternatives: ["профильный"], categoryIds: ["cat-trp"], weight: .85},
  {query: "профиль", alternatives: ["профильный"], categoryIds: ["cat-trp"], weight: .7},
  {query: "кругляк", alternatives: ["круг"], categoryIds: ["cat-kru"], weight: .85},
  {query: "пруток", alternatives: ["круг"], categoryIds: ["cat-kru"], weight: .65},
  {query: "двутавр", alternatives: ["балка", "двутавровый"], categoryIds: ["cat-bal"], weight: .85},
  {query: "двутавровый", alternatives: ["балка"], categoryIds: ["cat-bal"], weight: .85},
  {query: "нержавейка", alternatives: ["нержавеющий"], weight: .85},
  {query: "оцинковка", alternatives: ["оцинкованный", "оц"], weight: .85},
  {query: "оцинкованный", alternatives: ["оц"], weight: .9},
  {query: "оц", alternatives: ["оцинкованный"], weight: .85},
  {query: "вгп", alternatives: ["водогазопроводный"], categoryIds: ["cat-trs"], weight: .9},
  {query: "водогазопроводный", alternatives: ["вгп"], categoryIds: ["cat-trs"], weight: .9},
  {query: "гк", alternatives: ["горячекатаный"], weight: .9},
  {query: "хк", alternatives: ["холоднокатаный"], weight: .9},
  {query: "эсв", alternatives: ["электросварной"], categoryIds: ["cat-trs", "cat-trp"], weight: .85},
  {query: "эсвпш", alternatives: ["электросварной"], categoryIds: ["cat-trs"], weight: .85},
  {query: "электросварный", alternatives: ["электросварной"], weight: .95},
];

export function expandCompoundQuery(query: string): string {
  return query.replace(/(^|[^а-яa-z])профтруб([а-я]*)(?=$|[^а-яa-z])/g, "$1профильная труба")
    .replace(/(^|[^а-яa-z])рифленк([а-я]*)(?=$|[^а-яa-z])/g, "$1рифленый лист");
}

export const ALIASES_BY_STEM = new Map<string, SearchAlias[]>();
for (const alias of SEARCH_ALIASES) {
  const stem = russianStem(alias.query);
  ALIASES_BY_STEM.set(stem, [...(ALIASES_BY_STEM.get(stem) ?? []), alias]);
}
