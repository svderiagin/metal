"use client";

import {useEffect, useEffectEvent, useState} from "react";
import type {ProductVariant} from "@/types/product";
import {resolveCatalogProductId} from "@/lib/catalogIdentity";

const anchorPrefix = "#variant-";

function linkedProductId(hash: string) {
  return hash.startsWith(anchorPrefix) ? resolveCatalogProductId(hash.slice(anchorPrefix.length)) : null;
}

// Search and cart links use the same anchor on desktop and mobile tables.
export function useLinkedVariant(variants: ProductVariant[], reveal: (variant: ProductVariant) => void, resultsPending = false) {
  const onReveal = useEffectEvent(reveal);
  const [targetId, setTargetId] = useState<string | null>(null);
  useEffect(() => {
    let timer: number;
    function followHash() {
      window.clearTimeout(timer);
      const productId = linkedProductId(window.location.hash);
      const variant = variants.find(item => item.id === productId);
      timer = window.setTimeout(() => {
        if (variant) onReveal(variant);
        setTargetId(variant?.id ?? null);
      }, 0);
    }
    followHash();
    window.addEventListener("hashchange", followHash);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("hashchange", followHash);
    };
  }, [variants]);

  useEffect(() => {
    // The row can exist before deferred search commits, at a different scroll position.
    if (!targetId || resultsPending) return;
    let attempts = 0;
    let frame = window.requestAnimationFrame(scroll);
    function scroll() {
      if (linkedProductId(window.location.hash) !== targetId) return;
      const prefix = window.matchMedia("(min-width: 1280px)").matches ? "variant-" : "variant-mobile-";
      const element = document.getElementById(prefix + targetId);
      if (element?.getClientRects().length) {
        element.scrollIntoView({block: "center"});
        setTargetId(null);
      } else if (++attempts < 120) {
        frame = window.requestAnimationFrame(scroll);
      }
    }
    return () => window.cancelAnimationFrame(frame);
  }, [targetId, resultsPending]);
}
