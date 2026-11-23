import {Icon, type IconName} from "@/components/ui/Icon";
import styles from "./CatalogFieldIllustration.module.css";

// Imported characteristics keep their supplier labels, including units and ГОСТ references.
const symbols: readonly [RegExp, IconName][] = [
  [/диаметр|условный проход/iu, "diameter"],
  [/ячейк/iu, "mesh"],
  [/покрыти|покраск|цвет|текстур|поверхност/iu, "coating"],
  [/толщин|профил|сери|форм[аы] поставки|тип балки|класс арматуры/iu, "layers"],
  [/ширин|высот|допуск/iu, "ruler"],
  [/размер|формат|сечение/iu, "expand"],
  [/марка стали|материал/iu, "shield"],
];

export function CatalogFieldIllustration({label, roundWall}: {label: string; roundWall?: boolean}) {
  const drawing = label === "Размер профиля" ? styles.section : label === "Толщина стенки" ? styles.wall
    : /^длина/iu.test(label) ? styles.length : /^(теоретическая масса|справочная масса|масса|вес)/iu.test(label) ? styles.mass : undefined;
  return <span aria-hidden="true" className={`${styles.tile} mb-2 grid size-12 place-items-center rounded-lg bg-brand-50 text-brand-700 dark:bg-slate-800 dark:text-brand-300 @min-[32rem]:absolute @min-[32rem]:start-0 @min-[32rem]:top-0 @min-[32rem]:mb-0`}>
    {drawing ? <span className={`${styles.drawing} ${drawing} ${roundWall ? styles.roundWall : ""}`}/>
      : <Icon name={symbols.find(([match]) => match.test(label))?.[1] ?? "clipboard"}/>}
  </span>;
}
