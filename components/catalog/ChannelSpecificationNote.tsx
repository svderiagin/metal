import {CatalogStandardReference} from "./CatalogStandardReference";
import {CatalogTableNote} from "./CatalogTableNote";

export function ChannelSpecificationNote() {
  return <CatalogTableNote>
    <CatalogStandardReference>Номинальные размеры и масса приведены в таблице 1 ГОСТ 8240-97 для серии У и в таблице 2 ГОСТ 8240-97 для серии П.</CatalogStandardReference>
    Серию У/П и фактические размеры уточняйте при заказе. Длина — по каталогу поставщика.
  </CatalogTableNote>;
}
