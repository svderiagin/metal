"use client";

import {useEffect, useEffectEvent} from "react";
import type {ProductVariant} from "@/types/product";

// Search and cart links use the same anchor on desktop and mobile tables.
export function useLinkedVariant(variants: ProductVariant[], reveal: (variant: ProductVariant) => void) {
  const onReveal = useEffectEvent(reveal);
  useEffect(() => {
    let timer: number;
    let frame = 0;
    function followHash() {
      window.clearTimeout(timer);
      window.cancelAnimationFrame(frame);
      const variant = variants.find(item => `#variant-${item.id}` === window.location.hash);
      if (!variant) return;
      timer = window.setTimeout(() => {
        onReveal(variant);
        // Wait for deferred search and React to reveal the linked row.
        let attempts = 0;
        function scroll() {
          const prefix = window.matchMedia("(min-width: 1280px)").matches ? "variant-" : "variant-mobile-";
          const element = document.getElementById(prefix + variant!.id);
          if (element?.getClientRects().length) element.scrollIntoView({block: "center"});
          else if (++attempts < 120) frame = window.requestAnimationFrame(scroll);
        }
        frame = window.requestAnimationFrame(scroll);
      }, 0);
    }
    followHash();
    window.addEventListener("hashchange", followHash);
    return () => {
      window.clearTimeout(timer);
      window.cancelAnimationFrame(frame);
      window.removeEventListener("hashchange", followHash);
    };
  }, [variants]);
}
