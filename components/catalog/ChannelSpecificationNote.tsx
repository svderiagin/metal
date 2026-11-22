import {Icon} from "@/components/ui/Icon";
import {CatalogStandardLink} from "./CatalogPositionDetails";

export function ChannelSpecificationNote() {
  return <p className="mb-3 flex items-start gap-2.5 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2.5 text-sm text-slate-700 sm:px-4 dark:border-brand-800 dark:bg-brand-950 dark:text-slate-200">
    <Icon name="info" className="mt-0.5 text-brand-700 dark:text-brand-300"/>
    <span>Номинальные размеры и масса — по <CatalogStandardLink href="/documents/gost-8240-97.pdf#page=2">таблицам 1–2 ГОСТ 8240-97</CatalogStandardLink>.
      Серию У/П и фактические размеры уточняйте при заказе. Длина указана по каталогу поставщика.</span>
  </p>;
}
