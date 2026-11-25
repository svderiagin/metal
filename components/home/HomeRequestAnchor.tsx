"use client";

import {useEffect} from "react";
import {revealQuoteRequest} from "./revealQuoteRequest";

export function HomeRequestAnchor() {
  useEffect(() => {
    const section = document.getElementById("request");
    if (!section) return;

    let frame = 0;
    function alignRequest(behavior: ScrollBehavior) {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        if (window.location.hash === "#request") revealQuoteRequest(section, behavior);
      });
    }

    function followHash() {
      alignRequest("instant");
    }

    function followLocalLink(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey
        || !(event.target instanceof Element)) return;
      const link = event.target.closest<HTMLAnchorElement>("a[href]");
      const {origin, pathname, search, hash} = window.location;
      if (!link || link.origin !== origin || link.pathname !== pathname || link.search !== search || link.hash !== "#request"
        || (link.target && link.target !== "_self") || link.hasAttribute("download")) return;

      event.preventDefault();
      if (hash !== link.hash) window.history.pushState(null, "", link.hash);
      alignRequest("auto");
    }

    const active = document.activeElement;
    if (window.location.hash === "#request" && (active === document.body || active === section)) followHash();

    document.addEventListener("click", followLocalLink);
    window.addEventListener("hashchange", followHash);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("click", followLocalLink);
      window.removeEventListener("hashchange", followHash);
    };
  }, []);

  return null;
}
