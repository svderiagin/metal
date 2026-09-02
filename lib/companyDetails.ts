const legalAddressLines = [
  "142181, Московская область,",
  "г. о. Подольск, д. Коледино,",
  "тер. Индустриальный парк Коледино,",
  "д. 6, стр. 1",
] as const;

export const companyDetails = {
  legalName: 'Общество с ограниченной ответственностью «РВБ»',
  shortName: 'ООО «РВБ»',
  ogrn: "1247700471919",
  inn: "9714053621",
  kpp: "507401001",
  bank: {
    account: "4070281080000020353",
    name: 'ООО «Вайлдберриз Банк»',
    correspondentAccount: "30101810245250000450",
    bik: "044525450",
  },
  legalAddress: legalAddressLines.join(" "),
  legalAddressLines,
  generalDirector: "Мирзоян Роберт Георгиевич",
} as const;
