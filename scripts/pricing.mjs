// Apply once to the original published amount, using integer kopecks.
export const PRICE_MULTIPLIER = {numerator: 90n, denominator: 100n};
export function parsePrice(raw) {
 const text=String(raw??'').trim();
 const qualifier=/^от\s/i.test(text)?'from':'exact';
 const cleaned=text.replace(/^от\s+/i,'').replace(/[\s\u00a0\u202f]/g,'').replace(/(?:₽|руб\.?|RUB)(?:\/.*)?$/i,'').replace(',','.');
 if(!/^\d+(?:\.\d{1,2})?$/.test(cleaned))return null;
 const [whole,fraction='']=cleaned.split('.');
 const kopecks=BigInt(whole)*100n+BigInt(fraction.padEnd(2,'0'));
 return kopecks>0n?{kopecks,qualifier}:null;
}
export function discountedPrice(raw) {
 const parsed=parsePrice(raw);if(!parsed)return null;
 const {numerator,denominator}=PRICE_MULTIPLIER;
 return Number((parsed.kopecks*numerator+denominator/2n)/denominator)/100;
}
