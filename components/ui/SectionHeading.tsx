export function SectionHeading({eyebrow, title, description}: {
  eyebrow?: string;
  title: string;
  description?: string
}) {
  return (
    <div className="mb-6 max-w-3xl sm:mb-8">
      {eyebrow && (
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-red-700 dark:text-red-400">
          {eyebrow}
        </p>
      )}
      <h2 className="text-2xl font-black tracking-tight text-slate-950 dark:text-slate-100 sm:text-3xl">
        {title}
      </h2>
      {description && <p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">{description}</p>}
    </div>
  );
}
