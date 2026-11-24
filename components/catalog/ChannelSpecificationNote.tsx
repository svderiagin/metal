import {CatalogStandardReference} from "./CatalogStandardReference";
import {CatalogTableNote} from "./CatalogTableNote";

export function ChannelSpecificationNote({steelGrade}: {steelGrade?: string}) {
  return <CatalogTableNote>
    Серия П имеет параллельные грани полок, серия У — уклон внутренних граней.
    {" "}<CatalogStandardReference>Размеры и теоретическая масса 1 м приведены в таблице 2 ГОСТ 8240-97 для серии П и в таблице 1 ГОСТ 8240-97 для серии У.</CatalogStandardReference>
    {steelGrade && <> Сталь {steelGrade}.</>}
  </CatalogTableNote>;
}
