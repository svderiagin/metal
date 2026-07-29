import type {Metadata} from "next";
import "./globals.css";
import {CartProvider} from "@/context/CartContext";
import {Header} from "@/components/layout/Header";
import {Footer} from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: {
    default: "Metal Store — металлопрокат и стальные трубы",
    template: "%s | Metal Store"
  }, description: "Каталог металлопроката и стальных труб с оформлением заказа, оплатой картой или по счёту."
};
export default function RootLayout({children}: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru">
  <body className="flex min-h-screen flex-col"><CartProvider><Header/>
    <main className="flex-1">{children}</main>
    <Footer/></CartProvider></body>
  </html>
}
