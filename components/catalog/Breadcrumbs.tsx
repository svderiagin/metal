import Link from "next/link";

export interface Crumb {
  label: string;
  href?: string
}

export function Breadcrumbs({items}: { items: Crumb[] }) {
  return (
    <nav aria-label="Хлебные крошки" className="mb-6 overflow-x-auto text-sm text-slate-500">
      <ol className="flex min-w-max items-center gap-2">
        <li>
          <Link href="/" className="rounded-sm transition-colors hover:text-red-700">
            Главная
          </Link>
        </li>
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center gap-2">
            <span aria-hidden>/</span>
            {item.href ? (
              <Link href={item.href} className="rounded-sm transition-colors hover:text-red-700">
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="font-medium text-slate-800">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
