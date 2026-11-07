export function SectionHeading({eyebrow, title, description}: {
  eyebrow?: string;
  title: string;
  description?: string
}) {
  return (
    <div className="mb-6 max-w-3xl sm:mb-8">
      {eyebrow && (
        <p className="mb-2 text-eyebrow uppercase text-brand-700 dark:text-brand-400">
          {eyebrow}
        </p>
      )}
      <h2 className="text-section-title text-slate-950 dark:text-slate-100">
        {title}
      </h2>
      {description && <p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">{description}</p>}
    </div>
  );
}
