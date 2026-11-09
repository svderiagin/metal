import Link from "next/link";

export interface Crumb {
  label: string;
  href?: string
}

export function Breadcrumbs({items}: { items: Crumb[] }) {
  return (
    <nav aria-label="Хлебные крошки" className="mb-4 text-sm text-slate-500 dark:text-slate-400">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <li>
          <Link href="/" className="inline-flex min-h-6 items-center rounded-sm transition-colors hover:text-brand-700 dark:hover:text-brand-400">
            Главная
          </Link>
        </li>
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex min-w-0 items-center gap-2">
            <span aria-hidden>/</span>
            {item.href ? (
              <Link href={item.href} className="inline-flex min-h-6 items-center rounded-sm transition-colors hover:text-brand-700 dark:hover:text-brand-400">
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="font-medium text-slate-800 dark:text-slate-200">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
