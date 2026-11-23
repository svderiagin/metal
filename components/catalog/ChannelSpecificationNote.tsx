import {CatalogStandardLink} from "./CatalogStandardReference";
import {catalogStandardTables} from "@/lib/catalogStandards";
import {CatalogTableNote} from "./CatalogTableNote";

export function ChannelSpecificationNote() {
  return <CatalogTableNote>
    Номинальные размеры и масса — по <CatalogStandardLink href={catalogStandardTables.channel}>таблицам 1–2 <span className="whitespace-nowrap">ГОСТ 8240-97</span></CatalogStandardLink>.
    Серию У/П и фактические размеры уточняйте при заказе. Длина — по каталогу поставщика.
  </CatalogTableNote>;
}
