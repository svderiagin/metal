const sentenceSegmenter = new Intl.Segmenter("ru", {granularity: "sentence"});

// Break at existing changes of subject; keep short descriptions together.
const paragraphStart = /^(?:ГОСТ|Основной стандарт|Сортамент|Стандарты представленных|По толщине|При выборе|Основные параметры|Для выбора|Для подбора|Для применения в несущих|Неоцинкованные|После резки|Места повреждения|Применяется|Применяются|Используется|Используются)/u;
const emphasis = /(ГОСТ(?:\s+Р)?\s+\d+(?:[.−–-]\d+)*|не менее \d+(?:[.,]\d+)? МПа|Основные параметры выбора|Для выбора|Для подбора|По толщине стенки|Условный проход(?:\s*\(Ду\))?|Применяются|Используются)/gu;

function paragraphs(description: string): string[] {
  return description.split(/\n\s*\n/u).flatMap(block => {
    if (block.length <= 280) return [block];

    const result: string[] = [];
    let paragraph = "";
    for (const {segment} of sentenceSegmenter.segment(block)) {
      if (paragraph && (paragraphStart.test(segment.trimStart()) || paragraph.length + segment.length > 420)) {
        result.push(paragraph);
        paragraph = "";
      }
      paragraph += segment;
    }
    if (paragraph) result.push(paragraph);
    return result;
  }).filter(paragraph => paragraph.trim());
}

function highlight(text: string) {
  return text.split(emphasis).map((part, index) => index % 2
    ? <strong key={index} className="font-semibold">{part}</strong>
    : part);
}

function richText(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/u).map((part, index) => part.startsWith("**") && part.endsWith("**")
    ? <strong key={index} className="font-semibold">{part.slice(2, -2)}</strong>
    : <span key={index}>{highlight(part)}</span>);
}

export function CatalogDescription({description, className = "mt-6", variant = "default"}: {
  description: string;
  className?: string;
  variant?: "default" | "category" | "categoryDetails";
}) {
  const blocks = description.split(/\n\s*\n/u).filter(block => block.trim());
  const typography = variant === "categoryDetails"
    ? "max-w-[800px] space-y-4 text-base font-normal leading-[1.6] text-slate-700"
    : variant === "category"
      ? "max-w-[80ch] space-y-3 text-[15px] leading-6 text-slate-700 sm:space-y-4 sm:text-base sm:leading-[1.6]"
    : "w-full space-y-4 text-[15px] leading-7 text-slate-700 sm:text-base sm:leading-7";
  return (
    <div className={`${typography} ${className}`}>
      {blocks.flatMap((block, blockIndex) => {
        const lines = block.split("\n").map(line => line.trim()).filter(Boolean);
        if (lines.length > 0 && lines.every(line => line.startsWith("- "))) {
          return [<ul key={`list-${blockIndex}`} className="list-disc space-y-2 pl-6">
            {lines.map((line, lineIndex) => <li key={lineIndex}>{richText(line.slice(2))}</li>)}
          </ul>];
        }
        const semanticParagraphs = variant === "category" || variant === "categoryDetails" ? [block] : paragraphs(block);
        return semanticParagraphs.map((paragraph, paragraphIndex) => (
          <p key={`paragraph-${blockIndex}-${paragraphIndex}`}>{richText(paragraph)}</p>
        ));
      })}
    </div>
  );
}
