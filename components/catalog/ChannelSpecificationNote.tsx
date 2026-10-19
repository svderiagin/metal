export function ChannelSpecificationNote() {
  return <p className="my-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
    Номинальные размеры и теоретическая масса — по <a href="https://www.metall-energy.ru/data/file/gosty/shveller/gost_8240-97.pdf" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-slate-900 dark:hover:text-slate-200">ГОСТ 8240-97, таблицы 1–2</a> (серии У/П).
    {" "}Серию и фактические параметры партии уточняйте при заказе. Длина — по каталогу поставщика.
  </p>;
}
