"use client";

import {useEffect} from "react";

export function HomeRequestAnchor() {
  useEffect(() => {
    if (window.location.hash !== "#request") return;
    const section = document.getElementById("request");
    if (!section) return;

    const active = document.activeElement;
    if (active !== document.body && active !== section) return;

    // Complete the fragment jump after the home page is ready.
    section.scrollIntoView({block: "start", behavior: "instant"});
    section.focus({preventScroll: true});
  }, []);

  return null;
}
