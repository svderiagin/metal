const ones = ["", "один", "два", "три", "четыре", "пять", "шесть", "семь", "восемь", "девять"];
const teens = ["десять", "одиннадцать", "двенадцать", "тринадцать", "четырнадцать", "пятнадцать", "шестнадцать", "семнадцать", "восемнадцать", "девятнадцать"];
const tens = ["", "", "двадцать", "тридцать", "сорок", "пятьдесят", "шестьдесят", "семьдесят", "восемьдесят", "девяносто"];
const hundreds = ["", "сто", "двести", "триста", "четыреста", "пятьсот", "шестьсот", "семьсот", "восемьсот", "девятьсот"];

function plural(value: number, forms: readonly string[]) {
  const tail = value % 100;
  return forms[tail >= 11 && tail <= 19 ? 2 : value % 10 === 1 ? 0 : value % 10 >= 2 && value % 10 <= 4 ? 1 : 2];
}

export function amountInWords(amount: number): string {
  const kopecks = Math.round(amount * 100);
  if (!Number.isSafeInteger(kopecks) || kopecks < 0) throw new Error("INVALID_INVOICE_AMOUNT");
  let rubles = Math.floor(kopecks / 100);
  const words: string[] = [];
  const groups = [["", "", ""], ["тысяча", "тысячи", "тысяч"], ["миллион", "миллиона", "миллионов"],
    ["миллиард", "миллиарда", "миллиардов"], ["триллион", "триллиона", "триллионов"]];
  for (let group = 0; rubles > 0; group++, rubles = Math.floor(rubles / 1000)) {
    const value = rubles % 1000;
    if (!value) continue;
    const last = value % 100;
    const unit = value % 10;
    const block = [hundreds[Math.floor(value / 100)], last >= 10 && last < 20 ? teens[last - 10] :
      [tens[Math.floor(last / 10)], group === 1 && unit === 1 ? "одна" : group === 1 && unit === 2 ? "две" : ones[unit]].filter(Boolean).join(" "),
      plural(value, groups[group])].filter(Boolean).join(" ");
    words.unshift(block);
  }
  if (!words.length) words.push("ноль");
  const text = `${words.join(" ")} ${plural(Math.floor(kopecks / 100), ["рубль", "рубля", "рублей"])} ${String(kopecks % 100).padStart(2, "0")} ${plural(kopecks % 100, ["копейка", "копейки", "копеек"])}`;
  return text[0].toUpperCase() + text.slice(1);
}

// Prices and line totals already include VAT. Extract per line to retain cent agreement.
export function includedVat(subtotals: number[], rate: number): number {
  return subtotals.reduce((sum, amount) => sum + Math.round(Math.round(amount * 100) * rate / (100 + rate)), 0) / 100;
}
