"use client";
import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { CART_STORAGE_KEY } from "@/lib/constants"; import { getCategoryById, getProductById } from "@/lib/catalog"; import type { CartItem, CartLine } from "@/types/cart";
interface CartContextValue { items:CartItem[]; lines:CartLine[]; hydrated:boolean; totalQuantity:number; totalAmount:number; addItem:(id:string,q?:number)=>void; updateQuantity:(id:string,q:number)=>void; removeItem:(id:string)=>void; clearCart:()=>void; }
export const CartContext=createContext<CartContextValue|undefined>(undefined);
const normalize=(items:CartItem[])=>items.filter(i=>getProductById(i.productId)&&Number.isInteger(i.quantity)&&i.quantity>0).map(i=>({...i,quantity:Math.min(i.quantity,999)}));
export function CartProvider({children}:{children:ReactNode}){const [items,setItems]=useState<CartItem[]>([]);const [hydrated,setHydrated]=useState(false);
 useEffect(()=>{const timer=window.setTimeout(()=>{try{const raw=localStorage.getItem(CART_STORAGE_KEY);if(raw)setItems(normalize(JSON.parse(raw) as CartItem[]));}catch{}finally{setHydrated(true)}},0);return()=>window.clearTimeout(timer)},[]);
 useEffect(()=>{if(hydrated)localStorage.setItem(CART_STORAGE_KEY,JSON.stringify(items))},[items,hydrated]);
 const addItem=useCallback((productId:string,quantity=1)=>setItems(prev=>{const safe=Math.max(1,Math.min(999,Math.floor(quantity)));const found=prev.find(i=>i.productId===productId);return found?prev.map(i=>i.productId===productId?{...i,quantity:Math.min(999,i.quantity+safe)}:i):[...prev,{productId,quantity:safe}]}),[]);
 const updateQuantity=useCallback((productId:string,quantity:number)=>{if(!Number.isFinite(quantity)||quantity<1)return;setItems(prev=>prev.map(i=>i.productId===productId?{...i,quantity:Math.min(999,Math.floor(quantity))}:i))},[]);
 const removeItem=useCallback((productId:string)=>setItems(prev=>prev.filter(i=>i.productId!==productId)),[]);const clearCart=useCallback(()=>setItems([]),[]);
 const lines=useMemo(()=>items.flatMap(item=>{const p=getProductById(item.productId);if(!p)return[];const c=getCategoryById(p.categoryId);return [{...item,name:p.name,slug:p.slug,categorySlug:c?.slug??"catalog",sku:p.sku,price:p.price,priceUnit:p.priceUnit}]}),[items]);
 const value=useMemo(()=>({items,lines,hydrated,totalQuantity:items.reduce((s,i)=>s+i.quantity,0),totalAmount:lines.reduce((s,i)=>s+i.price*i.quantity,0),addItem,updateQuantity,removeItem,clearCart}),[items,lines,hydrated,addItem,updateQuantity,removeItem,clearCart]);return <CartContext value={value}>{children}</CartContext>}
