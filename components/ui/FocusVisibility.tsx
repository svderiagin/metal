"use client";

import {useEffect} from "react";

export function FocusVisibility() {
  useEffect(() => {
    const root = document.documentElement;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Tab") root.setAttribute("data-keyboard-navigation", "");
    }
    function handlePointerDown() {
      root.removeAttribute("data-keyboard-navigation");
    }
    document.addEventListener("keydown", handleKeyDown, true);
    document.addEventListener("pointerdown", handlePointerDown, true);
    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      document.removeEventListener("pointerdown", handlePointerDown, true);
      root.removeAttribute("data-keyboard-navigation");
    };
  }, []);
  return null;
}
