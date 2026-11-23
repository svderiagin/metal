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

export const catalogStandardTables = {
  vgp: catalogStandards["3262"].href + "#Par103",
  electrowelded: catalogStandards["10704"].href + "#Par53",
  rebar: catalogStandards["5781"].href + "#i25093",
  channel: catalogStandards["8240"].href + "#Par91",
};
