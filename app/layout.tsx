import type {Metadata} from "next";
import localFont from "next/font/local";
import "./globals.css";
import {CartProvider} from "@/context/CartContext";
import {Header} from "@/components/layout/Header";
import {Footer} from "@/components/layout/Footer";
import {themeInitScript} from "@/lib/theme";

const inter = localFont({
  src: "./fonts/InterVariable.woff2",
  variable: "--font-inter",
  weight: "100 900",
  style: "normal",
  display: "swap",
  adjustFontFallback: "Arial",
});

export const metadata: Metadata = {
  title: {
    default: "ООО «РВБ» — Металлоконструкции и металлопрокат",
    template: "%s | ООО «РВБ»"
  }, description: "Каталог металлоконструкций и металлопроката: подбор продукции и запрос расчёта поставки."
};
export default function RootLayout({children}: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru" className={inter.variable} suppressHydrationWarning>
  <head><script dangerouslySetInnerHTML={{__html: themeInitScript}}/></head>
  <body className="flex min-h-screen flex-col"><CartProvider>
    <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:p-4 focus:text-slate-950 focus:shadow-lg">Перейти к содержимому</a>
    <Header/>
    <main id="main-content" tabIndex={-1} className="flex-1">{children}</main>
    <Footer/></CartProvider></body>
  </html>
}
