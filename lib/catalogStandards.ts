const meganorm = "https://meganorm.ru/";
const documents = meganorm + "mega_doc/norm/gost_gosudarstvennyj-standart/";

export const catalogStandards: Readonly<Record<string, {year: string; href: string}>> = {
  "2590": {year: "2006", href: meganorm + "Data1/54/54160/index.htm"},
  "2591": {year: "2006", href: meganorm + "Data1/54/54522/index.htm"},
  "3262": {year: "75", href: documents + "5/gost_3262-75_gosudarstvennyy_standart_soyuza_ssr_truby.html"},
  "5781": {year: "82", href: meganorm + "Data1/3/3937/index.htm"},
  "8240": {year: "97", href: documents + "3/gost_8240-97_shvellery_stalnye_goryachekatanye_sortament_utv.html"},
  "8509": {year: "93", href: meganorm + "Data1/3/3969/index.htm"},
  "8510": {year: "86", href: meganorm + "Data2/1/4294852/4294852729.htm"},
  "10704": {year: "91", href: documents + "0/gost_10704-91_mezhgosudarstvennyy_standart_truby_stalnye.html"},
  "10705": {year: "80", href: documents + "2/gost_10705-80_mezhgosudarstvennyy_standart_truby_stalnye.html"},
  "10706": {year: "76", href: documents + "4/gost_10706-76_st_sev_489-77_truby_stalnye_elektrosvarnye.html"},
  "19425": {year: "74", href: meganorm + "Data2/1/4294852/4294852659.htm"},
  "19903": {year: "2015", href: documents + "2/gost_19903-2015_mezhgosudarstvennyy_standart_prokat_listovoy.html"},
  "27772": {year: "2021", href: documents + "0/gost_27772-2021_mezhgosudarstvennyy_standart_prokat_dlya.html"},
  "34028": {year: "2016", href: meganorm + "Data2/1/4293746/4293746568.htm"},
  "35087": {year: "2024", href: meganorm + "mega_doc/norm_update_04112024/gost_gosudarstvennyj-standart/0/gost_35087-2024_mezhgosudarstvennyy_standart_dvutavry.html"},
};

const channelStandardPdf = meganorm + "Data2/1/4294847/4294847929.pdf";
const catalogStandardTables: Record<string, Partial<Record<number, string>>> = {
  "2591-2006": {1: meganorm + "Data/476/47679.pdf#page=4"},
  "3262-75": {1: meganorm + "Data2/1/4294852/4294852785.htm#i95506"},
  "5781-82": {
    1: catalogStandards["5781"].href + "#i25093",
    5: catalogStandards["5781"].href + "#i138592",
  },
  "8240-97": {1: channelStandardPdf + "#page=5", 2: channelStandardPdf + "#page=6"},
  "8509-93": {1: catalogStandards["8509"].href + "#i26415"},
  "8510-86": {1: catalogStandards["8510"].href + "#i18743"},
  "10704-91": {1: catalogStandards["10704"].href + "#Par53"},
  "34028-2016": {4: catalogStandards["34028"].href + "#i325258"},
};

const datedStandard = /ГОСТ\s+(\d+(?:\.\d+)*)[-‐‑–—−](\d+)/u;
const numberedTable = /[Тт]аблиц[аеуы]\s+(\d+)/u;
export const catalogStandardTableReference = /(?:[Тт]аблиц[аеуы]\s+\d+\s+ГОСТ\s+\d+(?:\.\d+)*[-‐‑–—−]\d+|ГОСТ\s+\d+(?:\.\d+)*[-‐‑–—−]\d+\s+\([Тт]аблица\s+\d+\))/u;

export function getCatalogStandardTableHref(reference: string) {
  const standard = datedStandard.exec(reference);
  const table = numberedTable.exec(reference);
  return standard && table ? catalogStandardTables[`${standard[1]}-${standard[2]}`]?.[Number(table[1])] : undefined;
}
