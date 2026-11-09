const items = [
  {
    title: "По спецификации",
    description: "Сопоставляем вид проката, размеры и количество в заявке.",
  },
  {
    title: "Контроль комплектации",
    description: "Сверяем маркировку и состав отгрузки с заказом.",
  },
  {
    title: "Резка в размер",
    description: "Согласовываем подготовку заготовок по ведомости длин.",
  },
  {
    title: "Доставка на объект",
    description: "Подбираем транспорт с учётом массы и длины проката.",
  },
];

export function AdvantagesSection() {
  return (
    <section aria-labelledby="home-supply-heading">
      <div className="mb-5">
        <p className="mb-1 text-eyebrow uppercase text-slate-500 dark:text-slate-400">Поставка</p>
        <h2 id="home-supply-heading" className="text-section-title text-slate-950 dark:text-slate-100">Комплектация заказа</h2>
      </div>
      <ul className="grid gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 dark:border-slate-700 dark:bg-slate-700 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item, index) => (
          <li key={item.title} className="bg-white p-4 dark:bg-slate-900 sm:p-5">
            <div className="flex items-baseline gap-3">
              <span aria-hidden="true" className="shrink-0 text-xs font-medium tabular-nums text-slate-500 dark:text-slate-400">0{index + 1}</span>
              <h3 className="text-card-title text-slate-950 dark:text-slate-100">{item.title}</h3>
            </div>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{item.description}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
