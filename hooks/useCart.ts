"use client";
import {useContext} from "react";
import {CartContext} from "@/context/CartContext";

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart должен использоваться внутри CartProvider");
  return value;
}
