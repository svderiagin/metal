import { armaturaProducts } from "./armatura";
import { balkaProducts } from "./balka";
import { katankaProducts } from "./katanka";
import { kvadratProducts } from "./kvadrat";
import { krugProducts } from "./krug";
import { listovoyProkatProducts } from "./listovoyProkat";
import { otvodyProducts } from "./otvody";
import { polosaProducts } from "./polosa";
import { provolokaProducts } from "./provoloka";
import { trubyStalnyeProducts } from "./trubyStalnye";
import { trubyNerzhaveyushchieProducts } from "./trubyNerzhaveyushchie";
import { trubyProfilnyeProducts } from "./trubyProfilnye";
import { ugolokProducts } from "./ugolok";
import { shvellerProducts } from "./shveller";
import { shestigrannikProducts } from "./shestigrannik";
import { tsvetnoyMetalloprokatProducts } from "./tsvetnoyMetalloprokat";
import type { Product } from "@/types/product";

export const products: Product[] = [
  ...armaturaProducts,
  ...balkaProducts,
  ...katankaProducts,
  ...kvadratProducts,
  ...krugProducts,
  ...listovoyProkatProducts,
  ...otvodyProducts,
  ...polosaProducts,
  ...provolokaProducts,
  ...trubyStalnyeProducts,
  ...trubyNerzhaveyushchieProducts,
  ...trubyProfilnyeProducts,
  ...ugolokProducts,
  ...shvellerProducts,
  ...shestigrannikProducts,
  ...tsvetnoyMetalloprokatProducts,
];
