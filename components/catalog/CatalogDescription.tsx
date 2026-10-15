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

export function CatalogDescription({description, className = "mt-6"}: {description: string; className?: string}) {
  return (
    <div className={`w-full space-y-4 text-[15px] leading-7 text-slate-700 sm:text-base sm:leading-7 ${className}`}>
      {paragraphs(description).map((paragraph, index) => (
        <p key={index}>
          {highlight(paragraph)}
        </p>
      ))}
    </div>
  );
}
